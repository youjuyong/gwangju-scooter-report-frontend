import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    fcmToken: string | null;
    setAccessToken: (token: string | null) => void;
    setFcmToken: (token: string | null) => void;
    role: string | null;
    userName: string | null;
    userId: string | null;
    setRole: (role: string | null) => void;
    setUserInfo: (name: string | null, id: string | null) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            role: null,
            userName: null,
            userId: null,
            fcmToken: null,
            setAccessToken: (token) => set({accessToken: token}),
            setFcmToken: (token) => set({fcmToken: token}),
            setRole: (role) => set({role: role}),
            setUserInfo: (name, id) => set({userName: name, userId: id}),
            clearAuth: () => set({
                accessToken: null,
                role: null,
                userName: null,
                userId: null,
                fcmToken :null
            }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);