import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 1. 타입 정의
export type MemberRole = 'ADMIN' | 'OPERATOR' | 'PM_CORP' | 'TOW_CORP' | 'REPORT_USER';

interface UserInfo {
    name: string | null;
    id: string | null;
    role: MemberRole | null;
}

interface AuthGroup {
    accessToken: string | null;
    userInfo: UserInfo | null;
    fcmToken: string | null;
}

interface AuthState {
    // 상태 데이터
    admin: AuthGroup;    // 시스템 총괄 관리자 & 운영자
    pm: AuthGroup;       // PM 업체
    tow: AuthGroup;      // 견인 업체
    reporter: AuthGroup; // 일반 신고자

    // 액션 (저장)
    setAdminAuth: (token: string, userInfo: UserInfo, fcm?: string) => void;
    setPmAuth: (token: string, userInfo: UserInfo, fcm?: string) => void;
    setTowAuth: (token: string, userInfo: UserInfo, fcm?: string) => void;
    setReporterAuth: (token: string, userInfo: UserInfo, fcm?: string) => void;

    updateFcmToken: (type: 'admin' | 'pm' | 'tow' | 'reporter', token: string | null) => void;

    // 공통 로그아웃 (특정 그룹만 초기화)
    logout: (type: 'admin' | 'pm' | 'tow' | 'reporter') => void;
}

// 2. 스토어 생성
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // 초기 상태
            admin: { accessToken: null, userInfo: null, fcmToken: null },
            pm: { accessToken: null, userInfo: null, fcmToken: null },
            tow: { accessToken: null, userInfo: null, fcmToken: null },
            reporter: { accessToken: null, userInfo: null, fcmToken: null },

            // 액션 구현
            setAdminAuth: (token, userInfo, fcm) =>
                set((state) => ({ admin: { ...state.admin, accessToken: token, userInfo, fcmToken: fcm ?? null } })),

            setPmAuth: (token, userInfo, fcm) =>
                set((state) => ({ pm: { ...state.pm, accessToken: token, userInfo, fcmToken: fcm ?? null } })),

            setTowAuth: (token, userInfo, fcm) =>
                set((state) => ({ tow: { ...state.tow, accessToken: token, userInfo, fcmToken: fcm ?? null } })),

            setReporterAuth: (token, userInfo, fcm) =>
                set((state) => ({ reporter: { ...state.reporter, accessToken: token, userInfo, fcmToken: fcm ?? null } })),


            updateFcmToken: (type, token) =>
                set((state) => ({
                    [type]: {
                        ...state[type],
                        fcmToken: token,
                    },
                })),

            // 로그아웃
            logout: (type) =>
                set((state) => ({
                    [type]: { accessToken: null, userInfo: null, fcmToken: null },
                })),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);