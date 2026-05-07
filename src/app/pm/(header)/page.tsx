"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);

    // URL Prefix 추출 (/pm 또는 /admin)
    const prefix = pathname.startsWith("/pm") ? "/pm" : pathname.startsWith("/admin") ? "/admin" : "";
    const logout = useAuthStore((state) => state.clearAuth);

    // 1. 카카오 지도 초기화
    useEffect(() => {
        if (typeof window !== "undefined" && window.kakao && mapRef.current) {
            const options = {
                center: new window.kakao.maps.LatLng(36.191, 127.112), // 초기 좌표 (광주시 등 설정)
                level: 3,
            };
            const kakaoMap = new window.kakao.maps.Map(mapRef.current, options);
            setMap(kakaoMap);

            // 샘플 마커 (Zone 표시 예시)
            const markerPosition = new window.kakao.maps.LatLng(36.191, 127.112);

            // 커스텀 오버레이로 HTML 구조 삽입 (HTML의 .zone 부분)
            const content = `
        <div class="zone">
          <span class="spot"></span>
          <span class="round"></span>
        </div>
      `;

            const customOverlay = new window.kakao.maps.CustomOverlay({
                position: markerPosition,
                content: content,
            });
            customOverlay.setMap(kakaoMap);
        }
    }, []);


    return (
        <div className="wrap">


            <main className="main_article">
                {/* 회수 등록 페이지로 이동 */}
                <button className="btn_result" onClick={() => router.push(`${prefix}/register`)}>
                    회수등록
                </button>

                {/* 상태별 현황판 */}
                <div className="legend">
                    <div className="item red">
                        <span className="badge">20</span>
                        <span className="label">미배정</span>
                    </div>
                    <div className="item blue">
                        <span className="badge">7</span>
                        <span className="label">처리중</span>
                    </div>
                    <div className="item gray">
                        <span className="badge">10</span>
                        <span className="label">완료</span>
                    </div>
                </div>

                {/* 지도 영역 */}
                <div className="mainmap">
                    <div ref={mapRef} style={{ width: "100%", height: "100%" }}>
                        {/* 카카오 지도가 렌더링됩니다 */}
                    </div>
                </div>
            </main>
        </div>
    );
}