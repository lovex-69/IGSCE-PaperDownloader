// Utility functions for ExamVault

export const generateFilename = (
    exam: string,
    year: number,
    subject: string,
    type: 'paper' | 'answers' | 'combined'
): string => {
    const sanitized = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
    const suffix = type === 'paper' ? '' : type === 'answers' ? '_Answers' : '_With_Answers';
    return `${sanitized(exam)}_${year}_${sanitized(subject)}${suffix}.pdf`;
};

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
};

export const generateDeviceId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const calculateMatchScore = (query: string, target: string): number => {
    const queryLower = query.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    if (queryLower === targetLower) return 100;
    if (targetLower.includes(queryLower)) return 85;

    const queryWords = queryLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);

    let matchedWords = 0;
    queryWords.forEach(word => {
        if (targetWords.some(tw => tw.includes(word) || word.includes(tw))) {
            matchedWords++;
        }
    });

    return Math.round((matchedWords / queryWords.length) * 70);
};

export const examIcons: Record<string, string> = {
    'cbse': '📚',
    'jee-main': '⚡',
    'jee-advanced': '🚀',
    'neet': '🩺',
    'upsc': '🏛️',
    'gate': '💻',
    'cat': '📊',
    'university': '🎓',
};

export const getExamIcon = (examId: string): string => {
    return examIcons[examId] || '📄';
};
