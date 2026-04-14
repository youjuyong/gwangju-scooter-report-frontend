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
      role: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setRole: (role) => set({ role: role }),
      clearAuth: () => set({ accessToken: null, role: null }),
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);