import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    // 1. 관리자/업체 권한 체크 (admin, pm, tow)
    const corporateRoles = ['admin', 'pm', 'tow'];

    if (corporateRoles.includes(firstSegment)) {
        if (pathname.endsWith('/login')) {
            return NextResponse.next();
        }
        const token = request.cookies.get(`${firstSegment}AccessToken`)?.value;
        if (!token) {
            return NextResponse.redirect(new URL(`/${firstSegment}/login`, request.url));
        }
        return NextResponse.next();
    }

    // 2. 일반 시민(Reporter) 보호 경로 체크
    // 로그인이 반드시 필요한 시민용 페이지 리스트
    const reporterProtectedPaths = ['/set', '/reportList', '/alarm','/report'];

    // 현재 경로가 보호 목록에 포함되는지 확인
    const isReporterProtected = reporterProtectedPaths.some(path => pathname.startsWith(path));

    if (isReporterProtected) {
        const token = request.cookies.get('reporterAccessToken')?.value;

        if (!token) {
            // 시민은 /login 페이지가 루트에 있으므로 /login으로 보냄
            const loginUrl = new URL('/', request.url);
            // 로그인 후 다시 돌아오게 하고 싶다면 쿼리 추가
            // loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// 매처 설정: 검사할 모든 경로 패턴 등록
export const config = {
    matcher: [
        '/admin/:path*',
        '/pm/:path*',
        '/tow/:path*',
        '/set/:path*',      // 시민 설정 페이지
        '/reportList/:path*', // 시민 신고확인 페이지
        '/alarm/:path*'     // 시민 알림 페이지
    ],
}