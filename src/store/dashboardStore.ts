import {create} from 'zustand';

interface ManualState {
    currentMode: 'AUTO' | 'MANUAL';
    isSubmitting: boolean;
    processingDclrId: string | null;
    setMode: (mode: 'AUTO' | 'MANUAL') => void;
    setIsSubmitting: (loading: boolean) => void;
    setProcessingDclrId: (dclrId: string | null) => void;
    clearAction: () => void;
}

export const useModeStore = create<ManualState>((set) => ({
    currentMode: 'AUTO',
    isSubmitting: false,
    processingDclrId: null,

    setMode: (mode) => set({currentMode: mode}),
    setProcessingDclrId: (dclrId) => set({ processingDclrId: dclrId }),
    setIsSubmitting: (loading) => set({isSubmitting: loading}),
    clearAction: () => set({isSubmitting: false}),
}));

