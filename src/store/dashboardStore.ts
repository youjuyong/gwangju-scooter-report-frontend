import {create} from 'zustand';

interface ManualState {
    currentMode: 'AUTO' | 'MANUAL';
    isSubmitting: boolean;
    setMode: (mode: 'AUTO' | 'MANUAL') => void;
    setIsSubmitting: (loading: boolean) => void;
    clearAction: () => void;
}

export const useModeStore = create<ManualState>((set) => ({
    currentMode: 'AUTO',
    isSubmitting: false,

    setMode: (mode) => set({currentMode: mode}),
    setIsSubmitting: (loading) => set({isSubmitting: loading}),
    clearAction: () => set({isSubmitting: false}),
}));

