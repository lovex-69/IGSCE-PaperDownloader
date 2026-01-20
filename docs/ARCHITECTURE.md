# Architecture Documentation

This document provides an in-depth look at the architecture of **IGCSE on Fingertips**.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Home    │  │  Preview │  │  Search  │  │ Subjects │             │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │             │                    │
│       └─────────────┴─────────────┴─────────────┘                    │
│                           │                                          │
│               ┌───────────┴───────────┐                              │
│               │    UI Components      │                              │
│               │  (Button, Badge, etc) │                              │
│               └───────────┬───────────┘                              │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                           │     BUSINESS LOGIC LAYER                 │
│  ┌────────────────────────┴────────────────────────┐                 │
│  │              Paper Downloader                    │                 │
│  │  • Multi-source fallback                         │                 │
│  │  • URL generation                                │                 │
│  │  • File save/share                               │                 │
│  └────────────────────────┬────────────────────────┘                 │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────┐                 │
│  │              Source Registry                     │                 │
│  │  • BestExamHelp    (Priority 1)                  │                 │
│  │  • PapaCambridge   (Priority 2)                  │                 │
│  │  • GCEGuide        (Priority 3)                  │                 │
│  └─────────────────────────────────────────────────┘                 │
│                                                                       │
│  ┌─────────────────────────┐  ┌─────────────────────────┐            │
│  │    State Management     │  │     Data Layer          │            │
│  │    (Zustand Store)      │  │  (Subjects, Papers)     │            │
│  └─────────────────────────┘  └─────────────────────────┘            │
└───────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                     PLATFORM LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ File System │  │   Sharing   │  │   WebView   │  │PDF Renderer │  │
│  │   (Expo)    │  │   (Expo)    │  │   (RN)      │  │   (RN)      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🗂 File Structure Deep Dive

### Screens (`app/`)

The app uses **Expo Router** for file-based routing:

| File | Route | Description |
|------|-------|-------------|
| `index.tsx` | `/` | Main home screen with download form |
| `preview.tsx` | `/preview` | PDF preview with WebView |
| `search.tsx` | `/search` | Question bank with filtering |
| `subjects.tsx` | `/subjects` | Subject picker modal |
| `_layout.tsx` | N/A | Root layout with Stack navigator |

### UI Components (`src/components/ui/`)

Reusable components with consistent styling:

| Component | Purpose |
|-----------|---------|
| `Button` | Customizable button with variants (primary, secondary, outline, ghost) |
| `Badge` | Status indicators with color variants |
| `Card` | Container component with shadows |
| `EmptyState` | Placeholder for empty lists |

### Core Library (`src/lib/`)

| Module | Responsibility |
|--------|----------------|
| `paperDownloader.ts` | Download orchestration, file operations, permissions |
| `sources.ts` | Source registry and URL builders |
| `store.ts` | Zustand state management |
| `theme.ts` | Design tokens (colors, spacing, typography) |
| `utils.ts` | Helper functions |

### Data Layer (`src/lib/data/`)

| File | Content |
|------|---------|
| `subjects.ts` | Subject search and lookup functions |
| `subjectSlugs.json` | Mapping of 200+ subject codes to URL slugs |
| `papers.ts` | Paper metadata |
| `exams.ts` | Exam type definitions |

---

## 🔄 Data Flow

### Download Flow

```
User Input (Subject, Paper, Year, Session, Type)
                    │
                    ▼
            ┌───────────────────┐
            │  normalizeParams  │  Standardize input
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  SOURCES registry │  Get ordered sources
            └─────────┬─────────┘
                      │
          ┌───────────┴───────────┐
          │    For each source    │
          │                       │
          ▼                       ▼
   ┌─────────────┐         ┌─────────────┐
   │  buildUrl() │         │ HEAD check  │  Validate exists
   └──────┬──────┘         └──────┬──────┘
          │                       │
          │    ◄─────────────────┘
          ▼
   ┌─────────────────────────┐
   │  FileSystem.downloadAsync │  Download to cache
   └───────────┬─────────────┘
               │
               ▼
   ┌─────────────────────────┐
   │  Validate PDF content   │  Check first bytes
   └───────────┬─────────────┘
               │
       ┌───────┴───────┐
       │               │
  (Success)        (Failure)
       │               │
       ▼               ▼
┌─────────────┐  Try next source
│ Return file │  or return error
└─────────────┘
```

### State Flow

```
┌───────────────────────────────────────────────────────────────┐
│                        Zustand Store                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  User Details   │  │ Download History│  │ Recent Searches│ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┴────────────────────┘          │
│                              │                                 │
│               ┌──────────────┴──────────────┐                  │
│               │      AsyncStorage           │                  │
│               │  (Persisted to device)      │                  │
│               └─────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
             │                    ▲
             ▼                    │
      ┌─────────────────────────────────────┐
      │           React Components           │
      │  • useAppStore() hook               │
      │  • Automatic re-renders on change    │
      └─────────────────────────────────────┘
```

---

## 🌐 Multi-Source System

### Source Interface

Every source must implement `PaperSource`:

```typescript
interface PaperSource {
    name: string;           // Display name
    priority: number;       // Lower = try first
    supports: {
        qp: boolean;        // Question Papers
        ms: boolean;        // Mark Schemes
        er: boolean;        // Examiner Reports
    };
    buildUrl: (params: NormalizedParams) => string;
}
```

### NormalizedParams

User input is normalized to a standard format:

```typescript
interface NormalizedParams {
    subjectCode: string;    // e.g., "0625"
    session: 'm' | 's' | 'w';
    year: string;           // 2-digit: "23"
    yearFull: string;       // 4-digit: "2023"
    paper: string;          // "1", "2", etc.
    variant: string;        // "1", "2", or ""
    docType: 'qp' | 'ms' | 'er';
    subjectSlug?: string;   // e.g., "physics-0625"
    subjectLevel?: string;  // e.g., "cambridge-igcse"
}
```

### Source URL Patterns

| Source | Pattern |
|--------|---------|
| **BestExamHelp** | `/exam/{level}/{slug}/{yearFull}/{code}_{session}{year}_{type}_{paper}{variant}.pdf` |
| **PapaCambridge** | `/{level}/{code}/{yearFull}/{code}_{session}{year}_{type}_{paper}{variant}.pdf` |
| **GCEGuide** | `/{level}/{code}/{yearFull}/{code}_{session}{year}_{type}_{paper}{variant}.pdf` |

### Fallback Logic

```typescript
for (const source of SOURCES) {
    if (!source.supports[docType]) continue;
    
    const url = source.buildUrl(params);
    const headCheck = await fetch(url, { method: 'HEAD' });
    
    if (headCheck.ok) {
        const result = await FileSystem.downloadAsync(url, localUri);
        if (isPdfValid(result)) {
            return { success: true, sourceName: source.name };
        }
    }
}
return { success: false, error: 'Paper not found on any source' };
```

---

## 📱 Platform-Specific Behavior

### Android

- Uses **Storage Access Framework (SAF)** for Downloads folder access
- Folder permission is cached in AsyncStorage
- Shows toast notifications for download status
- Can open Downloads folder directly

### iOS

- Uses **Share Sheet** for saving files (iOS restriction)
- No direct Downloads folder access
- Files saved via "Save to Files" action

### File Naming

Files are named using CAIE standard format:
```
{code}_{session}{year}_{type}_{paper}{variant}.pdf
Example: 0625_s23_qp_22.pdf
```

Smart display names are also generated:
```
{Subject}_{code}_P{paper}{variant}_{type}_{session}_{year}.pdf
Example: Physics_0625_P22_QP_MJ_2023.pdf
```

---

## 🔒 Permissions

| Permission | Purpose | When Requested |
|------------|---------|----------------|
| Storage (Android) | Save to Downloads | First download attempt |
| File Access (iOS) | Save via Share Sheet | When user taps "Save to Files" |

Permission URIs are cached in AsyncStorage to avoid repeated prompts.

---

## 📊 Performance Considerations

1. **Lazy Loading**: Subjects are loaded from JSON only when accessed
2. **Memoization**: Search results are memoized with `useMemo()`
3. **Async Downloads**: Downloads run in background, not blocking UI
4. **HEAD Checks**: URL validation before full download saves bandwidth
5. **Queue System**: Downloads are queued to prevent overwhelming the device

---

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] Download QP, MS, ER for each session
- [ ] Test with valid and invalid subject codes
- [ ] Test offline behavior
- [ ] Test on Android 11+ and iOS 14+
- [ ] Test preview and share functionality

### Recommended Automated Tests

- Unit tests for `parsePaperCode()`, `normalizeParams()`
- Integration tests for download flow
- Snapshot tests for UI components

---

## 🔮 Future Considerations

1. **Offline Queue**: Queue downloads for when device is online
2. **Download Progress**: Show actual download progress percentage
3. **Caching**: Cache downloaded papers for faster access
4. **Push Notifications**: Notify when new papers are available
5. **Cloud Sync**: Sync download history across devices
