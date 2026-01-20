// QuestionSearchScreen - Search papers by pasting a question
// IGCSE on Fingertips - Smart Paper Discovery Platform

import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/lib/theme';
import { useAccessControl } from '../src/hooks/useAccessControl';
import { StudentDetailModal } from '../src/components/StudentDetailModal';

// Local question database for MVP (before Supabase questions table is populated)
const LOCAL_QUESTIONS = [
    // Mathematics 0580
    { id: '1', question: "Calculate the value of 3.7² - 1.3²", subject: "Mathematics", code: "0580", paper: "22", year: 2024, session: "s" as const, topic: "Number", marks: 2 },
    { id: '2', question: "Simplify 3x + 2y - x + 5y", subject: "Mathematics", code: "0580", paper: "22", year: 2024, session: "s" as const, topic: "Algebra", marks: 2 },
    { id: '3', question: "Find the equation of the line passing through (2,3) and (4,7)", subject: "Mathematics", code: "0580", paper: "42", year: 2023, session: "w" as const, topic: "Coordinate Geometry", marks: 3 },
    { id: '4', question: "Calculate the area of a triangle with base 8cm and height 5cm", subject: "Mathematics", code: "0580", paper: "22", year: 2023, session: "m" as const, topic: "Mensuration", marks: 2 },
    { id: '5', question: "Solve the simultaneous equations 2x + y = 7 and x - y = 2", subject: "Mathematics", code: "0580", paper: "42", year: 2024, session: "s" as const, topic: "Algebra", marks: 3 },

    // Physics 0625
    { id: '6', question: "Define acceleration and state its SI unit", subject: "Physics", code: "0625", paper: "22", year: 2023, session: "m" as const, topic: "Kinematics", marks: 2 },
    { id: '7', question: "State the principle of conservation of energy", subject: "Physics", code: "0625", paper: "22", year: 2024, session: "m" as const, topic: "Energy", marks: 2 },
    { id: '8', question: "Calculate the resistance of a wire if V = 12V and I = 2A", subject: "Physics", code: "0625", paper: "42", year: 2024, session: "s" as const, topic: "Electricity", marks: 2 },
    { id: '9', question: "State Newton's second law of motion", subject: "Physics", code: "0625", paper: "22", year: 2024, session: "s" as const, topic: "Dynamics", marks: 2 },
    { id: '10', question: "Calculate the wavelength of a wave with frequency 500Hz and speed 340m/s", subject: "Physics", code: "0625", paper: "42", year: 2023, session: "w" as const, topic: "Waves", marks: 3 },

    // Chemistry 0620
    { id: '11', question: "What is the atomic number of carbon?", subject: "Chemistry", code: "0620", paper: "22", year: 2024, session: "s" as const, topic: "Atomic Structure", marks: 1 },
    { id: '12', question: "Balance the equation: Fe + O₂ → Fe₂O₃", subject: "Chemistry", code: "0620", paper: "42", year: 2023, session: "w" as const, topic: "Chemical Equations", marks: 2 },
    { id: '13', question: "Describe the test for carbon dioxide gas", subject: "Chemistry", code: "0620", paper: "22", year: 2024, session: "m" as const, topic: "Tests", marks: 2 },
    { id: '14', question: "What is the pH of a neutral solution?", subject: "Chemistry", code: "0620", paper: "22", year: 2023, session: "s" as const, topic: "Acids and Bases", marks: 1 },

    // Biology 0610
    { id: '15', question: "Name the organelle responsible for photosynthesis", subject: "Biology", code: "0610", paper: "22", year: 2024, session: "s" as const, topic: "Cell Biology", marks: 1 },
    { id: '16', question: "Describe the process of osmosis", subject: "Biology", code: "0610", paper: "42", year: 2023, session: "w" as const, topic: "Transport", marks: 3 },
    { id: '17', question: "State two functions of the cell membrane", subject: "Biology", code: "0610", paper: "22", year: 2024, session: "m" as const, topic: "Cell Biology", marks: 2 },
    { id: '18', question: "What is the role of enzymes in digestion?", subject: "Biology", code: "0610", paper: "42", year: 2024, session: "s" as const, topic: "Enzymes", marks: 3 },

    // Economics 0455
    { id: '19', question: "Define opportunity cost", subject: "Economics", code: "0455", paper: "22", year: 2024, session: "s" as const, topic: "Basic Economic Problem", marks: 2 },
    { id: '20', question: "Explain the law of demand", subject: "Economics", code: "0455", paper: "22", year: 2023, session: "s" as const, topic: "Demand", marks: 3 },
    { id: '21', question: "What are the factors of production?", subject: "Economics", code: "0455", paper: "12", year: 2023, session: "w" as const, topic: "Production", marks: 4 },

    // A-Level Physics 9702
    { id: '22', question: "Derive the equation for kinetic energy", subject: "Physics (A-Level)", code: "9702", paper: "22", year: 2023, session: "m" as const, topic: "Mechanics", marks: 3 },
    { id: '23', question: "Explain the photoelectric effect and its significance", subject: "Physics (A-Level)", code: "9702", paper: "42", year: 2024, session: "s" as const, topic: "Quantum Physics", marks: 5 },
];

interface SearchResult {
    id: string;
    question: string;
    subject: string;
    code: string;
    paper: string;
    year: number;
    session: 'm' | 's' | 'w';
    topic: string;
    marks: number;
    matchScore: number;
    matchType: 'exact' | 'similar' | 'partial';
}

const getSessionName = (s: 'm' | 's' | 'w'): string => {
    switch (s) {
        case 'm': return 'Feb/Mar';
        case 's': return 'May/Jun';
        case 'w': return 'Oct/Nov';
    }
};

const calculateMatchScore = (query: string, target: string): { score: number; type: 'exact' | 'similar' | 'partial' } => {
    const queryLower = query.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    // Exact match
    if (targetLower.includes(queryLower) && queryLower.length > 10) {
        return { score: 100, type: 'exact' };
    }

    // Word-based matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const targetWords = targetLower.split(/\s+/);

    let matchedWords = 0;
    queryWords.forEach(word => {
        if (targetWords.some((tw: string) => tw.includes(word) || word.includes(tw))) {
            matchedWords++;
        }
    });

    if (queryWords.length === 0) return { score: 0, type: 'partial' };

    const score = Math.round((matchedWords / queryWords.length) * 100);

    if (score >= 80) return { score, type: 'exact' };
    if (score >= 50) return { score, type: 'similar' };
    return { score, type: 'partial' };
};

export default function QuestionSearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Access control
    const {
        requireAccess,
        showDetailModal,
        setShowDetailModal,
        onStudentVerified,
    } = useAccessControl();

    // Search results with scoring
    const searchResults = useMemo((): SearchResult[] => {
        if (!searchQuery.trim() || searchQuery.length < 3) return [];

        const results: SearchResult[] = LOCAL_QUESTIONS
            .map(q => {
                const { score, type } = calculateMatchScore(searchQuery, q.question);
                return {
                    ...q,
                    matchScore: score,
                    matchType: type,
                };
            })
            .filter(r => r.matchScore >= 30) // Only show relevant results
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 15); // Limit results

        return results;
    }, [searchQuery]);

    // Navigate to home with prefilled params
    const handleViewPaper = useCallback((result: SearchResult) => {
        requireAccess(() => {
            Keyboard.dismiss();
            router.push({
                pathname: '/',
                params: {
                    selectedCode: result.code,
                    selectedName: result.subject,
                    selectedSlug: `${result.subject.toLowerCase()}-${result.code}`,
                    selectedLevel: result.code.startsWith('9') ? 'alevel' : 'igcse',
                    prefillPaper: result.paper,
                    prefillYear: result.year.toString(),
                    prefillSession: result.session,
                },
            });
        });
    }, [requireAccess, router]);

    const clearSearch = () => {
        setSearchQuery('');
        Keyboard.dismiss();
    };

    const getMatchBadgeColor = (type: 'exact' | 'similar' | 'partial') => {
        switch (type) {
            case 'exact': return '#10b981';
            case 'similar': return '#f59e0b';
            case 'partial': return '#94a3b8';
        }
    };

    const getMatchBadgeText = (type: 'exact' | 'similar' | 'partial') => {
        switch (type) {
            case 'exact': return '✓ Exact Match';
            case 'similar': return '≈ Similar';
            case 'partial': return '○ Partial';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Student Detail Modal */}
            <StudentDetailModal
                visible={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                onSuccess={onStudentVerified}
            />

            {/* Search Header */}
            <View style={styles.searchHeader}>
                <Text style={styles.headerTitle}>🔍 Find Paper by Question</Text>
                <Text style={styles.headerSubtitle}>
                    Paste any IGCSE question to find its source paper
                </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Paste a question here... (e.g., 'Calculate the resistance of a wire')"
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Results Count */}
            {searchQuery.length >= 3 && (
                <View style={styles.resultsInfo}>
                    <Text style={styles.resultsCount}>
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </Text>
                    {searchResults.length === 0 && (
                        <Text style={styles.noResultsHint}>
                            Try different keywords or check spelling
                        </Text>
                    )}
                </View>
            )}

            {/* Results List */}
            <ScrollView
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {searchResults.map((result) => (
                    <TouchableOpacity
                        key={result.id}
                        style={styles.resultCard}
                        onPress={() => handleViewPaper(result)}
                        activeOpacity={0.7}
                    >
                        {/* Match Badge */}
                        <View style={[styles.matchBadge, { backgroundColor: getMatchBadgeColor(result.matchType) + '20' }]}>
                            <Text style={[styles.matchBadgeText, { color: getMatchBadgeColor(result.matchType) }]}>
                                {getMatchBadgeText(result.matchType)}
                            </Text>
                            <Text style={[styles.matchScore, { color: getMatchBadgeColor(result.matchType) }]}>
                                {result.matchScore}%
                            </Text>
                        </View>

                        {/* Question Preview */}
                        <Text style={styles.questionText} numberOfLines={2}>
                            {result.question}
                        </Text>

                        {/* Paper Info */}
                        <View style={styles.paperInfo}>
                            <View style={styles.subjectBadge}>
                                <Text style={styles.subjectCode}>{result.code}</Text>
                            </View>
                            <Text style={styles.paperDetails}>
                                {result.subject} • Paper {result.paper} • {getSessionName(result.session)} {result.year}
                            </Text>
                        </View>

                        {/* Topic & Marks */}
                        <View style={styles.metaRow}>
                            <View style={styles.topicBadge}>
                                <Text style={styles.topicText}>{result.topic}</Text>
                            </View>
                            <Text style={styles.marksText}>{result.marks} marks</Text>
                        </View>

                        {/* Action */}
                        <View style={styles.actionRow}>
                            <Text style={styles.actionText}>Tap to view paper →</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Empty State */}
                {searchQuery.length < 3 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={styles.emptyTitle}>Paste Your Question</Text>
                        <Text style={styles.emptyDescription}>
                            Enter at least 3 characters to search through our question bank.
                            We'll find the exact paper with that question.
                        </Text>
                        <View style={styles.sampleQuestions}>
                            <Text style={styles.sampleTitle}>Try these:</Text>
                            <TouchableOpacity
                                style={styles.sampleQuestion}
                                onPress={() => setSearchQuery('Calculate the resistance')}
                            >
                                <Text style={styles.sampleText}>"Calculate the resistance"</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sampleQuestion}
                                onPress={() => setSearchQuery('conservation of energy')}
                            >
                                <Text style={styles.sampleText}>"conservation of energy"</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sampleQuestion}
                                onPress={() => setSearchQuery('opportunity cost')}
                            >
                                <Text style={styles.sampleText}>"opportunity cost"</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchHeader: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: '#ffffff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.secondary,
    },
    searchInputContainer: {
        margin: theme.spacing.md,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        paddingRight: 40,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        borderWidth: 2,
        borderColor: theme.colors.secondary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    clearButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.bold,
    },
    resultsInfo: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    resultsCount: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
    noResultsHint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textLight,
        marginTop: 2,
    },
    resultsList: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
    },
    resultCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.md,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing.sm,
    },
    matchBadgeText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    matchScore: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    questionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
        lineHeight: 22,
        marginBottom: theme.spacing.sm,
    },
    paperInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    subjectBadge: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.sm,
        marginRight: theme.spacing.sm,
    },
    subjectCode: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: '#ffffff',
    },
    paperDetails: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    topicBadge: {
        backgroundColor: theme.colors.backgroundDark,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.full,
    },
    topicText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    marksText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    actionRow: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.sm,
        marginTop: theme.spacing.xs,
    },
    actionText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.secondary,
        fontWeight: theme.fontWeight.semibold,
        textAlign: 'center',
    },
    emptyState: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: theme.spacing.md,
    },
    emptyTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    emptyDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: theme.spacing.lg,
    },
    sampleQuestions: {
        width: '100%',
    },
    sampleTitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    sampleQuestion: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sampleText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.secondary,
        fontStyle: 'italic',
    },
});
