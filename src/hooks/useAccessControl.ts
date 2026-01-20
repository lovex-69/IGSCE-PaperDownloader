// Access Control Hook - Gates paper access behind student details
// IGCSE on Fingertips - Smart Paper Discovery Platform

import { useState, useEffect, useCallback } from 'react';
import {
    getSavedStudentId,
    getSavedStudentEmail,
    getStudentById,
    updateStudentAccess,
    StudentDetails,
} from '../lib/supabase';

interface UseAccessControlReturn {
    // State
    isVerified: boolean;
    isLoading: boolean;
    studentDetails: StudentDetails | null;
    showDetailModal: boolean;

    // Actions
    setShowDetailModal: (show: boolean) => void;
    requireAccess: (onGranted: () => void) => void;
    onStudentVerified: (student: StudentDetails) => void;
    refreshStudentStatus: () => Promise<void>;
}

/**
 * Hook to manage access control for paper downloads and previews.
 * 
 * Usage:
 * ```tsx
 * const { requireAccess, showDetailModal, onStudentVerified } = useAccessControl();
 * 
 * const handleDownload = () => {
 *     requireAccess(() => {
 *         // This runs only if student is verified
 *         startDownload();
 *     });
 * };
 * 
 * return (
 *     <>
 *         <Button onPress={handleDownload} title="Download" />
 *         <StudentDetailModal 
 *             visible={showDetailModal} 
 *             onSuccess={onStudentVerified}
 *             onClose={() => setShowDetailModal(false)}
 *         />
 *     </>
 * );
 * ```
 */
export function useAccessControl(): UseAccessControlReturn {
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Check if student is already verified on mount
    useEffect(() => {
        refreshStudentStatus();
    }, []);

    // Execute pending action when verified
    useEffect(() => {
        if (isVerified && pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    }, [isVerified, pendingAction]);

    /**
     * Check if student has valid saved credentials
     */
    const refreshStudentStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const savedId = await getSavedStudentId();
            const savedEmail = await getSavedStudentEmail();

            if (savedId) {
                // Verify the student still exists in database
                const student = await getStudentById(savedId);
                if (student) {
                    setStudentDetails(student);
                    setIsVerified(true);
                    // Update last access time in background
                    updateStudentAccess(savedId).catch(() => { });
                } else {
                    // Student ID not found, reset
                    setIsVerified(false);
                    setStudentDetails(null);
                }
            } else if (savedEmail) {
                // Fallback: try to find by email
                // This handles cases where local storage was partially cleared
                setIsVerified(false);
            } else {
                setIsVerified(false);
            }
        } catch (error) {
            console.error('[useAccessControl] Error checking status:', error);
            setIsVerified(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Require access before performing an action.
     * If student is verified, executes immediately.
     * If not, shows the detail modal and executes after verification.
     */
    const requireAccess = useCallback((onGranted: () => void) => {
        if (isVerified) {
            // Student already verified, execute immediately
            onGranted();
        } else {
            // Store the pending action and show modal
            setPendingAction(() => onGranted);
            setShowDetailModal(true);
        }
    }, [isVerified]);

    /**
     * Called when student successfully submits their details
     */
    const onStudentVerified = useCallback((student: StudentDetails) => {
        setStudentDetails(student);
        setIsVerified(true);
        setShowDetailModal(false);
        // Pending action will be executed by the useEffect above
    }, []);

    return {
        isVerified,
        isLoading,
        studentDetails,
        showDetailModal,
        setShowDetailModal,
        requireAccess,
        onStudentVerified,
        refreshStudentStatus,
    };
}

export default useAccessControl;
