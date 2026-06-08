import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

 export default function middleware(request: NextRequest) {
     const requestHeaders = new Headers(request.headers);
     requestHeaders.set('x-current-path', request.nextUrl.pathname);
    const { pathname } = request.nextUrl;
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    // 1. 관리자/업체 권한 체크 (admin, pm, tow)
    const corporateRoles = ['admin', 'pm', 'tow'];

    if (corporateRoles.includes(firstSegment)) {
        //운영단말 로그인 개발후 삭제
        // if (process.env.NODE_ENV === 'development' && firstSegment === 'admin') {
        //     return NextResponse.next({
        //         request: {
        //             headers: requestHeaders,
        //         },
        //     });
        // }
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

        if (!token || token === "null" || token === "undefined") {
            // 시민은 /login 페이지가 루트에 있으므로 /login으로 보냄
            const loginUrl = new URL('/', request.url);
            // 로그인 후 다시 돌아오게 하고 싶다면 쿼리 추가
            // loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

     return NextResponse.next({
         request: {
             headers: requestHeaders,
         },
     });
}

// 매처 설정: 검사할 모든 경로 패턴 등록
export const config = {
    matcher: [
        '/admin/:path*',
        '/pm/:path*',
        '/tow/:path*',
        '/set',          // 하위 경로 없는 버전 추가
        '/set/:path*',
        '/reportList',   // ◀ http://localhost:3000/reportList를 잡으려면 이게 있어야 합니다!
        '/reportList/:path*',
        '/alarm',        // 하위 경로 없는 버전 추가
        '/alarm/:path*',
        '/report',       // ◀ 코드 본문에 /report도 있으니 이것도 추가
        '/report/:path*'
    ],
}