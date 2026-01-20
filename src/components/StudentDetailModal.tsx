// StudentDetailModal - Collects student details before access
// IGCSE on Fingertips - Smart Paper Discovery Platform

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { theme } from '../lib/theme';
import { registerStudent, saveStudentIdLocally, StudentDetails } from '../lib/supabase';
import { generateDeviceId } from '../lib/utils';

interface StudentDetailModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (student: StudentDetails) => void;
}

// Popular IGCSE subjects for quick selection
const POPULAR_SUBJECTS = [
    { code: '0580', name: 'Mathematics' },
    { code: '0625', name: 'Physics' },
    { code: '0620', name: 'Chemistry' },
    { code: '0610', name: 'Biology' },
    { code: '0455', name: 'Economics' },
    { code: '0450', name: 'Business Studies' },
    { code: '0478', name: 'Computer Science' },
    { code: '0470', name: 'History' },
    { code: '0460', name: 'Geography' },
    { code: '0500', name: 'English (First Language)' },
];

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
    visible,
    onClose,
    onSuccess,
}) => {
    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [studentType, setStudentType] = useState<'school' | 'private'>('private');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toggleSubject = (code: string) => {
        setSelectedSubjects(prev =>
            prev.includes(code)
                ? prev.filter(s => s !== code)
                : [...prev, code]
        );
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (selectedSubjects.length === 0) {
            newErrors.subjects = 'Please select at least one subject';
        }

        if (!consent) {
            newErrors.consent = 'Please accept the terms to continue';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const deviceId = generateDeviceId();

            const result = await registerStudent({
                full_name: fullName.trim(),
                email: email.toLowerCase().trim(),
                mobile: mobile.trim() || undefined,
                subjects: selectedSubjects,
                student_type: studentType,
                consent: true,
                device_id: deviceId,
            });

            if (result.success && result.student) {
                // Save student ID locally for future recognition
                await saveStudentIdLocally(result.student.id!, result.student.email);

                // Notify parent component
                onSuccess(result.student);

                // Reset form
                resetForm();
            } else {
                Alert.alert('Registration Failed', result.error || 'Please try again.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFullName('');
        setEmail('');
        setMobile('');
        setSelectedSubjects([]);
        setStudentType('private');
        setConsent(false);
        setErrors({});
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome to IGCSE on Fingertips</Text>
                        <Text style={styles.subtitle}>
                            Please provide your details to access exam papers
                        </Text>
                    </View>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={[styles.input, errors.fullName && styles.inputError]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94a3b8"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="your.email@example.com"
                            placeholderTextColor="#94a3b8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    {/* Mobile (Optional) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+91 9876543210"
                            placeholderTextColor="#94a3b8"
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Student Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Student Type</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    studentType === 'school' && styles.toggleButtonActive,
                                ]}
                                onPress={() => setStudentType('school')}
                            >
                                <Text
                                    style={[
                                        styles.toggleText,
                                        studentType === 'school' && styles.toggleTextActive,
                                    ]}
                                >
                                    🏫 School
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    studentType === 'private' && styles.toggleButtonActive,
                                ]}
                                onPress={() => setStudentType('private')}
                            >
                                <Text
                                    style={[
                                        styles.toggleText,
                                        studentType === 'private' && styles.toggleTextActive,
                                    ]}
                                >
                                    📚 Private
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Subject Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>IGCSE Subjects *</Text>
                        <Text style={styles.hint}>Select the subjects you're preparing for</Text>
                        <View style={styles.subjectsGrid}>
                            {POPULAR_SUBJECTS.map(subject => (
                                <TouchableOpacity
                                    key={subject.code}
                                    style={[
                                        styles.subjectChip,
                                        selectedSubjects.includes(subject.code) && styles.subjectChipActive,
                                    ]}
                                    onPress={() => toggleSubject(subject.code)}
                                >
                                    <Text
                                        style={[
                                            styles.subjectChipText,
                                            selectedSubjects.includes(subject.code) && styles.subjectChipTextActive,
                                        ]}
                                    >
                                        {subject.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.subjects && <Text style={styles.errorText}>{errors.subjects}</Text>}
                    </View>

                    {/* Consent */}
                    <TouchableOpacity
                        style={styles.consentRow}
                        onPress={() => setConsent(!consent)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
                            {consent && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.consentText}>
                            I agree to the collection of my details for improving learning access and platform quality. *
                        </Text>
                    </TouchableOpacity>
                    {errors.consent && <Text style={styles.errorText}>{errors.consent}</Text>}

                    {/* Privacy Notice */}
                    <View style={styles.privacyNotice}>
                        <Text style={styles.privacyText}>
                            🔒 Your data is safe with us. We only use it to improve your learning experience.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Continue to Papers</Text>
                        )}
                    </TouchableOpacity>

                    {/* Skip Option (if needed) */}
                    <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                        <Text style={styles.skipText}>Maybe later</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    header: {
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    hint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    errorText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    toggleButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    toggleText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
    },
    toggleTextActive: {
        color: '#ffffff',
    },
    subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    subjectChip: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    subjectChipActive: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    subjectChipText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
    },
    subjectChipTextActive: {
        color: '#ffffff',
    },
    consentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: theme.fontWeight.bold,
    },
    consentText: {
        flex: 1,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    privacyNotice: {
        backgroundColor: '#dbeafe',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    privacyText: {
        fontSize: theme.fontSize.xs,
        color: '#1e40af',
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: '#ffffff',
    },
    skipButton: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    skipText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
});

export default StudentDetailModal;
