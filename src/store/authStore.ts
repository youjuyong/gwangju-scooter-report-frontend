import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string|null) => void;
  role: string | null;
  setRole: (role: string|null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ accessToken: null }),
      role: null,
      setRole: (role) => set({ role: role }),
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);