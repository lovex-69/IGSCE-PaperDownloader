import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDeviceId } from './utils';

export interface UserDetails {
    fullName: string;
    email: string;
    mobile: string;
    examPreparingFor: string;
    role?: 'student' | 'teacher' | 'institute';
    submittedAt: string;
}

export interface Download {
    id: string;
    paperId: string;
    paperTitle: string;
    type: 'paper' | 'answers' | 'combined';
    downloadedAt: string;
}

interface AppState {
    // User Identity
    userDetails: UserDetails | null;
    hasSubmittedDetails: boolean;
    deviceId: string;

    // Downloads
    downloadHistory: Download[];

    // Search
    recentSearches: string[];

    // Actions
    setUserDetails: (details: UserDetails) => void;
    clearUserDetails: () => void;
    addDownload: (download: Download) => void;
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial State
            userDetails: null,
            hasSubmittedDetails: false,
            deviceId: generateDeviceId(),
            downloadHistory: [],
            recentSearches: [],

            // Actions
            setUserDetails: (details) => set({
                userDetails: details,
                hasSubmittedDetails: true,
            }),

            clearUserDetails: () => set({
                userDetails: null,
                hasSubmittedDetails: false,
            }),

            addDownload: (download) => set((state) => ({
                downloadHistory: [download, ...state.downloadHistory].slice(0, 50),
            })),

            addRecentSearch: (query) => set((state) => {
                const filtered = state.recentSearches.filter(s => s !== query);
                return {
                    recentSearches: [query, ...filtered].slice(0, 10),
                };
            }),

            clearRecentSearches: () => set({ recentSearches: [] }),
        }),
        {
            name: 'examvault-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
