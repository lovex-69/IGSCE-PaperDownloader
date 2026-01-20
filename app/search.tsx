import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const BRAND_COLOR = '#1e3a5f';
const ACCENT_COLOR = '#0d9488';

// Searchable Question Database
const questionDatabase = [
    // Mathematics 0580
    { id: 1, question: "Calculate the value of 3.7² - 1.3²", subject: "Mathematics", code: "0580", paper: "22", year: 2024, session: "s", topic: "Number" },
    { id: 2, question: "Solve the equation 5x - 3 = 2x + 12", subject: "Mathematics", code: "0580", paper: "22", year: 2024, session: "m", topic: "Algebra" },
    { id: 3, question: "Find the area of a triangle with base 8cm and height 5cm", subject: "Mathematics", code: "0580", paper: "42", year: 2023, session: "w", topic: "Geometry" },
    { id: 4, question: "Simplify 3a + 2b - a + 5b", subject: "Mathematics", code: "0580", paper: "22", year: 2023, session: "s", topic: "Algebra" },
    { id: 5, question: "Calculate the mean of 12, 15, 18, 21, 24", subject: "Mathematics", code: "0580", paper: "22", year: 2022, session: "s", topic: "Statistics" },
    { id: 6, question: "Factorise completely x² - 9", subject: "Mathematics", code: "0580", paper: "42", year: 2022, session: "w", topic: "Algebra" },

    // Physics 0625
    { id: 7, question: "A car travels 150km in 2 hours. Calculate its average speed.", subject: "Physics", code: "0625", paper: "22", year: 2023, session: "s", topic: "Mechanics" },
    { id: 8, question: "State the principle of conservation of energy", subject: "Physics", code: "0625", paper: "22", year: 2024, session: "m", topic: "Energy" },
    { id: 9, question: "Calculate the resistance of a wire if V = 12V and I = 2A", subject: "Physics", code: "0625", paper: "42", year: 2024, session: "s", topic: "Electricity" },
    { id: 10, question: "What is the unit of frequency?", subject: "Physics", code: "0625", paper: "22", year: 2023, session: "w", topic: "Waves" },

    // Chemistry 0620
    { id: 11, question: "What is the atomic number of Carbon?", subject: "Chemistry", code: "0620", paper: "22", year: 2023, session: "s", topic: "Atomic Structure" },
    { id: 12, question: "Balance the equation: H₂ + O₂ → H₂O", subject: "Chemistry", code: "0620", paper: "22", year: 2024, session: "m", topic: "Equations" },
    { id: 13, question: "What type of bonding is present in NaCl?", subject: "Chemistry", code: "0620", paper: "22", year: 2024, session: "s", topic: "Bonding" },
    { id: 14, question: "Name the products of complete combustion of methane", subject: "Chemistry", code: "0620", paper: "42", year: 2022, session: "w", topic: "Organic" },

    // Economics 0455
    { id: 15, question: "Define the term opportunity cost", subject: "Economics", code: "0455", paper: "12", year: 2024, session: "m", topic: "Scarcity" },
    { id: 16, question: "Explain the law of demand", subject: "Economics", code: "0455", paper: "22", year: 2023, session: "s", topic: "Demand" },
    { id: 17, question: "What are the factors of production?", subject: "Economics", code: "0455", paper: "12", year: 2023, session: "w", topic: "Production" },

    // Biology 0610
    { id: 18, question: "Name the organelle responsible for photosynthesis", subject: "Biology", code: "0610", paper: "22", year: 2024, session: "s", topic: "Cells" },
    { id: 19, question: "What is the function of red blood cells?", subject: "Biology", code: "0610", paper: "22", year: 2023, session: "m", topic: "Human Biology" },
    { id: 20, question: "Describe the process of osmosis", subject: "Biology", code: "0610", paper: "42", year: 2023, session: "s", topic: "Transport" },

    // A-Level Mathematics 9709
    { id: 21, question: "Find dy/dx when y = 3x² - 4x + 7", subject: "Mathematics", code: "9709", paper: "12", year: 2024, session: "s", topic: "Calculus" },
    { id: 22, question: "Solve the integral ∫2x dx", subject: "Mathematics", code: "9709", paper: "12", year: 2023, session: "m", topic: "Integration" },
    { id: 23, question: "Find the sum of the first 10 terms of an arithmetic series", subject: "Mathematics", code: "9709", paper: "32", year: 2023, session: "w", topic: "Series" },

    // A-Level Physics 9702
    { id: 24, question: "Define acceleration and state its SI unit", subject: "Physics", code: "9702", paper: "22", year: 2023, session: "m", topic: "Kinematics" },
    { id: 25, question: "State Newton's second law of motion", subject: "Physics", code: "9702", paper: "22", year: 2024, session: "s", topic: "Dynamics" },
];

interface SearchResult {
    id: number;
    question: string;
    subject: string;
    code: string;
    paper: string;
    year: number;
    session: string;
    topic: string;
    matchScore: number;
}

const getSessionName = (s: string) => {
    switch (s) {
        case 'm': return 'Feb/Mar';
        case 's': return 'May/Jun';
        case 'w': return 'Oct/Nov';
        default: return s;
    }
};

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<number | null>(null);

    const subjects = useMemo(() => [...new Set(questionDatabase.map(q => q.subject))].sort(), []);
    const years = useMemo(() => [...new Set(questionDatabase.map(q => q.year))].sort((a, b) => b - a), []);


    const results = useMemo((): SearchResult[] => {
        let filtered = [...questionDatabase];
        if (subjectFilter) filtered = filtered.filter(q => q.subject === subjectFilter);
        if (yearFilter) filtered = filtered.filter(q => q.year === yearFilter);

        let scored: SearchResult[];

        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            scored = filtered.map(q => {
                const questionLower = q.question.toLowerCase();
                const topicLower = q.topic.toLowerCase();
                let score = 0;
                if (questionLower.includes(lowerQuery)) score = 100;
                else if (topicLower.includes(lowerQuery)) score = 70;
                else {
                    const words = lowerQuery.split(/\s+/).filter(w => w.length > 2);
                    const matched = words.filter(w => questionLower.includes(w) || topicLower.includes(w));
                    score = Math.round((matched.length / Math.max(words.length, 1)) * 60);
                }
                return { ...q, matchScore: score };
            }).filter(q => q.matchScore > 15);
        } else {
            scored = filtered.map(q => ({ ...q, matchScore: 50 }));
        }

        return scored.sort((a, b) => b.matchScore - a.matchScore);
    }, [query, subjectFilter, yearFilter]);

    // Navigate to home with pre-filled details
    const handleDownload = (result: SearchResult) => {
        // Pass the full paper code (e.g., "22" for paper 2 variant 2)
        router.replace({
            pathname: '/',
            params: {
                // Subject info
                selectedCode: result.code,
                selectedName: result.subject,
                selectedSlug: `${result.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${result.code}`,
                selectedLevel: result.code.startsWith('9') ? 'alevel' : 'igcse',
                // Paper details - pass full code like "22"
                prefillPaper: result.paper,
                prefillVariant: '',
                prefillYear: result.year.toString(),
                prefillSession: result.session,
            }
        });
    };


    const shareToWhatsApp = (result: SearchResult) => {
        const message = `📚 IGCSE Question\n\nSubject: ${result.subject} (${result.code})\nTopic: ${result.topic}\nPaper: ${result.paper} - ${getSessionName(result.session)} ${result.year}\n\n"${result.question}"\n\n- IGCSE on Fingertips`;
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    };

    const clearFilters = () => {
        setQuery('');
        setSubjectFilter(null);
        setYearFilter(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Search */}
            <View style={styles.searchBox}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search questions, topics..."
                    placeholderTextColor="#94a3b8"
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                />
            </View>

            {/* Filters */}
            <View style={styles.filters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterChip, !subjectFilter && styles.filterOn]}
                        onPress={() => setSubjectFilter(null)}
                    >
                        <Text style={[styles.filterText, !subjectFilter && styles.filterTextOn]}>All</Text>
                    </TouchableOpacity>
                    {subjects.map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.filterChip, subjectFilter === s && styles.filterOn]}
                            onPress={() => setSubjectFilter(s)}
                        >
                            <Text style={[styles.filterText, subjectFilter === s && styles.filterTextOn]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearRow}>
                    {years.map(y => (
                        <TouchableOpacity
                            key={y}
                            style={[styles.yearChip, yearFilter === y && styles.yearOn]}
                            onPress={() => setYearFilter(yearFilter === y ? null : y)}
                        >
                            <Text style={[styles.yearText, yearFilter === y && styles.yearTextOn]}>{y}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results Header */}
            <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{results.length} questions</Text>
                {(query || subjectFilter || yearFilter) && (
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.clearBtn}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.badges}>
                                <View style={styles.codeBadge}>
                                    <Text style={styles.codeBadgeText}>{item.code}</Text>
                                </View>
                                <View style={styles.topicBadge}>
                                    <Text style={styles.topicBadgeText}>{item.topic}</Text>
                                </View>
                            </View>
                            {query && (
                                <Text style={styles.matchScore}>{item.matchScore}%</Text>
                            )}
                        </View>

                        <Text style={styles.questionText} numberOfLines={2}>"{item.question}"</Text>

                        <Text style={styles.paperInfo}>
                            Paper {item.paper} • {getSessionName(item.session)} {item.year}
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
                                <Text style={styles.downloadBtnText}>📥 Download Paper</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waBtn} onPress={() => shareToWhatsApp(item)}>
                                <Text style={styles.waBtnText}>💬</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>No questions found</Text>
                        <Text style={styles.emptyText}>Try different keywords</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    searchBox: { padding: 12, backgroundColor: '#fff' },
    searchInput: {
        backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
        fontSize: 15, borderWidth: 1.5, borderColor: '#e2e8f0',
    },
    filters: { backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        backgroundColor: '#f1f5f9', marginLeft: 8, borderWidth: 1, borderColor: '#e2e8f0',
    },
    filterOn: { backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR },
    filterText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    filterTextOn: { color: '#fff' },
    yearRow: { marginTop: 6 },
    yearChip: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        backgroundColor: '#f8fafc', marginLeft: 8, borderWidth: 1, borderColor: '#e2e8f0',
    },
    yearOn: { backgroundColor: ACCENT_COLOR, borderColor: ACCENT_COLOR },
    yearText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    yearTextOn: { color: '#fff' },
    resultsHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc',
    },
    resultsCount: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    clearBtn: { fontSize: 12, color: ACCENT_COLOR, fontWeight: '600' },
    list: { flex: 1, paddingHorizontal: 12 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10,
        borderLeftWidth: 4, borderLeftColor: ACCENT_COLOR,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    badges: { flexDirection: 'row' },
    codeBadge: { backgroundColor: BRAND_COLOR, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
    codeBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    topicBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    topicBadgeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
    matchScore: { fontSize: 11, fontWeight: '700', color: ACCENT_COLOR },
    questionText: { fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 20 },
    paperInfo: { fontSize: 12, color: '#64748b', marginTop: 8 },
    actions: { flexDirection: 'row', marginTop: 12 },
    downloadBtn: {
        flex: 1, backgroundColor: BRAND_COLOR, borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 8,
    },
    downloadBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    waBtn: { backgroundColor: '#25D366', borderRadius: 8, padding: 10, paddingHorizontal: 14 },
    waBtnText: { fontSize: 16 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#475569' },
    emptyText: { fontSize: 13, color: '#94a3b8' },
});
