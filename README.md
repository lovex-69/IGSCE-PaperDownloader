<div align="center">
  <h1>📚 IGCSE Past Paper Downloader</h1>
  <p>
    <b>A powerful React Native mobile app for downloading and previewing Cambridge International exam papers (IGCSE, O-Level, A-Level)</b>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" >
    <img src="https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" >
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" >
  </p>
  <p>
    <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" >
    <img src="https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=ios&logoColor=white" alt="iOS" >
  </p>
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [How to Use](#-how-to-use)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**IGCSE on Fingertips** is a mobile application designed for students preparing for Cambridge International Examinations (CAIE). The app allows users to:

- 📥 **Download** past papers directly to their device
- 👀 **Preview** papers before downloading
- 🔍 **Search** through a question bank with topic-based filtering
- 📚 **Browse** 200+ subjects across IGCSE, O-Level, and A-Level curriculums

The app fetches papers from multiple mirror sources (BestExamHelp, PapaCambridge, GCEGuide) with automatic fallback, ensuring maximum availability.

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Source Download** | Papers are fetched from 3 different mirror sources with automatic fallback if one fails |
| **PDF Preview** | Preview papers in-app before downloading using WebView |
| **Batch Download** | Download multiple paper types (QP, MS, ER) in one action |
| **Question Bank Search** | Search through a database of past questions by topic, year, or subject |
| **Subject Picker** | Browse and search 200+ CAIE subjects with code and name |
| **Offline Storage** | Downloaded papers are saved locally for offline access |
| **Share Papers** | Share downloaded PDFs via any app on your device |

### Supported Paper Types

- **QP** - Question Papers
- **MS** - Mark Schemes
- **ER** - Examiner Reports

### Supported Exam Sessions

- **Feb/March (m)** - February/March examination series
- **May/June (s)** - May/June examination series  
- **Oct/Nov (w)** - October/November examination series

### Supported Curriculum Levels

- 🔵 **IGCSE** - Cambridge International General Certificate of Secondary Education
- 🟢 **O-Level** - Cambridge Ordinary Level
- 🟣 **A-Level** - Cambridge Advanced Level (AS and A2)

---

## 📱 Screenshots

*Screenshots coming soon*

---

## 🛠 Tech Stack

### Frontend Framework
- **React Native** `0.81.5` - Cross-platform mobile development
- **Expo** `54.0.31` - Development toolchain and native APIs
- **Expo Router** `6.0.21` - File-based routing navigation

### State Management
- **Zustand** `5.0.0` - Lightweight state management
- **AsyncStorage** `2.2.0` - Persistent local storage

### PDF & File Handling
- **react-native-pdf** `7.0.3` - Native PDF rendering
- **react-native-webview** `13.15.0` - WebView for previews
- **expo-file-system** `19.0.7` - File download and storage
- **expo-sharing** `14.0.2` - Share files to other apps
- **react-native-blob-util** `0.24.6` - Advanced file operations

### Language & Types
- **TypeScript** `5.9.2` - Type-safe JavaScript
- **React** `19.1.0` - UI component library

---

## 📁 Project Structure

```
ExamPaperDownloaderApp/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with Stack navigation
│   ├── index.tsx                 # Home screen (main download interface)
│   ├── preview.tsx               # PDF preview screen
│   ├── search.tsx                # Question bank search screen
│   └── subjects.tsx              # Subject picker modal
│
├── src/
│   ├── components/
│   │   └── ui/                   # Reusable UI components
│   │       ├── Badge.tsx         # Status badges (success, warning, etc.)
│   │       ├── Button.tsx        # Customizable button component
│   │       ├── Card.tsx          # Card container component
│   │       ├── EmptyState.tsx    # Empty state placeholder
│   │       └── index.ts          # Component exports
│   │
│   └── lib/
│       ├── data/
│       │   ├── subjects.ts       # Subject data and search functions
│       │   ├── subjectSlugs.json # 200+ subject code → slug mappings
│       │   ├── papers.ts         # Paper metadata
│       │   └── exams.ts          # Exam type definitions
│       │
│       ├── paperDownloader.ts    # Core download logic & multi-source system
│       ├── sources.ts            # Source registry (BestExamHelp, etc.)
│       ├── store.ts              # Zustand store (user details, history)
│       ├── theme.ts              # Design tokens (colors, spacing, etc.)
│       └── utils.ts              # Utility functions
│
├── assets/                       # App icons and splash screen
├── RoughIdeaWorkingPython/       # Reference Python implementation
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── eas.json                      # EAS Build configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `18.x` or higher
- **npm** or **yarn**
- **Expo CLI** (installed globally)
- **Android Studio** or **Xcode** (for emulators) OR **Expo Go** app on physical device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ExamPaperDownloaderApp.git
   cd ExamPaperDownloaderApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on a device**
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **iOS**: Press `i` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal

### Building for Production

```bash
# Build for Android (APK/AAB)
eas build --platform android

# Build for iOS (IPA)
eas build --platform ios
```

---

## 📖 How to Use

### 1. Downloading a Paper

1. **Select Subject**: Tap on "Select Subject" and choose your subject (e.g., Physics 0625)
2. **Enter Paper Code**: Enter the paper and variant (e.g., `22` for Paper 2, Variant 2)
3. **Select Year**: Choose the exam year (e.g., 2023)
4. **Select Session**: Choose the exam session (Feb/Mar, May/Jun, or Oct/Nov)
5. **Select Paper Type**: Choose QP (Question Paper), MS (Mark Scheme), or ER (Examiner Report)
6. **Download**: Tap "Download" to fetch and save the paper

### 2. Previewing a Paper

1. Follow steps 1-5 above
2. Tap "Preview" instead of "Download"
3. The paper will open in a built-in PDF viewer
4. From the preview, you can download or share the paper

### 3. Batch Download

1. Toggle "Batch Mode" on the home screen
2. Select the sessions you want (Feb/Mar, May/Jun, Oct/Nov)
3. Choose paper types to include (QP, MS, ER)
4. Tap "Download All" to fetch all selected papers at once

### 4. Searching Questions

1. Navigate to the "Search" tab
2. Enter keywords (e.g., "quadratic", "photosynthesis")
3. Filter by subject, topic, or year
4. Tap on a result to download that specific paper

---

## 🏗 Architecture

### Multi-Source Download System

The app uses a fallback mechanism to ensure papers are always available:

```
User Request
     ↓
┌─────────────┐    Fail    ┌───────────────┐    Fail    ┌─────────────┐
│ BestExamHelp │ ─────────→ │ PapaCambridge │ ─────────→ │  GCE Guide  │
│  (Priority 1)│            │  (Priority 2) │            │ (Priority 3)│
└─────────────┘            └───────────────┘            └─────────────┘
     ↓ Success                   ↓ Success                   ↓ Success
     └──────────────────────────┴────────────────────────────┘
                                 ↓
                          Downloaded PDF
```

### URL Pattern Examples

| Source | URL Pattern |
|--------|-------------|
| BestExamHelp | `bestexamhelp.com/exam/cambridge-igcse/physics-0625/2023/0625_s23_qp_22.pdf` |
| PapaCambridge | `pastpapers.papacambridge.com/Cambridge%20IGCSE/0625/2023/0625_s23_qp_22.pdf` |
| GCE Guide | `papers.gceguide.com/IGCSE/0625/2023/0625_s23_qp_22.pdf` |

### State Management

The app uses Zustand for state management with the following stores:

```typescript
interface AppState {
    // User Identity
    userDetails: UserDetails | null;
    hasSubmittedDetails: boolean;
    deviceId: string;

    // Downloads
    downloadHistory: Download[];

    // Search
    recentSearches: string[];
}
```

---

## 📚 API Reference

### paperDownloader.ts

| Function | Description | Returns |
|----------|-------------|---------|
| `downloadPaper(params)` | Downloads a paper from multiple sources | `Promise<{ success, localUri, filename, sourceName }>` |
| `getPdfUrl(params)` | Gets the direct PDF URL | `string` |
| `buildPreviewUrl(pdfUrl)` | Creates Google Docs preview URL | `string` |
| `saveToDownloadsDirect(uri, filename)` | Saves to Downloads folder | `Promise<{ success, message }>` |
| `sharePaper(localUri)` | Opens share sheet | `Promise<boolean>` |

### sources.ts

| Function | Description |
|----------|-------------|
| `normalizeParams(...)` | Converts user input to standardized format |
| `parsePaperCode(code)` | Parses "22" into { paper: "2", variant: "2" } |
| `getSessionDisplayName(s)` | Returns "May/June" for "s" |

### subjects.ts

| Function | Description |
|----------|-------------|
| `getAllSubjects()` | Returns array of 200+ subjects |
| `searchSubjects(query)` | Filters subjects by name or code |
| `getSubjectInfo(code)` | Returns slug and level for a subject code |

---

## 🎨 Theming

The app uses a centralized theme configuration in `src/lib/theme.ts`:

```typescript
const theme = {
    colors: {
        primary: '#1e3a5f',      // Deep navy blue
        secondary: '#0d9488',    // Teal
        tertiary: '#f59e0b',     // Amber
        success: '#22c55e',
        error: '#ef4444',
        ...
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 6, md: 12, lg: 16, full: 9999 },
    fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
    ...
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow the existing component patterns
- Use the theme tokens for styling (colors, spacing, etc.)
- Add JSDoc comments for public functions

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **CAIE Downloader** (Python) - Original reference implementation
- **BestExamHelp**, **PapaCambridge**, **GCE Guide** - Paper source mirrors
- **Cambridge Assessment International Education** - Exam board

---

<div align="center">
  <p>Made with ❤️ for CAIE students worldwide</p>
  <p>
    <a href="https://github.com/yourusername/ExamPaperDownloaderApp/issues">Report Bug</a>
    ·
    <a href="https://github.com/yourusername/ExamPaperDownloaderApp/issues">Request Feature</a>
  </p>
</div>
