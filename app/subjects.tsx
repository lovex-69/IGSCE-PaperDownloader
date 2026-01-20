import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAllSubjects } from '../src/lib/data/subjects';

const BRAND_COLOR = '#1e3a5f';
const ACCENT_COLOR = '#0d9488';

const allSubjects = getAllSubjects();

export default function SubjectPickerScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const filteredSubjects = useMemo(() => {
        if (!search.trim()) return allSubjects;
        const lower = search.toLowerCase();
        return allSubjects.filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.code.includes(search)
        );
    }, [search]);

    const handleSelect = (subject: typeof allSubjects[0]) => {
        // Navigate back with selected subject as param
        router.replace({
            pathname: '/',
            params: {
                selectedCode: subject.code,
                selectedName: subject.name,
                selectedSlug: subject.slug,
                selectedLevel: subject.level
            }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Search Input */}
            <View style={styles.searchBox}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or code (e.g., Physics, 0625)"
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                    autoFocus={true}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Results Count */}
            <Text style={styles.resultCount}>
                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} found
            </Text>

            {/* Subject List */}
            <FlatList
                data={filteredSubjects}
                keyExtractor={(item) => `${item.code}-${item.level}`}
                style={styles.list}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                        <View style={styles.itemLeft}>
                            <Text style={styles.itemCode}>{item.code}</Text>
                            <View style={[
                                styles.levelTag,
                                item.level === 'alevel' && styles.levelTagA,
                                item.level === 'olevel' && styles.levelTagO,
                            ]}>
                                <Text style={styles.levelTagText}>
                                    {item.level === 'igcse' ? 'IGCSE' : item.level === 'alevel' ? 'A-Level' : 'O-Level'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No subjects match "{search}"</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    searchBox: {
        backgroundColor: '#ffffff',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 12,
        paddingRight: 40,
        fontSize: 15,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    clearBtn: {
        position: 'absolute',
        right: 24,
        padding: 8,
    },
    clearText: { fontSize: 16, color: '#94a3b8' },
    resultCount: {
        padding: 12,
        paddingBottom: 8,
        fontSize: 12,
        color: '#64748b',
        backgroundColor: '#f8fafc',
    },
    list: { flex: 1 },
    item: {
        backgroundColor: '#ffffff',
        padding: 14,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    itemLeft: { width: 65, alignItems: 'center', marginRight: 10 },
    itemCode: { fontSize: 15, fontWeight: '700', color: BRAND_COLOR },
    levelTag: {
        marginTop: 4,
        backgroundColor: '#dbeafe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    levelTagA: { backgroundColor: '#fce7f3' },
    levelTagO: { backgroundColor: '#d1fae5' },
    levelTagText: { fontSize: 9, fontWeight: '600', color: '#475569' },
    itemName: { flex: 1, fontSize: 14, color: '#334155' },
    arrow: { fontSize: 20, color: '#94a3b8', marginLeft: 8 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#94a3b8' },
});
