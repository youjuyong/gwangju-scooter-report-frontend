"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Map, CustomOverlayMap, useKakaoLoader } from "react-kakao-maps-sdk";

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();
    const Token = useAuthStore((state) => state.pm);

    // 1. 카카오 지도 스크립트 로드 (ReportLocation과 동일한 방식)
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY!,
        libraries: ["services"],
    });

    // URL Prefix 추출
    const prefix = pathname.startsWith("/pm") ? "/pm" : pathname.startsWith("/admin") ? "/admin" : "";

    // 지도 중심 좌표 상태
    const [center, setCenter] = useState({ lat: 37.429, lng: 127.255 }); // 광주시청 근처 예시 좌표

    if (error) return <div>지도 로딩 에러</div>;

    return (
        <>
            <button className="btn_result" onClick={() => router.push(`${prefix}/register`)}>
                회수등록
            </button>

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
            <div className="mainmap" >
                {/* 2. 로딩이 완료된 후 Map 컴포넌트 렌더링 */}
                {!loading && (
                    <Map
                        center={center}
                        style={{ width: "100%", height: "100%" }}
                        level={3}
                    >
                        {/* 3. 커스텀 오버레이 (HTML 시안의 .zone 디자인 적용) */}
                        <CustomOverlayMap position={center}>
                            <div className="zone">
                                <span className="spot"></span>
                                <span className="round"></span>
                            </div>
                        </CustomOverlayMap>
                    </Map>
                )}
            </div>
        </>
    );
}