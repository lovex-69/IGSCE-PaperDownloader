# API Reference

Complete API documentation for all public modules in **IGCSE on Fingertips**.

---

## Table of Contents

- [paperDownloader.ts](#paperdownloaderts)
- [sources.ts](#sourcests)
- [store.ts](#storets)
- [subjects.ts](#subjectsts)
- [utils.ts](#utilsts)
- [theme.ts](#themets)

---

## paperDownloader.ts

Core module for downloading and managing exam papers.

### Types

#### `DownloadParams`

```typescript
interface DownloadParams {
    subject: Subject;           // Subject object
    paperCode: string;          // e.g., "22" for Paper 2, Variant 2
    year: number;               // Full year, e.g., 2023
    session: 'm' | 's' | 'w';   // Exam session
    paperType: 'qp' | 'ms' | 'er'; // Document type
}
```

### Functions

#### `downloadPaper(params: DownloadParams)`

Downloads a paper from multiple sources with automatic fallback.

**Parameters:**
- `params` - Download parameters

**Returns:**
```typescript
Promise<{
    success: boolean;
    localUri?: string;      // Local file path
    filename?: string;      // Generated filename
    pdfUrl?: string;        // Source URL used
    error?: string;         // Error message if failed
    sourceName?: string;    // Which source succeeded
}>
```

**Example:**
```typescript
const result = await downloadPaper({
    subject: { code: '0625', name: 'Physics', ... },
    paperCode: '22',
    year: 2023,
    session: 's',
    paperType: 'qp'
});

if (result.success) {
    console.log(`Downloaded from ${result.sourceName}: ${result.localUri}`);
}
```

---

#### `getPdfUrl(params: DownloadParams)`

Gets the direct PDF URL for the primary source.

**Parameters:**
- `params` - Download parameters

**Returns:** `string` - Direct PDF URL

**Example:**
```typescript
const url = getPdfUrl(params);
// "https://bestexamhelp.com/exam/cambridge-igcse/physics-0625/2023/0625_s23_qp_22.pdf"
```

---

#### `buildPreviewUrl(pdfUrl: string)`

Creates a Google Docs Viewer URL for PDF preview.

**Parameters:**
- `pdfUrl` - Direct PDF URL

**Returns:** `string` - Google Docs Viewer URL

**Example:**
```typescript
const previewUrl = buildPreviewUrl('https://example.com/paper.pdf');
// "https://docs.google.com/viewer?url=https%3A%2F%2Fexample.com%2Fpaper.pdf&embedded=true"
```

---

#### `saveToDownloadsDirect(localUri: string, filename: string)`

Saves a file to the device's Downloads folder.

**Parameters:**
- `localUri` - Local file path
- `filename` - Desired filename

**Returns:**
```typescript
Promise<{
    success: boolean;
    message: string;
    openDownloads?: () => void;  // Function to open Downloads folder (Android)
}>
```

**Platform Behavior:**
- **Android**: Uses SAF to save to Downloads folder
- **iOS**: Opens share sheet for "Save to Files"

---

#### `sharePaper(localUri: string)`

Opens the share sheet to share a downloaded paper.

**Parameters:**
- `localUri` - Local file path

**Returns:** `Promise<boolean>` - Whether sharing was successful

---

#### `hasDownloadsFolderPermission()`

Checks if Downloads folder permission is already granted.

**Returns:** `Promise<boolean>`

---

#### `requestDownloadsFolderPermission()`

Requests folder permission upfront.

**Returns:**
```typescript
Promise<{
    granted: boolean;
    message: string;
}>
```

---

#### Utility Functions

| Function | Signature | Returns |
|----------|-----------|---------|
| `generateFilename` | `(params: DownloadParams) => string` | CAIE standard filename |
| `generateSmartFilename` | `(params: DownloadParams) => string` | Human-readable filename |
| `twoDigitYear` | `(year: number) => string` | 2-digit year string |
| `parsePaperCode` | `(code: string) => { paper, variant }` | Parsed paper/variant |
| `getSessionName` | `(s: 'm'|'s'|'w') => string` | Full session name |
| `getSessionShortName` | `(s: 'm'|'s'|'w') => string` | Short session name |
| `getPaperTypeName` | `(t: 'qp'|'ms'|'er') => string` | Paper type display name |

---

## sources.ts

Multi-source download system configuration.

### Types

#### `NormalizedParams`

```typescript
interface NormalizedParams {
    subjectCode: string;    // e.g., "0625"
    session: 'm' | 's' | 'w';
    year: string;           // 2-digit, e.g., "23"
    yearFull: string;       // 4-digit, e.g., "2023"
    paper: string;          // e.g., "2"
    variant: string;        // e.g., "2" or ""
    docType: 'qp' | 'ms' | 'er';
    subjectSlug?: string;
    subjectLevel?: string;
}
```

#### `PaperSource`

```typescript
interface PaperSource {
    name: string;
    priority: number;       // Lower = higher priority
    supports: {
        qp: boolean;
        ms: boolean;
        er: boolean;
    };
    buildUrl: (params: NormalizedParams) => string;
}
```

### Constants

#### `SOURCES`

Array of available paper sources, sorted by priority.

```typescript
const SOURCES: PaperSource[] = [
    BEST_EXAM_HELP,   // Priority 1
    PAPA_CAMBRIDGE,   // Priority 2
    GCE_GUIDE,        // Priority 3
];
```

### Functions

#### `normalizeParams(...)`

Normalizes user input into standardized parameters.

**Signature:**
```typescript
normalizeParams(
    subjectCode: string,
    subjectSlug: string,
    subjectLevel: string,
    paperCode: string,
    year: number,
    session: 'm' | 's' | 'w',
    docType: 'qp' | 'ms' | 'er'
): NormalizedParams
```

---

#### `parsePaperCode(paperCode: string)`

Parses paper code into paper number and variant.

**Examples:**
```typescript
parsePaperCode("22")  // { paper: "2", variant: "2" }
parsePaperCode("2")   // { paper: "2", variant: "" }
parsePaperCode("")    // { paper: "2", variant: "2" } // Default
```

---

#### `twoDigitYear(year: number)`

Converts 4-digit year to 2-digit string.

```typescript
twoDigitYear(2023)  // "23"
twoDigitYear(2005)  // "05"
```

---

#### `getSessionDisplayName(session: 'm' | 's' | 'w')`

Returns human-readable session name.

```typescript
getSessionDisplayName('m')  // "Feb/Mar"
getSessionDisplayName('s')  // "May/June"
getSessionDisplayName('w')  // "Oct/Nov"
```

---

## store.ts

Zustand state management store.

### Types

#### `UserDetails`

```typescript
interface UserDetails {
    fullName: string;
    email: string;
    mobile: string;
    examPreparingFor: string;
    role?: 'student' | 'teacher' | 'institute';
    submittedAt: string;
}
```

#### `Download`

```typescript
interface Download {
    id: string;
    paperId: string;
    paperTitle: string;
    type: 'paper' | 'answers' | 'combined';
    downloadedAt: string;
}
```

#### `AppState`

```typescript
interface AppState {
    // State
    userDetails: UserDetails | null;
    hasSubmittedDetails: boolean;
    deviceId: string;
    downloadHistory: Download[];
    recentSearches: string[];

    // Actions
    setUserDetails: (details: UserDetails) => void;
    clearUserDetails: () => void;
    addDownload: (download: Download) => void;
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}
```

### Hook

#### `useAppStore()`

Zustand hook to access store state and actions.

**Usage:**
```typescript
import { useAppStore } from '../lib/store';

function MyComponent() {
    const { downloadHistory, addDownload } = useAppStore();
    
    // Access state
    console.log(downloadHistory.length);
    
    // Dispatch action
    addDownload({
        id: '123',
        paperId: '0625_s23_qp_22',
        paperTitle: 'Physics Paper 2',
        type: 'paper',
        downloadedAt: new Date().toISOString()
    });
}
```

### Persistence

The store automatically persists to AsyncStorage with key `examvault-storage`.

---

## subjects.ts

Subject data management.

### Types

#### `Subject`

```typescript
interface Subject {
    code: string;           // e.g., "0625"
    name: string;           // e.g., "Physics"
    slug: string;           // e.g., "physics-0625"
    level: 'igcse' | 'olevel' | 'alevel';
}
```

### Constants

#### `popularSubjects`

Array of most commonly used subjects for quick access.

```typescript
const popularSubjects: Subject[] = [
    { code: '0580', name: 'Mathematics', slug: 'mathematics-0580', level: 'igcse' },
    { code: '0625', name: 'Physics', slug: 'physics-0625', level: 'igcse' },
    // ... 10 more
];
```

### Functions

#### `getAllSubjects()`

Returns all 200+ subjects from the database.

**Returns:** `Subject[]`

---

#### `searchSubjects(query: string)`

Filters subjects by name or code.

**Parameters:**
- `query` - Search term

**Returns:** `Subject[]` - Matching subjects

**Example:**
```typescript
searchSubjects('physics')  // Returns Physics subjects
searchSubjects('0625')     // Returns subjects with code 0625
```

---

#### `getSubjectInfo(code: string)`

Gets slug and level path for a subject code.

**Returns:**
```typescript
{ slug: string; levelPath: string } | null
```

**Example:**
```typescript
getSubjectInfo('0625')
// { slug: "physics-0625", levelPath: "cambridge-igcse" }
```

---

#### `getLevelPath(level: 'igcse' | 'olevel' | 'alevel')`

Converts short level code to full URL path.

```typescript
getLevelPath('igcse')   // "cambridge-igcse"
getLevelPath('alevel')  // "cambridge-international-a-level"
getLevelPath('olevel')  // "cambridge-o-level"
```

---

## utils.ts

General utility functions.

### Functions

#### `generateFilename(exam, year, subject, type)`

Generates a download filename.

**Parameters:**
- `exam` - Exam name
- `year` - Year number
- `subject` - Subject name
- `type` - 'paper' | 'answers' | 'combined'

**Returns:** `string`

---

#### `formatDate(date: Date)`

Formats a date for display.

**Returns:** `string` - e.g., "15 Jan 2024"

---

#### `truncateText(text: string, maxLength: number)`

Truncates text with ellipsis.

---

#### `generateDeviceId()`

Generates a random 32-character device ID.

---

#### `calculateMatchScore(query: string, target: string)`

Calculates a relevance score (0-100) for search results.

---

#### `getExamIcon(examId: string)`

Returns an emoji icon for exam types.

---

## theme.ts

Design system tokens.

### Structure

```typescript
const theme = {
    colors: {
        primary: '#1e3a5f',
        secondary: '#0d9488',
        tertiary: '#f59e0b',
        surface: '#ffffff',
        background: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        error: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        // ... more colors
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 6,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    shadow: {
        sm: { /* shadow properties */ },
        md: { /* shadow properties */ },
        lg: { /* shadow properties */ },
    },
};
```

### Usage

```typescript
import { theme } from '../lib/theme';

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadow.md,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
});
```

---

## UI Components

### Button

```typescript
interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
}
```

### Badge

```typescript
interface BadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
    style?: ViewStyle;
}
```

---

*Last updated: January 2026*
