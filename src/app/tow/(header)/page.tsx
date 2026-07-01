"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import {  getOutlineType } from "@/services/common/commonApi";
import Cookies from "js-cookie";
import KakaoMapSection from "@/components/dashboard/KakaoMapContainer";
import { getTowDclrListApi } from "@/services/report/reportApi_tow";
import { registerMenuLog } from "@/services/common/commonApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSseStore } from "@/store/sseStore";

const pmtoken = Cookies.get("pmAccessToken");

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    // 1. 전역 스토어에서 실시간 알림 트리거 감지 (Zustand)
    const sseTrigger = useSseStore((state) => state.sseTrigger);

    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [activeDclrId, setActiveDclrId] = useState<string | null>(null);

    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY!,
        libraries: ["services"],
    });

    const prefix = useMemo(() => (pathname.startsWith("/pm") ? "/pm" : "/tow"), [pathname]);

    // 2. 지도 중심점 관리 (기사님의 시야 위치를 브라우저 메모리에 고정)
    const [center, setCenter] = useState(() => {
        if (typeof window !== "undefined") {
            const savedLocation = sessionStorage.getItem("selected_kickboard_loc");
            if (savedLocation) {
                const parsed = JSON.parse(savedLocation);
                return { lat: parsed.lat, lng: parsed.lng };
            }
        }
        return { lat: 37.429, lng: 127.255 };
    });

    // 3. [실시간 갱신 대상] 견인 마커 리스트 - React Query 연동
    const { data: reports = [] } = useQuery({
        queryKey: ["towMapReportList"], // 🚛 견인 전용 키 명명
        queryFn: () => getTowDclrListApi({
            searchMonth: "",
            searchDate: "",
            prcsUserId: "",
            dclrSttsCd: "",
            isMap: "Y"
        }, pmtoken).then(res => res || []),
        enabled: !loading && !!pmtoken,
    });

    // 4. [고정 대상] 외곽선 데이터 - 변하지 않으므로 무효화 대상에서 제외
    const { data: outlinePath = [] } = useQuery({
        queryKey: ["mapOutlinePath"],
        queryFn: async () => {
            const outlineRes = await getOutlineType();
            if (outlineRes && Array.isArray(outlineRes)) {
                return outlineRes
                    .sort((a: any, b: any) => a.ord - b.ord)
                    .map((item: any) => ({
                        lat: Number(item.ycrdn),
                        lng: Number(item.xcrdn)
                    }));
            }
            return [];
        },
        enabled: !loading
    });

    // 5. [고정 대상] 배치존 데이터 - 견인 화면에서는 빈 배열 상태 유지만 처리
    const [bachList] = useState<any[]>([]);

    // ⭐ 6. [핵심] SSE 실시간 이벤트 발생 시 견인 마커만 '콕' 집어서 새로고침
    useEffect(() => {
        if (sseTrigger > 0) {
            console.log("[실시간 감지] 기사님 지도 시야(Center)를 유지하며 견인 요청 마커만 갱신합니다.");

            // exact: true 옵션으로 오직 ["towMapReportList"] 캐시만 비워 새로고침합니다.
            queryClient.invalidateQueries({
                queryKey: ["towMapReportList"],
                exact: true
            });
        }
    }, [sseTrigger, queryClient]);

    // 내 위치 GPS 탐색 함수 (정밀도 유지)
    const moveToCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            alert("이 브라우저에서는 GPS 기능을 지원하지 않습니다.");
            return;
        }

        setIsGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCenter({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                setIsGpsLoading(false);
            },
            (err) => {
                console.warn("GPS 획득 실패:", err);
                alert("현재 위치를 가져오지 못했습니다. 위치 권한을 확인해 주세요.");
                setIsGpsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    }, []);

    // 페이지 진입 초기화 및 메뉴 로그 적재
    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedLocation = sessionStorage.getItem("selected_kickboard_loc");

        if (savedLocation) {
            const parsed = JSON.parse(savedLocation);
            if (parsed.dclrId) {
                setActiveDclrId(parsed.dclrId);
            }
            sessionStorage.removeItem("selected_kickboard_loc");
        } else {
            moveToCurrentPosition();
        }

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("TOW1000"); // 견인 메인 이력 코드 유지
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, [moveToCurrentPosition]);

    const handleMarkerClick = useCallback((id: string) => {
        router.push(`${prefix}/reportDetail/${id}`);
    }, [prefix, router]);

    // 견인 상태코드(DEST07, 08, 09) 범례 카운트 정밀 연산
    const counts = useMemo(() => ({
        red: reports.filter((r: any) => r.dclrStts?.cdId === "DEST07").length,
        blue: reports.filter((r: any) => r.dclrStts?.cdId === "DEST08").length,
        gray: reports.filter((r: any) => r.dclrStts?.cdId === "DEST09").length,
    }), [reports]);

    if (error) return <div>지도 로딩 에러</div>;

    return (
        <>
            <button className="btn_result" onClick={() => router.push(`${prefix}/report`)}>
                회수등록
            </button>

            <button
                className="me"
                onClick={moveToCurrentPosition}
                disabled={isGpsLoading}
            >
                {isGpsLoading ? "조회중..." : "내위치"}
            </button>

            <div className="legend">
                <div className="item red">
                    <span className="badge">{counts.red}</span><span className="label">요청</span>
                </div>
                <div className="item blue">
                    <span className="badge">{counts.blue}</span><span className="label">처리중</span>
                </div>
                <div className="item gray">
                    <span className="badge">{counts.gray}</span><span className="label">완료</span>
                </div>
            </div>

            <div className="mainmap">
                {!loading && (
                    <KakaoMapSection
                        reports={reports}
                        outlinePath={outlinePath}
                        center={center} // 실시간 페칭 중에도 기사님이 보던 위치 고정 주입
                        onMarkerClick={handleMarkerClick}
                        bachList={bachList}
                        activeDclrId={activeDclrId}
                    />
                )}
            </div>
        </>
    );
}