# Contributing to IGCSE on Fingertips

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to help students access educational resources.

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS)

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ExamPaperDownloaderApp.git
   cd ExamPaperDownloaderApp
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Create a branch** for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `app/` | Expo Router screens (routes) |
| `src/components/ui/` | Reusable UI components |
| `src/lib/` | Core business logic |
| `src/lib/data/` | Static data (subjects, exams) |

### Adding a New Screen

1. Create a new `.tsx` file in `app/` directory
2. Add the screen to `app/_layout.tsx` Stack configuration
3. Use existing UI components from `src/components/ui/`

### Adding a New Download Source

1. Open `src/lib/sources.ts`
2. Create a new `PaperSource` object following the pattern:
   ```typescript
   const NEW_SOURCE: PaperSource = {
       name: 'SourceName',
       priority: 4,  // Higher number = lower priority
       supports: { qp: true, ms: true, er: false },
       buildUrl: (params) => {
           // Build and return the PDF URL
           return `https://example.com/${params.subjectCode}_${params.session}${params.year}_${params.docType}.pdf`;
       }
   };
   ```
3. Add the source to the `SOURCES` array

### Adding a New Subject

1. Open `src/lib/data/subjectSlugs.json`
2. Add a new entry:
   ```json
   "1234": {
       "slug": "subject-name-1234",
       "level": "cambridge-igcse"
   }
   ```

---

## Code Style Guide

### TypeScript

- Use TypeScript for all new files
- Define interfaces for props and state
- Use explicit return types for functions

```typescript
// ✅ Good
interface ButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
    return (/* ... */);
}

// ❌ Bad
export const Button = (props: any) => {/* ... */}
```

### Components

- Use functional components with hooks
- Extract reusable logic to custom hooks
- Keep components focused on a single responsibility

### Styling

- Use the centralized theme from `src/lib/theme.ts`
- Avoid hardcoded colors and spacing
- Use `StyleSheet.create()` for styles

```typescript
// ✅ Good
import { theme } from '../../lib/theme';

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    }
});

// ❌ Bad
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#1e3a5f',
        padding: 16,
        borderRadius: 12,
    }
});
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (Components) | PascalCase | `Button.tsx` |
| Files (Utils) | camelCase | `paperDownloader.ts` |
| Variables | camelCase | `downloadStatus` |
| Constants | UPPER_SNAKE_CASE | `BRAND_COLOR` |
| Types/Interfaces | PascalCase | `DownloadParams` |
| Functions | camelCase | `downloadPaper()` |

---

## Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Test your changes**:
   - Run on Android emulator
   - Run on iOS simulator (if available)
   - Check that existing features still work

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes

### PR Checklist

- [ ] Code follows the style guide
- [ ] No TypeScript errors
- [ ] App runs without crashes
- [ ] New features are documented
- [ ] Added JSDoc comments for public functions

---

## Bug Reports

When filing a bug report, please include:

1. **Device information**: Android/iOS, version, device model
2. **Steps to reproduce**: Detailed steps to trigger the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots/Logs**: If applicable

### Bug Report Template

```markdown
**Device**: Android 13, Samsung Galaxy S23
**App Version**: 1.0.0

**Steps to Reproduce**:
1. Open the app
2. Select subject "Physics 0625"
3. Tap "Download"

**Expected**: Paper downloads successfully
**Actual**: Download fails with error "Network Error"

**Logs**:
[Paste relevant console logs here]
```

---

## Feature Requests

We welcome feature suggestions! When submitting a feature request:

1. **Search existing issues** to avoid duplicates
2. **Describe the problem** the feature would solve
3. **Propose a solution** if you have one
4. **Consider scope**: Smaller features are more likely to be accepted

---

## Questions?

- Open an issue with the `question` label
- Check existing documentation first

Thank you for contributing! 🎉
