// IGCSE on Fingertips - Subject Data Layer
// Integrated from Python CAIE Downloader

import subjectSlugs from './subjectSlugs.json';

export interface Subject {
    code: string;
    name: string;
    slug: string;
    level: 'igcse' | 'olevel' | 'alevel';
}

export interface SubjectSlugInfo {
    slug: string;
    level: string;  // e.g., "cambridge-igcse"
}

// Type for the JSON import
type SubjectSlugsMap = Record<string, SubjectSlugInfo>;

// Cast the imported JSON
const slugDatabase: SubjectSlugsMap = subjectSlugs as SubjectSlugsMap;

// Most popular subjects for quick select
export const popularSubjects: Subject[] = [
    { code: '0580', name: 'Mathematics', slug: 'mathematics-0580', level: 'igcse' },
    { code: '0625', name: 'Physics', slug: 'physics-0625', level: 'igcse' },
    { code: '0620', name: 'Chemistry', slug: 'chemistry-0620', level: 'igcse' },
    { code: '0610', name: 'Biology', slug: 'biology-0610', level: 'igcse' },
    { code: '0455', name: 'Economics', slug: 'economics-0455', level: 'igcse' },
    { code: '0450', name: 'Business Studies', slug: 'business-studies-0450', level: 'igcse' },
    { code: '0478', name: 'Computer Science', slug: 'computer-science-0478', level: 'igcse' },
    { code: '0470', name: 'History', slug: 'history-0470', level: 'igcse' },
    { code: '9709', name: 'Mathematics (A-Level)', slug: 'mathematics-9709', level: 'alevel' },
    { code: '9702', name: 'Physics (A-Level)', slug: 'physics-9702', level: 'alevel' },
    { code: '9701', name: 'Chemistry (A-Level)', slug: 'chemistry-9701', level: 'alevel' },
    { code: '9700', name: 'Biology (A-Level)', slug: 'biology-9700', level: 'alevel' },
];

// Subject name mappings for display
const subjectNames: Record<string, string> = {
    "0452": "Accounting", "0610": "Biology", "0450": "Business Studies",
    "0620": "Chemistry", "0478": "Computer Science", "0455": "Economics",
    "0500": "English - First Language", "0510": "English - Second Language",
    "0460": "Geography", "0470": "History", "0580": "Mathematics",
    "0606": "Additional Mathematics", "0607": "International Mathematics",
    "0625": "Physics", "0495": "Sociology", "0457": "Global Perspectives",
    "0417": "ICT", "0493": "Islamiyat", "0448": "Pakistan Studies",
    "9706": "Accounting", "9700": "Biology", "9609": "Business",
    "9701": "Chemistry", "9618": "Computer Science", "9708": "Economics",
    "9093": "English Language", "9695": "English Literature", "9696": "Geography",
    "9489": "History", "9709": "Mathematics", "9231": "Further Mathematics",
    "9702": "Physics", "9698": "Psychology", "9699": "Sociology",
};

// Get subject info from JSON database - returns slug and FULL level path
export const getSubjectInfo = (code: string): { slug: string; levelPath: string } | null => {
    const info = slugDatabase[code];
    if (!info) {
        console.log(`[getSubjectInfo] No entry found for code: ${code}`);
        return null;
    }
    console.log(`[getSubjectInfo] Found: ${code} -> slug=${info.slug}, level=${info.level}`);
    return {
        slug: info.slug,
        levelPath: info.level,  // This is already "cambridge-igcse" or "cambridge-international-a-level"
    };
};

// Convert short level to full path (for subjects not in database)
export const getLevelPath = (level: 'igcse' | 'olevel' | 'alevel'): string => {
    switch (level) {
        case 'igcse': return 'cambridge-igcse';
        case 'olevel': return 'cambridge-o-level';
        case 'alevel': return 'cambridge-international-a-level';
        default: return 'cambridge-igcse';
    }
};

// Map level string to short form for UI
const mapLevel = (level: string): 'igcse' | 'olevel' | 'alevel' => {
    if (level.includes('a-level')) return 'alevel';
    if (level.includes('o-level')) return 'olevel';
    return 'igcse';
};

// Generate display name from slug
const slugToName = (slug: string, code: string): string => {
    if (subjectNames[code]) return subjectNames[code];
    const name = slug
        .replace(`-${code}`, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return name;
};

// Get all subjects from the JSON database
export const getAllSubjects = (): Subject[] => {
    const subjects: Subject[] = [];
    Object.entries(slugDatabase).forEach(([code, info]) => {
        const level = mapLevel(info.level);
        const name = slugToName(info.slug, code);
        const levelSuffix = level === 'alevel' ? ' (A-Level)' : level === 'olevel' ? ' (O-Level)' : '';
        subjects.push({ code, name: name + levelSuffix, slug: info.slug, level });
    });
    return subjects.sort((a, b) => a.code.localeCompare(b.code));
};

// Search subjects
export const searchSubjects = (query: string): Subject[] => {
    const lowerQuery = query.toLowerCase();
    return getAllSubjects().filter(s =>
        s.name.toLowerCase().includes(lowerQuery) || s.code.includes(query)
    );
};
