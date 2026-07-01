"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {useKakaoLoader} from "react-kakao-maps-sdk";
import {getMyBachList, getPmDclrListApi} from "@/services/report/reportApi";
import {getOutlineType} from "@/services/common/commonApi";
import Cookies from "js-cookie";
import { registerMenuLog } from "@/services/common/commonApi";
import KakaoMapSection from "@/components/dashboard/KakaoMapContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSseStore } from "@/store/sseStore";

const pmtoken = Cookies.get("pmAccessToken");

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    // 1. 전역 스토어에서 실시간 알림 트리거 감지
    const sseTrigger = useSseStore((state) => state.sseTrigger);

    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [activeDclrId, setActiveDclrId] = useState<string | null>(null);

    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY!,
        libraries: ["services"],
    });

    const prefix = useMemo(() => (pathname.startsWith("/pm") ? "/pm" : "/tow"), [pathname]);

    // 2. 지도 중심점 관리 (사용자의 시야를 유지하기 위해 state로 유지)
    const [center, setCenter] = useState(() => {
        if (typeof window !== "undefined") {
            const savedLocation = sessionStorage.getItem("selected_kickboard_loc");
            if (savedLocation) {
                const parsed = JSON.parse(savedLocation);
                return {lat: parsed.lat, lng: parsed.lng};
            }
        }
        return {lat: 37.429, lng: 127.255};
    });

    // 3. [실시간 갱신 대상] 마커 리스트 API - React Query 연동
    const { data: reports = [] } = useQuery({
        queryKey: ["mapReportList"],
        queryFn: () => getPmDclrListApi({
            searchMonth: "",
            searchDate: "",
            prcsUserId: "",
            dclrSttsCd: "",
            isMap: "Y"
        }, pmtoken).then(res => res || []),
        enabled: !loading && !!pmtoken,
    });

    // 4. [고정 대상] 외곽선 데이터 - 한 번 가져오면 그대로 유지
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

    // 5. [고정 대상] 배치존 데이터 - 한 번 가져오면 그대로 유지
    const { data: bachList = [] } = useQuery({
        queryKey: ["mapBachList"],
        queryFn: async () => {
            try {
                const res = await getMyBachList();
                if (res && res.success && Array.isArray(res.data)) {
                    return res.data;
                }
            } catch (e) {
                console.error('Error : ', e);
            }
            return [];
        },
        enabled: !loading
    });

    // ⭐ 6. SSE 이벤트 수신 시 '마커 리스트만' 콕 집어서 새로고침
    useEffect(() => {
        if (sseTrigger > 0) {
            console.log("[실시간 감지] 지도 중심점(Center)을 유지한 상태로 마커 정보만 최신화합니다.");

            // exact: true 옵션으로 다른 캐시(외곽선, 배치존)는 건드리지 않고 마커만 저격 청소합니다.
            queryClient.invalidateQueries({
                queryKey: ["mapReportList"],
                exact: true
            });
        }
    }, [sseTrigger, queryClient]);

    // 내 위치 GPS 탐색 함수
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

    // 초기 마운트 및 페이지 이동 후 복귀 로직 처리
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
            // 다른 메뉴에서 선택하고 넘어온 목적지가 없을 때만 내 위치로 기본 포커싱
            moveToCurrentPosition();
        }

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("PMS1000");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, [moveToCurrentPosition]);

    const handleMarkerClick = useCallback((id: string) => {
        router.push(`${prefix}/reportDetail/${id}`);
    }, [prefix, router]);

    // 상단 범례용 카운트 정밀 연산 최적화
    const counts = useMemo(() => ({
        red: reports.filter((r: any) => r.dclrStts?.cdId === "DEST02").length,
        blue: reports.filter((r: any) => r.dclrStts?.cdId === "DEST03").length,
        gray: reports.filter((r: any) => r.dclrStts?.cdId === "DEST04").length,
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
                    <span className="badge">{counts.red}</span><span className="label">미배정</span>
                </div>
                <div className="item blue">
                    <span className="badge">{counts.blue}</span><span className="label">처리중</span>
                </div>
                <div className="item gray">
                    <span className="badge">{counts.gray}</span><span className="label">완료</span>
                </div>
                <div className="item lezone">
                    <span className="label">배치존</span>
                </div>
            </div>

            <div className="mainmap">
                {!loading && (
                    <KakaoMapSection
                        reports={reports}
                        outlinePath={outlinePath}
                        center={center} // 사용자가 보고 있던 시야 그대로 전달
                        onMarkerClick={handleMarkerClick}
                        bachList={bachList}
                        activeDclrId={activeDclrId}
                    />
                )}
            </div>
        </>
    );
}