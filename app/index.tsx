import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Linking, Switch, Platform,
    ToastAndroid, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { popularSubjects, Subject } from '../src/lib/data/subjects';
import {
    downloadPaper,
    getSessionName,
    getPaperTypeName,
    DownloadParams,
    saveToDownloadsDirect,
    getPdfUrl,
    generateSmartFilename,
    hasDownloadsFolderPermission,
    requestDownloadsFolderPermission
} from '../src/lib/paperDownloader';
import * as Sharing from 'expo-sharing';

// Student Access Control
import { useAccessControl } from '../src/hooks/useAccessControl';
import { StudentDetailModal } from '../src/components/StudentDetailModal';

const BRAND_COLOR = '#1e3a5f';
const ACCENT_COLOR = '#0d9488';
const SUCCESS_COLOR = '#10b981';
const ERROR_COLOR = '#ef4444';
const CARD_SHADOW = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
};

type PaperType = 'qp' | 'ms' | 'er';
type Session = 'm' | 's' | 'w';

// Download item for queue
interface DownloadItem {
    id: string;
    name: string;
    status: 'downloading' | 'saving' | 'done' | 'error';
    error?: string;
}

export default function HomeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        selectedCode?: string;
        selectedName?: string;
        selectedSlug?: string;
        selectedLevel?: string;
        prefillPaper?: string;
        prefillYear?: string;
        prefillSession?: string;
    }>();

    // Form state
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [paperCode, setPaperCode] = useState('22');
    const [startYear, setStartYear] = useState('2023');
    const [endYear, setEndYear] = useState('2023');
    const [batchMode, setBatchMode] = useState(false);
    const [sessions, setSessions] = useState<Record<Session, boolean>>({ m: false, s: true, w: false });
    const [paperType, setPaperType] = useState<PaperType>('qp');

    // Download queue state
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [showDownloads, setShowDownloads] = useState(false);

    // Access control for student details
    const {
        requireAccess,
        showDetailModal,
        setShowDetailModal,
        onStudentVerified,
        isVerified,
        studentDetails,
    } = useAccessControl();

    // REQUEST FOLDER PERMISSION ON FIRST LAUNCH
    useEffect(() => {
        const checkAndRequestPermission = async () => {
            if (Platform.OS !== 'android') return;

            const PERMISSION_ASKED_KEY = 'downloads_permission_asked';
            const alreadyAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);

            if (!alreadyAsked) {
                // Mark as asked so we don't ask again
                await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');

                // Check if permission already granted
                const hasPermission = await hasDownloadsFolderPermission();

                if (!hasPermission) {
                    // Show explanation alert, then request permission
                    Alert.alert(
                        '📂 Downloads Folder Access',
                        'To save papers directly to your Downloads folder, please select the Downloads folder when prompted.\n\nThis is a one-time setup.',
                        [
                            {
                                text: 'Setup Now',
                                onPress: async () => {
                                    const result = await requestDownloadsFolderPermission();
                                    if (result.granted) {
                                        Alert.alert('✅ Setup Complete', 'Papers will now save directly to Downloads!');
                                    }
                                }
                            },
                            { text: 'Later', style: 'cancel' }
                        ]
                    );
                }
            }
        };

        checkAndRequestPermission();
    }, []);

    // Handle subject selection and prefill from search
    useEffect(() => {
        if (params.selectedCode && params.selectedName) {
            setSelectedSubject({
                code: params.selectedCode,
                name: params.selectedName,
                slug: params.selectedSlug || '',
                level: (params.selectedLevel || 'igcse') as 'igcse' | 'olevel' | 'alevel',
            });

            if (params.prefillPaper) setPaperCode(params.prefillPaper);
            if (params.prefillYear) setStartYear(params.prefillYear);
            if (params.prefillSession) {
                const sess = params.prefillSession as Session;
                setSessions({ m: sess === 'm', s: sess === 's', w: sess === 'w' });
            }
        }
    }, [params.selectedCode, params.selectedName, params.prefillPaper, params.prefillYear]);

    const toggleSession = (s: Session) => {
        setSessions(prev => ({ ...prev, [s]: !prev[s] }));
    };

    // Helper to update a download in the queue
    const updateDownload = (id: string, updates: Partial<DownloadItem>) => {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    };

    // Add download to queue and start it
    const startDownload = async (params: DownloadParams, name: string) => {
        const id = `${params.subject.code}_${params.paperCode}_${params.year}_${params.session}_${Date.now()}`;

        // Add to queue
        setDownloads(prev => [...prev, { id, name, status: 'downloading' }]);
        setShowDownloads(true);

        // Show toast
        if (Platform.OS === 'android') {
            ToastAndroid.show(`📥 ${name}`, ToastAndroid.SHORT);
        }

        try {
            const result = await downloadPaper(params);

            if (result.success && result.localUri && result.filename) {
                updateDownload(id, { status: 'saving' });

                const saveResult = await saveToDownloadsDirect(result.localUri, result.filename);

                if (saveResult.success) {
                    updateDownload(id, { status: 'done' });
                    if (Platform.OS === 'android') {
                        ToastAndroid.show(`✅ ${name}`, ToastAndroid.SHORT);
                    }
                } else {
                    updateDownload(id, { status: 'error', error: saveResult.message });
                }
            } else {
                updateDownload(id, { status: 'error', error: result.error || 'Not found' });
            }
        } catch (error: any) {
            updateDownload(id, { status: 'error', error: error.message || 'Failed' });
        }
    };

    // DIRECT DOWNLOAD - Background, queue-based (with access control)
    const handleDirectDownload = () => {
        if (!selectedSubject) {
            Alert.alert('Select Subject', 'Please select a subject first');
            return;
        }

        const activeSession = Object.entries(sessions).find(([_, active]) => active)?.[0] as Session || 's';

        const params: DownloadParams = {
            subject: selectedSubject,
            paperCode,
            year: parseInt(startYear),
            session: activeSession,
            paperType,
        };

        const name = `${selectedSubject.code} P${paperCode} ${getSessionName(activeSession)} ${startYear}`;

        // Wrap download with access control - requires student details first
        requireAccess(() => {
            startDownload(params, name);
        });
    };

    // Navigate to preview screen (with access control)
    const handlePreview = () => {
        if (!selectedSubject) {
            Alert.alert('Select Subject', 'Please select a subject first');
            return;
        }

        const activeSession = Object.entries(sessions).find(([_, active]) => active)?.[0] as Session || 's';

        const downloadParams: DownloadParams = {
            subject: selectedSubject,
            paperCode,
            year: parseInt(startYear),
            session: activeSession,
            paperType,
        };

        const pdfUrl = getPdfUrl(downloadParams);

        // Wrap preview with access control
        requireAccess(() => {
            router.push({
                pathname: '/preview',
                params: {
                    subjectCode: selectedSubject.code,
                    subjectName: selectedSubject.name,
                    subjectSlug: selectedSubject.slug,
                    subjectLevel: selectedSubject.level,
                    paperCode,
                    year: startYear,
                    session: activeSession,
                    paperType,
                    pdfUrl,
                }
            });
        });
    };

    // Batch download (multiple papers) - with access control
    const handleBatchDownload = () => {
        if (!selectedSubject) {
            Alert.alert('Select Subject', 'Please select a subject first');
            return;
        }

        const start = parseInt(startYear);
        const end = parseInt(endYear);
        const activeSessions = Object.entries(sessions).filter(([_, active]) => active).map(([s]) => s as Session);

        if (activeSessions.length === 0) {
            Alert.alert('Select Session', 'Please select at least one session');
            return;
        }

        // Wrap batch download with access control
        requireAccess(() => {
            // Add all papers to queue
            for (let year = start; year <= end; year++) {
                for (const session of activeSessions) {
                    const params: DownloadParams = {
                        subject: selectedSubject,
                        paperCode,
                        year,
                        session,
                        paperType,
                    };
                    const name = `${selectedSubject.code} P${paperCode} ${getSessionName(session)} ${year}`;
                    startDownload(params, name);
                }
            }
        });
    };

    // Clear completed downloads
    const clearCompleted = () => {
        setDownloads(prev => prev.filter(d => d.status === 'downloading' || d.status === 'saving'));
    };

    const handleShare = async (uri: string) => {
        try {
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Could not share');
        }
    };

    // Active downloads count
    const activeCount = downloads.filter(d => d.status === 'downloading' || d.status === 'saving').length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Student Detail Modal */}
            <StudentDetailModal
                visible={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                onSuccess={onStudentVerified}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header with gradient effect */}
                <View style={styles.header}>
                    <View style={styles.headerGradient}>
                        <Text style={styles.brandName}>IGCSE on Fingertips</Text>
                        <Text style={styles.tagline}>Download Past Papers Instantly</Text>
                    </View>
                </View>

                {/* Question Search Card */}
                <TouchableOpacity style={styles.searchCard} onPress={() => router.push('/search')}>
                    <View style={styles.searchIconContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                    </View>
                    <View style={styles.searchContent}>
                        <Text style={styles.searchTitle}>Question Bank Search</Text>
                        <Text style={styles.searchHint}>Find paper by pasting a question</Text>
                    </View>
                    <Text style={styles.searchArrow}>→</Text>
                </TouchableOpacity>

                {/* Main Form Card */}
                <View style={styles.formCard}>
                    <View style={styles.formHeader}>
                        <View style={styles.formTitleRow}>
                            <Text style={styles.formIcon}>📥</Text>
                            <Text style={styles.formTitle}>Download Papers</Text>
                        </View>
                        <View style={styles.batchToggle}>
                            <Text style={styles.batchLabel}>Batch</Text>
                            <Switch
                                value={batchMode}
                                onValueChange={setBatchMode}
                                trackColor={{ false: '#e2e8f0', true: ACCENT_COLOR }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Subject Selector */}
                    <Text style={styles.label}>Subject</Text>
                    <TouchableOpacity
                        style={styles.subjectBtn}
                        onPress={() => router.push('/subjects')}
                        activeOpacity={0.7}
                    >
                        {selectedSubject ? (
                            <>
                                <View style={styles.subjectCodeBadge}>
                                    <Text style={styles.subjectCode}>{selectedSubject.code}</Text>
                                </View>
                                <Text style={styles.subjectName} numberOfLines={1}>{selectedSubject.name}</Text>
                            </>
                        ) : (
                            <Text style={styles.placeholder}>Tap to select subject...</Text>
                        )}
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>

                    {/* Paper Details */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1.5 }]}>
                            <Text style={styles.label}>Paper Code</Text>
                            <TextInput
                                style={styles.input}
                                value={paperCode}
                                onChangeText={setPaperCode}
                                keyboardType="number-pad"
                                maxLength={2}
                                placeholder="22"
                                placeholderTextColor="#94a3b8"
                            />
                            <Text style={styles.inputHint}>e.g., 22 = Paper 2 Variant 2</Text>
                        </View>
                        {batchMode ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>From</Text>
                                    <TextInput style={styles.input} value={startYear} onChangeText={setStartYear} keyboardType="number-pad" maxLength={4} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>To</Text>
                                    <TextInput style={styles.input} value={endYear} onChangeText={setEndYear} keyboardType="number-pad" maxLength={4} />
                                </View>
                            </>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Year</Text>
                                <TextInput style={styles.input} value={startYear} onChangeText={setStartYear} keyboardType="number-pad" maxLength={4} />
                            </View>
                        )}
                    </View>

                    {/* Sessions */}
                    <Text style={styles.label}>Session{batchMode ? 's' : ''}</Text>
                    <View style={styles.chips}>
                        {(['m', 's', 'w'] as Session[]).map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, sessions[s] && styles.chipOn]}
                                onPress={() => toggleSession(s)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, sessions[s] && styles.chipTextOn]}>{getSessionName(s)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Paper Type */}
                    <Text style={styles.label}>Type</Text>
                    <View style={styles.chips}>
                        {(['qp', 'ms', 'er'] as PaperType[]).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, styles.typeChip, paperType === t && styles.chipOn]}
                                onPress={() => setPaperType(t)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, paperType === t && styles.chipTextOn]}>
                                    {t === 'qp' ? '📄 Question Paper' : t === 'ms' ? '✅ Mark Scheme' : '📊 Examiner Report'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Main Download Button */}
                    <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={batchMode ? handleBatchDownload : handleDirectDownload}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.downloadText}>
                            {batchMode ? '📦 Download All' : '📥 Download to Device'}
                        </Text>
                    </TouchableOpacity>

                    {/* Secondary Preview Button */}
                    {!batchMode && (
                        <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={handlePreview}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.previewBtnText}>👁️ Preview First</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* DOWNLOADS SECTION - Shows active and completed downloads */}
                {downloads.length > 0 && (
                    <View style={styles.downloadsSection}>
                        <TouchableOpacity
                            style={styles.downloadsHeader}
                            onPress={() => setShowDownloads(!showDownloads)}
                        >
                            <View style={styles.downloadsHeaderLeft}>
                                <Text style={styles.downloadsTitle}>📥 Downloads</Text>
                                {activeCount > 0 && (
                                    <View style={styles.activeBadge}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.activeBadgeText}>{activeCount}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.toggleArrow}>{showDownloads ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {showDownloads && (
                            <View style={styles.downloadsList}>
                                {downloads.slice(-10).reverse().map((item) => (
                                    <View key={item.id} style={styles.downloadItem}>
                                        <View style={styles.downloadItemLeft}>
                                            {item.status === 'downloading' && (
                                                <ActivityIndicator size="small" color={ACCENT_COLOR} />
                                            )}
                                            {item.status === 'saving' && (
                                                <ActivityIndicator size="small" color={SUCCESS_COLOR} />
                                            )}
                                            {item.status === 'done' && (
                                                <Text style={styles.statusIcon}>✅</Text>
                                            )}
                                            {item.status === 'error' && (
                                                <Text style={styles.statusIcon}>❌</Text>
                                            )}
                                            <View style={styles.downloadItemInfo}>
                                                <Text style={styles.downloadItemName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.downloadItemStatus}>
                                                    {item.status === 'downloading' && 'Downloading...'}
                                                    {item.status === 'saving' && 'Saving to Downloads...'}
                                                    {item.status === 'done' && 'Saved ✓'}
                                                    {item.status === 'error' && (item.error || 'Failed')}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Clear completed button */}
                                {downloads.some(d => d.status === 'done' || d.status === 'error') && (
                                    <TouchableOpacity style={styles.clearBtn} onPress={clearCompleted}>
                                        <Text style={styles.clearBtnText}>Clear Completed</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Quick Select */}
                <View style={styles.popularSection}>
                    <Text style={styles.sectionTitle}>Quick Select</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
                        {popularSubjects.slice(0, 8).map((sub) => (
                            <TouchableOpacity
                                key={sub.code}
                                style={[styles.popularItem, selectedSubject?.code === sub.code && styles.popularItemOn]}
                                onPress={() => setSelectedSubject(sub)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.popularCode, selectedSubject?.code === sub.code && styles.popularCodeOn]}>
                                    {sub.code}
                                </Text>
                                <Text style={styles.popularName} numberOfLines={1}>{sub.name.split(' ')[0]}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Footer */}
                <TouchableOpacity style={styles.footer} onPress={() => Linking.openURL('tel:+917046461707')}>
                    <Text style={styles.footerText}>📞 +91 7046461707</Text>
                    <Text style={styles.footerSub}>IGCSE on Fingertips • Mindscope Academy</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8'
    },
    scrollView: {
        flex: 1
    },

    // Header
    header: {
        backgroundColor: BRAND_COLOR,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        color: ACCENT_COLOR,
        marginTop: 4,
        fontWeight: '500',
    },

    // Search Card
    searchCard: {
        margin: 16,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: ACCENT_COLOR,
        ...CARD_SHADOW,
    },
    searchIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: ACCENT_COLOR + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    searchIcon: {
        fontSize: 22,
    },
    searchContent: {
        flex: 1,
    },
    searchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: BRAND_COLOR
    },
    searchHint: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    searchArrow: {
        fontSize: 20,
        color: ACCENT_COLOR,
        fontWeight: '600',
    },

    // Form Card
    formCard: {
        margin: 16,
        marginTop: 6,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...CARD_SHADOW,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    formIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: BRAND_COLOR
    },
    batchToggle: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    batchLabel: {
        fontSize: 13,
        color: '#64748b',
        marginRight: 8,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 16,
    },

    // Form Elements
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 12,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subjectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    subjectCodeBadge: {
        backgroundColor: ACCENT_COLOR,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 12,
    },
    subjectCode: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    subjectName: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    placeholder: {
        flex: 1,
        fontSize: 15,
        color: '#94a3b8'
    },
    arrow: {
        fontSize: 22,
        color: '#94a3b8',
        fontWeight: '300',
    },

    // Inputs
    row: {
        flexDirection: 'row',
        marginHorizontal: -6
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 6
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    inputHint: {
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4
    },

    // Chips
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    typeChip: {
        flexGrow: 1,
        alignItems: 'center',
    },
    chipOn: {
        backgroundColor: ACCENT_COLOR,
        borderColor: ACCENT_COLOR
    },
    chipText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500'
    },
    chipTextOn: {
        color: '#fff',
        fontWeight: '600'
    },

    // Download Button
    downloadBtn: {
        backgroundColor: BRAND_COLOR,
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...CARD_SHADOW,
    },
    downloadBtnOff: {
        opacity: 0.7
    },
    downloadText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 8
    },
    downloadHint: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 8,
    },
    previewBtn: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    previewBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },

    // Downloads Section
    downloadsSection: {
        margin: 16,
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        ...CARD_SHADOW,
    },
    downloadsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    downloadsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    downloadsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: BRAND_COLOR,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ACCENT_COLOR,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    activeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    toggleArrow: {
        fontSize: 12,
        color: '#94a3b8',
    },
    downloadsList: {
        padding: 8,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        marginBottom: 6,
    },
    downloadItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    statusIcon: {
        fontSize: 16,
    },
    downloadItemInfo: {
        flex: 1,
    },
    downloadItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    downloadItemStatus: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    clearBtn: {
        padding: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        marginTop: 4,
    },
    clearBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#94a3b8',
    },

    // Popular Section
    popularSection: {
        paddingHorizontal: 16,
        marginTop: 8
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 10
    },
    popularScroll: {
        paddingRight: 16,
    },
    popularItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 10,
        minWidth: 75,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        ...CARD_SHADOW,
    },
    popularItemOn: {
        borderColor: ACCENT_COLOR,
        backgroundColor: ACCENT_COLOR + '10'
    },
    popularCode: {
        fontSize: 14,
        fontWeight: '700',
        color: ACCENT_COLOR
    },
    popularCodeOn: {
        color: BRAND_COLOR,
    },
    popularName: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4
    },

    // Footer
    footer: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 30,
        ...CARD_SHADOW,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
        color: BRAND_COLOR
    },
    footerSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4
    },
});
