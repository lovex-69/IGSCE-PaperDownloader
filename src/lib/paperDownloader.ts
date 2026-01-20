// IGCSE on Fingertips - Paper Downloader
// With browser-like headers, SAF downloads, and permission caching

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubjectInfo, getLevelPath, Subject } from './data/subjects';
export type { Subject };
import { Alert, Linking, Platform } from 'react-native';

const BESTEXAMHELP_BASE = 'https://bestexamhelp.com/exam';
const DOWNLOADS_URI_KEY = 'cached_downloads_uri';

// Browser-like headers to bypass anti-bot protection
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://bestexamhelp.com/',
};

export interface DownloadParams {
    subject: Subject;
    paperCode: string;
    year: number;
    session: 'm' | 's' | 'w';
    paperType: 'qp' | 'ms' | 'er';
}

const twoDigitYear = (year: number): string => {
    return year.toString().slice(-2).padStart(2, '0');
};

// Parse paper code: "22" → paper=2, variant=2; "2" → paper=2, variant="" 
const parsePaperCode = (paperCode: string): { paper: string; variant: string } => {
    const code = paperCode.trim();
    if (code.length >= 2) {
        return { paper: code.charAt(0), variant: code.charAt(1) };
    } else if (code.length === 1) {
        return { paper: code, variant: '' };
    }
    return { paper: '2', variant: '2' }; // Default
};

// Generate smart filename for saving: Mathematics_0580_P22_QP_MJ_2023.pdf
export const generateSmartFilename = (params: DownloadParams): string => {
    const { subject, paperCode, year, session, paperType } = params;

    // Clean subject name
    const subjectName = subject.name.split(/[\s\-()]/)[0].replace(/[^a-zA-Z]/g, '');

    // Session code
    const sessionCode = session === 'm' ? 'FM' : session === 's' ? 'MJ' : 'ON';

    // Paper type name
    const typeName = paperType.toUpperCase();

    // Paper number with variant
    const paperNum = `P${paperCode}`;

    return `${subjectName}_${subject.code}_${paperNum}_${typeName}_${sessionCode}_${year}.pdf`;
};

// Generate the CORRECT filename for IGCSE standard format
// Format: {subject}_{session}{year}_{type}_{paper}{variant}.pdf
// Example: 0444_s23_qp_22.pdf (Paper 2, Variant 2)
export const generateFilename = (params: DownloadParams): string => {
    const { subject, paperCode, year, session, paperType } = params;
    const yy = twoDigitYear(year);
    const { paper, variant } = parsePaperCode(paperCode);

    if (paperType === 'er') {
        // Examiner Report has no paper/variant
        return `${subject.code}_${session}${yy}_er.pdf`;
    }

    // Standard format: {code}_{session}{year}_{type}_{paper}{variant}.pdf
    return `${subject.code}_${session}${yy}_${paperType}_${paper}${variant}.pdf`;
};

// Legacy: Generate multiple filenames (kept for compatibility but only returns one now)
export const generateFilenames = (params: DownloadParams): string[] => {
    return [generateFilename(params)];
};

// Build URL
export const buildUrl = (subject: Subject, yearFull: string, filename: string): string => {
    const dbInfo = getSubjectInfo(subject.code);

    if (dbInfo) {
        return `${BESTEXAMHELP_BASE}/${dbInfo.levelPath}/${dbInfo.slug}/${yearFull}/${filename}`;
    }

    const levelPath = getLevelPath(subject.level);
    return `${BESTEXAMHELP_BASE}/${levelPath}/${subject.slug}/${yearFull}/${filename}`;
};

// Build preview URL for Google Docs Viewer
export const buildPreviewUrl = (pdfUrl: string): string => {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
};

// Get the direct PDF URL (for preview)
export const getPdfUrl = (params: DownloadParams): string => {
    const yearFull = `20${twoDigitYear(params.year)}`;
    const filenames = generateFilenames(params);
    return buildUrl(params.subject, yearFull, filenames[0]);
};

// Download paper - MULTI-SOURCE with sequential fallback
export const downloadPaper = async (params: DownloadParams): Promise<{ success: boolean; localUri?: string; filename?: string; pdfUrl?: string; error?: string; sourceName?: string }> => {
    console.log('📥 [DOWNLOAD] Starting multi-source download:', params.subject.code, params.paperCode, params.year, params.session, params.paperType);

    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
        console.log('❌ [DOWNLOAD] Storage not available');
        return { success: false, error: 'Storage not available' };
    }

    const smartFilename = generateSmartFilename(params);
    const cachedUri = docDir + smartFilename;

    // 1. CHECK CACHE FIRST - instant return if already downloaded
    try {
        const cacheInfo = await FileSystem.getInfoAsync(cachedUri);
        if (cacheInfo.exists && 'size' in cacheInfo && cacheInfo.size > 1000) {
            console.log('⚡ [DOWNLOAD] CACHE HIT! Size:', cacheInfo.size, 'bytes');
            return {
                success: true,
                localUri: cachedUri,
                filename: smartFilename,
                pdfUrl: 'cached',
                sourceName: 'Cache'
            };
        }
    } catch { }

    // 2. CHECK CACHED URL - if we found a working URL before, use it
    const urlCacheKey = `url_${params.subject.code}_${params.paperCode}_${params.year}_${params.session}_${params.paperType}`;
    try {
        const cachedUrl = await AsyncStorage.getItem(urlCacheKey);
        if (cachedUrl) {
            console.log('🔗 [DOWNLOAD] Found cached URL:', cachedUrl);
            const result = await tryDownloadFromUrl(cachedUrl, cachedUri, docDir);
            if (result.success) {
                return { ...result, filename: smartFilename, sourceName: 'Cached URL' };
            }
            // Cached URL no longer works, remove it
            await AsyncStorage.removeItem(urlCacheKey);
        }
    } catch { }

    // 3. TRY MULTIPLE SOURCES SEQUENTIALLY
    // Normalize params for sources
    const { paper, variant } = parsePaperCode(params.paperCode);
    const yy = twoDigitYear(params.year);

    // Define sources with their URL patterns
    const sources = [
        {
            name: 'BestExamHelp',
            buildUrl: () => {
                const dbInfo = getSubjectInfo(params.subject.code);
                const levelPath = dbInfo?.levelPath || getLevelPath(params.subject.level);
                const slug = dbInfo?.slug || params.subject.slug;
                const filename = params.paperType === 'er'
                    ? `${params.subject.code}_${params.session}${yy}_er.pdf`
                    : `${params.subject.code}_${params.session}${yy}_${params.paperType}_${paper}${variant}.pdf`;
                return `https://bestexamhelp.com/exam/${levelPath}/${slug}/${params.year}/${filename}`;
            }
        },
        {
            name: 'GCEGuide',
            buildUrl: () => {
                const level = params.subject.level === 'alevel' ? 'A%20Levels'
                    : params.subject.level === 'olevel' ? 'O%20Levels' : 'IGCSE';
                const filename = params.paperType === 'er'
                    ? `${params.subject.code}_${params.session}${yy}_er.pdf`
                    : `${params.subject.code}_${params.session}${yy}_${params.paperType}_${paper}${variant}.pdf`;
                return `https://papers.gceguide.com/${level}/${params.subject.code}/${params.year}/${filename}`;
            }
        },
        {
            name: 'PapaCambridge',
            buildUrl: () => {
                const level = params.subject.level === 'alevel' ? 'Cambridge%20International%20AS%20and%20A%20Level'
                    : params.subject.level === 'olevel' ? 'Cambridge%20O%20Level' : 'Cambridge%20IGCSE';
                const filename = params.paperType === 'er'
                    ? `${params.subject.code}_${params.session}${yy}_er.pdf`
                    : `${params.subject.code}_${params.session}${yy}_${params.paperType}_${paper}${variant}.pdf`;
                return `https://pastpapers.papacambridge.com/${level}/${params.subject.code}/${params.year}/${filename}`;
            }
        }
    ];

    const failedSources: string[] = [];

    for (const source of sources) {
        const url = source.buildUrl();
        console.log(`🌐 [${source.name}] Trying:`, url);

        const result = await tryDownloadFromUrl(url, cachedUri, docDir);

        if (result.success) {
            console.log(`✅ [${source.name}] SUCCESS!`);
            // Cache the working URL for future use
            try {
                await AsyncStorage.setItem(urlCacheKey, url);
            } catch { }
            return { ...result, filename: smartFilename, sourceName: source.name };
        } else {
            console.log(`❌ [${source.name}] Failed:`, result.error);
            failedSources.push(`${source.name}: ${result.error}`);
        }
    }

    // All sources failed
    const sessionName = getSessionName(params.session);
    console.log('❌ [DOWNLOAD] All sources failed');

    return {
        success: false,
        error: `Paper ${paper}${variant} not available for ${sessionName} ${params.year}.\n\nNot found on any of our sources:\n• ${failedSources.join('\n• ')}`
    };
};

// Helper: Try downloading from a specific URL with PDF validation
async function tryDownloadFromUrl(url: string, finalUri: string, docDir: string): Promise<{ success: boolean; localUri?: string; pdfUrl?: string; error?: string }> {
    const tempUri = docDir + `temp_${Date.now()}.pdf`;

    try {
        const result = await FileSystem.downloadAsync(url, tempUri, { headers: HEADERS });

        if (result.status === 200) {
            const info = await FileSystem.getInfoAsync(tempUri);
            const size = info.exists && 'size' in info ? info.size : 0;

            if (size > 5000) {
                // VALIDATE PDF: Read first bytes and check for %PDF header
                try {
                    const header = await FileSystem.readAsStringAsync(tempUri, {
                        encoding: FileSystem.EncodingType.UTF8,
                        length: 10,
                        position: 0
                    });

                    if (!header.startsWith('%PDF')) {
                        console.log('⚠️ [VALIDATE] Not a valid PDF (header:', header.substring(0, 8), ')');
                        await FileSystem.deleteAsync(tempUri, { idempotent: true });
                        return { success: false, error: 'not a PDF (HTML error page)' };
                    }
                } catch (readErr) {
                    // If we can't read, still try - might be encoding issue
                    console.log('⚠️ [VALIDATE] Could not read header, proceeding anyway');
                }

                await FileSystem.moveAsync({ from: tempUri, to: finalUri });
                return { success: true, localUri: finalUri, pdfUrl: url };
            }
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
            return { success: false, error: `small file (${size}b)` };
        } else {
            return { success: false, error: `HTTP ${result.status}` };
        }
    } catch (err: any) {
        try { await FileSystem.deleteAsync(tempUri, { idempotent: true }); } catch { }
        return { success: false, error: err.message || 'Network error' };
    }
}

// Get cached Downloads directory URI
const getCachedDownloadsUri = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(DOWNLOADS_URI_KEY);
    } catch {
        return null;
    }
};

// Save Downloads directory URI
const setCachedDownloadsUri = async (uri: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(DOWNLOADS_URI_KEY, uri);
    } catch {
        // Ignore cache errors
    }
};

// Check if folder permission is already granted
export const hasDownloadsFolderPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const uri = await getCachedDownloadsUri();
    return uri !== null;
};

// Request folder permission upfront (call on first app launch)
export const requestDownloadsFolderPermission = async (): Promise<{ granted: boolean; message: string }> => {
    if (Platform.OS !== 'android') {
        return { granted: true, message: 'iOS uses share sheet for saving files.' };
    }

    const existingUri = await getCachedDownloadsUri();
    if (existingUri) {
        return { granted: true, message: 'Permission already granted.' };
    }

    try {
        const SAF = FileSystem.StorageAccessFramework;
        const permissions = await SAF.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
            await setCachedDownloadsUri(permissions.directoryUri);
            return { granted: true, message: 'Downloads folder access granted!' };
        } else {
            return { granted: false, message: 'Permission denied. You can grant it later when saving.' };
        }
    } catch (error: any) {
        return { granted: false, message: error.message || 'Failed to request permission.' };
    }
};

// Generate unique filename if exists (auto-rename with (1), (2), etc.)
const getUniqueFilename = async (directoryUri: string, baseFilename: string): Promise<string> => {
    const SAF = FileSystem.StorageAccessFramework;

    try {
        const files = await SAF.readDirectoryAsync(directoryUri);
        const baseName = baseFilename.replace('.pdf', '');

        let filename = baseFilename;
        let counter = 1;

        while (files.some(f => f.includes(baseName) && f.includes(`(${counter - 1})`) || (counter === 1 && files.some(f => f.endsWith(baseFilename))))) {
            if (counter === 1 && !files.some(f => f.endsWith(baseFilename))) {
                break;
            }
            filename = `${baseName}(${counter}).pdf`;
            counter++;
            if (counter > 100) break; // Safety limit
        }

        return filename;
    } catch {
        return baseFilename;
    }
};

// Save to Downloads folder directly (Android with SAF)
// iOS NOTE: iOS cannot save directly to Downloads folder due to Apple restrictions.
// We use share sheet which allows user to "Save to Files" - this is the correct iOS behavior.
export const saveToDownloadsDirect = async (
    localUri: string,
    filename: string
): Promise<{ success: boolean; message: string; openDownloads?: () => void }> => {
    const SAF = FileSystem.StorageAccessFramework;

    // iOS: Use share sheet (Apple restriction - cannot save directly to Downloads)
    if (Platform.OS === 'ios') {
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(localUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Save ${filename}`,
                    UTI: 'com.adobe.pdf',
                });
                return {
                    success: true,
                    message: 'Use "Save to Files" to save the PDF.\n(iOS does not allow direct Downloads folder access)'
                };
            }
            return { success: false, message: 'Sharing not available on this device' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to share' };
        }
    }

    // Android: Use Storage Access Framework
    try {
        // Try to use cached directory first
        let directoryUri = await getCachedDownloadsUri();

        // If no cached URI or it's invalid, request new permission
        if (!directoryUri) {
            const permissions = await SAF.requestDirectoryPermissionsAsync();

            if (!permissions.granted) {
                return {
                    success: false,
                    message: 'Permission required to save files to Downloads.\nPlease grant access when prompted.'
                };
            }

            directoryUri = permissions.directoryUri;
            await setCachedDownloadsUri(directoryUri);
        }

        // Get unique filename to avoid conflicts
        const uniqueFilename = await getUniqueFilename(directoryUri, filename);

        // Create file in Downloads
        const fileUri = await SAF.createFileAsync(
            directoryUri,
            uniqueFilename,
            'application/pdf'
        );

        // Read content from cache and write to Downloads
        const content = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return {
            success: true,
            message: `Saved: ${uniqueFilename}\n📂 Check your Downloads folder`,
            openDownloads: () => {
                // Open Downloads folder on Android
                Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download');
            }
        };
    } catch (error: any) {
        // If cached URI is invalid, clear it and try again
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
            await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
            return {
                success: false,
                message: 'Permission expired. Please try again and select Downloads folder.'
            };
        }
        return { success: false, message: error.message || 'Failed to save file' };
    }
};

// Legacy save to downloads - uses Share sheet
export const saveToDownloads = async (localUri: string, filename: string): Promise<boolean> => {
    try {
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, {
                mimeType: 'application/pdf',
                dialogTitle: `Save ${filename}`,
                UTI: 'com.adobe.pdf',
            });
            return true;
        } else {
            Alert.alert('Not Available', 'Sharing is not available on this device');
            return false;
        }
    } catch (error: any) {
        Alert.alert('Save Failed', error.message || 'Could not save file');
        return false;
    }
};

// Share paper
export const sharePaper = async (localUri: string): Promise<boolean> => {
    try {
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, { mimeType: 'application/pdf' });
            return true;
        }
    } catch { }
    return false;
};

export const getSessionName = (s: 'm' | 's' | 'w'): string =>
    s === 'm' ? 'Feb/March' : s === 's' ? 'May/June' : 'Oct/Nov';

export const getSessionShortName = (s: 'm' | 's' | 'w'): string =>
    s === 'm' ? 'FM' : s === 's' ? 'MJ' : 'ON';

export const getPaperTypeName = (t: 'qp' | 'ms' | 'er'): string =>
    t === 'qp' ? 'Question Paper' : t === 'ms' ? 'Mark Scheme' : 'Examiner Report';
