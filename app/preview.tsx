import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Platform, Linking,
    Animated, Dimensions, ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system/legacy';
import {
    downloadPaper,
    saveToDownloadsDirect,
    sharePaper,
    getSessionName,
    getPaperTypeName,
    DownloadParams,
    generateSmartFilename,
} from '../src/lib/paperDownloader';

const BRAND_COLOR = '#1e3a5f';
const ACCENT_COLOR = '#0d9488';
const SUCCESS_COLOR = '#10b981';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DownloadStatus = 'checking' | 'cached' | 'downloading' | 'ready' | 'saving' | 'saved' | 'error';

// Toast notification
const showToast = (message: string) => {
    if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
    }
};

// Generate cache key for a paper
const getCacheKey = (params: DownloadParams): string => {
    return `${params.subject.code}_${params.paperCode}_${params.year}_${params.session}_${params.paperType}`;
};

export default function PreviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        subjectCode: string;
        subjectName: string;
        subjectSlug: string;
        subjectLevel: string;
        paperCode: string;
        year: string;
        session: string;
        paperType: string;
        pdfUrl: string;
    }>();

    const [status, setStatus] = useState<DownloadStatus>('checking');
    const [downloadedUri, setDownloadedUri] = useState<string | null>(null);
    const [savedFilename, setSavedFilename] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Animations
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Build download params
    const downloadParams: DownloadParams = {
        subject: {
            code: params.subjectCode || '',
            name: params.subjectName || '',
            slug: params.subjectSlug || '',
            level: (params.subjectLevel || 'igcse') as 'igcse' | 'olevel' | 'alevel',
        },
        paperCode: params.paperCode || '22',
        year: parseInt(params.year || '2024'),
        session: (params.session || 's') as 'm' | 's' | 'w',
        paperType: (params.paperType || 'qp') as 'qp' | 'ms' | 'er',
    };

    // Paper info
    const paperDetails = {
        subject: `${downloadParams.subject.name} (${downloadParams.subject.code})`,
        paper: `Paper ${downloadParams.paperCode}`,
        session: getSessionName(downloadParams.session),
        year: downloadParams.year.toString(),
        type: getPaperTypeName(downloadParams.paperType),
    };

    // Start pulse animation for loading
    useEffect(() => {
        if (status === 'checking' || status === 'downloading') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status]);

    // CHECK CACHE FIRST, then download if needed
    useEffect(() => {
        let isMounted = true;

        const loadPaper = async () => {
            const filename = generateSmartFilename(downloadParams);
            const cacheUri = FileSystem.documentDirectory + filename;

            // Check if file exists in cache
            try {
                const fileInfo = await FileSystem.getInfoAsync(cacheUri);

                if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > 1000) {
                    // FILE CACHED - Load instantly!
                    if (isMounted) {
                        setDownloadedUri(cacheUri);
                        setSavedFilename(filename);
                        setStatus('cached');
                        showToast('⚡ Loaded from cache');
                    }
                    return;
                }
            } catch (e) {
                // File doesn't exist, continue to download
            }

            // Not cached - download from server
            setStatus('downloading');

            const progressInterval = setInterval(() => {
                if (!isMounted) return;
                setDownloadProgress(prev => Math.min(prev + Math.random() * 12, 85));
            }, 150);

            try {
                const result = await downloadPaper(downloadParams);

                clearInterval(progressInterval);
                if (!isMounted) return;

                if (result.success && result.localUri) {
                    setDownloadProgress(100);
                    setDownloadedUri(result.localUri);
                    setSavedFilename(result.filename || filename);
                    setStatus('ready');
                } else {
                    setStatus('error');
                    setErrorMessage(result.error || 'Paper not found');
                }
            } catch (error: any) {
                clearInterval(progressInterval);
                if (isMounted) {
                    setStatus('error');
                    setErrorMessage(error.message || 'Download failed');
                }
            }
        };

        loadPaper();
        return () => { isMounted = false; };
    }, []);

    // Animate progress bar
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: downloadProgress,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [downloadProgress]);

    // Save to device
    const handleSaveToDevice = async () => {
        if (!downloadedUri || !savedFilename) return;

        setStatus('saving');
        showToast('📥 Saving...');

        try {
            const saveResult = await saveToDownloadsDirect(downloadedUri, savedFilename);

            if (saveResult.success) {
                setStatus('saved');
                showToast('✅ Saved!');
                Alert.alert('✅ Saved!', `${savedFilename}\n\nFile saved to Downloads.`, [
                    { text: 'Open Downloads', onPress: handleOpenDownloads },
                    { text: 'Done' },
                ]);
            } else {
                setStatus('ready');
                Alert.alert('Save Failed', saveResult.message);
            }
        } catch (error: any) {
            setStatus('ready');
            Alert.alert('Error', error.message);
        }
    };

    const handleOpenDownloads = () => {
        if (Platform.OS === 'android') {
            Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download').catch(() => {
                Linking.openSettings();
            });
        }
    };

    const handleShare = async () => {
        if (downloadedUri) await sharePaper(downloadedUri);
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    // Error state
    if (status === 'error') {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>📄</Text>
                    <Text style={styles.errorTitle}>Paper Not Found</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>← Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* PAPER INFO */}
            <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>📄 Paper Details</Text>
                    {status === 'cached' && (
                        <View style={styles.cachedBadge}>
                            <Text style={styles.cachedBadgeText}>⚡ Cached</Text>
                        </View>
                    )}
                    {(status === 'ready' || status === 'saved') && (
                        <View style={styles.readyBadge}>
                            <Text style={styles.readyBadgeText}>✓ Ready</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Subject</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{paperDetails.subject}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Paper</Text>
                        <Text style={styles.infoValue}>{paperDetails.paper}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Session</Text>
                        <Text style={styles.infoValue}>{paperDetails.session} {paperDetails.year}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{paperDetails.type}</Text>
                    </View>
                </View>

                {/* Progress - only during download */}
                {status === 'downloading' && (
                    <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Downloading... {Math.round(downloadProgress)}%</Text>
                        <View style={styles.progressBar}>
                            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                        </View>
                    </View>
                )}
            </View>

            {/* PDF VIEWER */}
            <View style={styles.pdfContainer}>
                {downloadedUri ? (
                    <Pdf
                        source={{ uri: downloadedUri }}
                        style={styles.pdf}
                        onLoadComplete={(pages) => setTotalPages(pages)}
                        onPageChanged={(page) => setCurrentPage(page)}
                        onError={(err) => console.log('PDF error:', err)}
                        enablePaging={true}
                        horizontal={false}
                        fitPolicy={0}
                        spacing={8}
                        trustAllCerts={false}
                    />
                ) : (
                    <View style={styles.loadingContainer}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <ActivityIndicator size="large" color={ACCENT_COLOR} />
                        </Animated.View>
                        <Text style={styles.loadingText}>
                            {status === 'checking' ? 'Checking cache...' : 'Downloading PDF...'}
                        </Text>
                        <Text style={styles.loadingHint}>
                            {status === 'checking' ? 'This will be instant if cached' : 'Depends on network speed'}
                        </Text>
                    </View>
                )}

                {totalPages > 0 && (
                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>{currentPage} / {totalPages}</Text>
                    </View>
                )}
            </View>

            {/* ACTION BAR */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[styles.shareBtn, !downloadedUri && styles.btnDisabled]}
                    onPress={handleShare}
                    disabled={!downloadedUri}
                >
                    <Text style={styles.shareBtnText}>📤 Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.downloadBtn,
                        status === 'saved' && styles.downloadBtnSaved,
                        (!downloadedUri || status === 'saving') && styles.btnDisabled
                    ]}
                    onPress={handleSaveToDevice}
                    disabled={!downloadedUri || status === 'saving' || status === 'saved'}
                >
                    {status === 'saving' ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.downloadBtnText}>Saving...</Text>
                        </>
                    ) : status === 'saved' ? (
                        <Text style={styles.downloadBtnText}>✅ Saved</Text>
                    ) : (
                        <Text style={styles.downloadBtnText}>📥 Save to Device</Text>
                    )}
                </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && status !== 'saved' && (
                <Text style={styles.iosNotice}>iOS: Use "Save to Files" from share menu</Text>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },

    // Info Section
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: { fontSize: 16, fontWeight: '700', color: BRAND_COLOR },
    cachedBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cachedBadgeText: { fontSize: 12, fontWeight: '600', color: '#d97706' },
    readyBadge: {
        backgroundColor: SUCCESS_COLOR + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    readyBadgeText: { fontSize: 12, fontWeight: '600', color: SUCCESS_COLOR },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    infoItem: { width: '50%', paddingHorizontal: 6, marginBottom: 8 },
    infoLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
    progressSection: { marginTop: 12 },
    progressText: { fontSize: 12, color: ACCENT_COLOR, fontWeight: '600', marginBottom: 6 },
    progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: ACCENT_COLOR, borderRadius: 3 },

    // PDF
    pdfContainer: { flex: 1, backgroundColor: '#374151' },
    pdf: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#374151' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 15, fontWeight: '600', color: '#fff' },
    loadingHint: { marginTop: 4, fontSize: 12, color: '#9ca3af' },
    pageIndicator: {
        position: 'absolute', bottom: 16, right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    },
    pageIndicatorText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Error
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorIcon: { fontSize: 48, marginBottom: 16 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: BRAND_COLOR, marginBottom: 8 },
    errorText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
    backBtn: { backgroundColor: ACCENT_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: '600' },

    // Actions
    actionBar: {
        flexDirection: 'row', padding: 16,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12,
    },
    shareBtn: { flex: 1, backgroundColor: '#64748b', borderRadius: 12, padding: 14, alignItems: 'center' },
    shareBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    downloadBtn: {
        flex: 2, backgroundColor: SUCCESS_COLOR, borderRadius: 12, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    downloadBtnSaved: { backgroundColor: BRAND_COLOR },
    btnDisabled: { opacity: 0.5 },
    downloadBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    iosNotice: { textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingBottom: 8, backgroundColor: '#fff' },
});
