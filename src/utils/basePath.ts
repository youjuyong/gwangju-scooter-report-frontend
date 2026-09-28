// next.config.ts의 basePath와 동일한 값 (예: "/pm"). 비어 있으면 루트 배포.
// Link/router/next 내부 요청은 basePath를 자동으로 붙이지만,
// <img src>, <a href>, window.location, 서비스워커, metadata(manifest/icons)는 직접 붙여야 한다.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// "/assets/..." → "/pm/assets/..."
export const withBase = (path: string) => `${BASE_PATH}${path}`;

// window.location.pathname("/pm/admin/...") → "/admin/..." (usePathname()과 같은 형태로 맞춤)
export const stripBase = (pathname: string) => {
    if (!BASE_PATH) return pathname;
    if (pathname === BASE_PATH) return "/";
    return pathname.startsWith(`${BASE_PATH}/`) ? pathname.slice(BASE_PATH.length) : pathname;
};
