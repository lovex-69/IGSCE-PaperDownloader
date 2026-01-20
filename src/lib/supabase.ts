// Supabase Configuration for IGCSE on Fingertips
// Smart Paper Discovery Platform

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// CONFIGURATION
// =============================================================================

// TODO: Replace with your actual Supabase project credentials
// Get these from: https://app.supabase.com → Your Project → Settings → API
const SUPABASE_URL = 'https://tavjteiixytalmvmoqhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdmp0ZWlpeHl0YWxtdm1vcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDQ3NTEsImV4cCI6MjA4NDQ4MDc1MX0.MTw_aTXo-KIjqJimTOGcLvCjcqgsiEApvXnn55VebTc';

// =============================================================================
// TYPES
// =============================================================================

export interface StudentDetails {
    id?: string;
    email: string;
    full_name: string;
    mobile?: string;
    subjects: string[];
    student_type?: 'school' | 'private';
    consent: boolean;
    device_id?: string;
    created_at?: string;
    last_accessed_at?: string;
    papers_accessed?: number;
}

export interface Paper {
    id: string;
    subject_code: string;
    subject_name: string;
    paper_code: string;
    year: number;
    session: 'm' | 's' | 'w';
    paper_type: 'qp' | 'ms' | 'er';
    variant: string;
    file_url?: string;
    source: 'admin' | 'external';
    visibility: 'public' | 'restricted';
    created_at?: string;
}

export interface Question {
    id: string;
    paper_id: string;
    question_number: string;
    question_text: string;
    topic?: string;
    marks?: number;
}

export interface QuestionSearchResult extends Question {
    paper: Paper;
    match_score: number;
    match_type: 'exact' | 'similar' | 'partial';
}

export interface AccessLog {
    id?: string;
    student_id: string;
    paper_id: string;
    action: 'view' | 'download';
    created_at?: string;
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// =============================================================================
// STUDENT FUNCTIONS
// =============================================================================

/**
 * Register a new student or update existing one (by email)
 */
export async function registerStudent(details: StudentDetails): Promise<{
    success: boolean;
    student?: StudentDetails;
    error?: string;
    isNew?: boolean;
}> {
    try {
        // Check if student already exists
        const { data: existingStudent, error: fetchError } = await supabase
            .from('students')
            .select('*')
            .eq('email', details.email.toLowerCase().trim())
            .single();

        if (existingStudent) {
            // Update existing student
            const { data: updatedStudent, error: updateError } = await supabase
                .from('students')
                .update({
                    full_name: details.full_name,
                    mobile: details.mobile,
                    subjects: [...new Set([...(existingStudent.subjects || []), ...details.subjects])],
                    last_accessed_at: new Date().toISOString(),
                    papers_accessed: (existingStudent.papers_accessed || 0) + 1,
                })
                .eq('id', existingStudent.id)
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, student: updatedStudent, isNew: false };
        }

        // Create new student
        const { data: newStudent, error: insertError } = await supabase
            .from('students')
            .insert({
                email: details.email.toLowerCase().trim(),
                full_name: details.full_name,
                mobile: details.mobile,
                subjects: details.subjects,
                student_type: details.student_type || 'private',
                consent: details.consent,
                device_id: details.device_id,
                created_at: new Date().toISOString(),
                last_accessed_at: new Date().toISOString(),
                papers_accessed: 0,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return { success: true, student: newStudent, isNew: true };
    } catch (error: any) {
        console.error('[registerStudent] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get student by email
 */
export async function getStudentByEmail(email: string): Promise<StudentDetails | null> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[getStudentByEmail] Error:', error);
        return null;
    }
}

/**
 * Get student by ID
 */
export async function getStudentById(id: string): Promise<StudentDetails | null> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[getStudentById] Error:', error);
        return null;
    }
}

/**
 * Update student's last access time
 */
export async function updateStudentAccess(studentId: string): Promise<void> {
    try {
        await supabase
            .from('students')
            .update({
                last_accessed_at: new Date().toISOString(),
                papers_accessed: supabase.rpc('increment_papers_accessed', { student_id: studentId }),
            })
            .eq('id', studentId);
    } catch (error) {
        console.error('[updateStudentAccess] Error:', error);
    }
}

// =============================================================================
// QUESTION SEARCH FUNCTIONS
// =============================================================================

/**
 * Search questions by text (full-text search)
 */
export async function searchQuestions(query: string, limit = 20): Promise<QuestionSearchResult[]> {
    try {
        if (!query.trim()) return [];

        // Use Supabase full-text search
        const { data, error } = await supabase
            .from('questions')
            .select(`
                *,
                paper:papers(*)
            `)
            .textSearch('question_text', query, {
                type: 'websearch',
                config: 'english',
            })
            .limit(limit);

        if (error) throw error;

        // Calculate match scores
        const results: QuestionSearchResult[] = (data || []).map((item: any) => {
            const queryLower = query.toLowerCase();
            const textLower = item.question_text.toLowerCase();

            let matchScore = 0;
            let matchType: 'exact' | 'similar' | 'partial' = 'partial';

            if (textLower.includes(queryLower)) {
                matchScore = 100;
                matchType = 'exact';
            } else {
                // Word-based matching
                const queryWords = queryLower.split(/\s+/);
                const textWords = textLower.split(/\s+/);
                let matchedWords = 0;
                queryWords.forEach(word => {
                    if (textWords.some((tw: string) => tw.includes(word))) matchedWords++;
                });
                matchScore = Math.round((matchedWords / queryWords.length) * 100);
                matchType = matchScore > 70 ? 'similar' : 'partial';
            }

            return {
                ...item,
                paper: item.paper,
                match_score: matchScore,
                match_type: matchType,
            };
        });

        // Sort by match score
        return results.sort((a, b) => b.match_score - a.match_score);
    } catch (error) {
        console.error('[searchQuestions] Error:', error);
        return [];
    }
}

/**
 * Get paper by ID
 */
export async function getPaperById(id: string): Promise<Paper | null> {
    try {
        const { data, error } = await supabase
            .from('papers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[getPaperById] Error:', error);
        return null;
    }
}

// =============================================================================
// ACCESS LOGGING
// =============================================================================

/**
 * Log paper access for analytics
 */
export async function logPaperAccess(
    studentId: string,
    paperId: string,
    action: 'view' | 'download'
): Promise<void> {
    try {
        await supabase.from('access_logs').insert({
            student_id: studentId,
            paper_id: paperId,
            action,
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[logPaperAccess] Error:', error);
    }
}

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

const STUDENT_ID_KEY = 'igcse_student_id';
const STUDENT_EMAIL_KEY = 'igcse_student_email';

/**
 * Save student ID to local storage
 */
export async function saveStudentIdLocally(studentId: string, email: string): Promise<void> {
    try {
        await AsyncStorage.setItem(STUDENT_ID_KEY, studentId);
        await AsyncStorage.setItem(STUDENT_EMAIL_KEY, email);
    } catch (error) {
        console.error('[saveStudentIdLocally] Error:', error);
    }
}

/**
 * Get saved student ID from local storage
 */
export async function getSavedStudentId(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(STUDENT_ID_KEY);
    } catch (error) {
        console.error('[getSavedStudentId] Error:', error);
        return null;
    }
}

/**
 * Get saved student email from local storage
 */
export async function getSavedStudentEmail(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(STUDENT_EMAIL_KEY);
    } catch (error) {
        console.error('[getSavedStudentEmail] Error:', error);
        return null;
    }
}

/**
 * Clear student data from local storage
 */
export async function clearStudentData(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STUDENT_ID_KEY);
        await AsyncStorage.removeItem(STUDENT_EMAIL_KEY);
    } catch (error) {
        console.error('[clearStudentData] Error:', error);
    }
}
