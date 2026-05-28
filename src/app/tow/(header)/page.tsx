"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import {getMyBachList, getPmDclrListApi} from "@/services/report/reportApi";
import { getOutlineType } from "@/services/common/commonApi";
import Cookies from "js-cookie";
import KakaoMapSection from "@/components/dashboard/KakaoMapContainer";
import {getTowDclrListApi} from "@/services/report/reportApi_tow";
const pmtoken = Cookies.get("pmAccessToken");

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();

    const [reports, setReports] = useState([]);
    const [outlinePath, setOutlinePath] = useState([]);

    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY!,
        libraries: ["services"],
    });
    const prefix = useMemo(() => (pathname.startsWith("/pm") ? "/pm" : "/tow"), [pathname]);
    const [activeDclrId, setActiveDclrId] = useState<string | null>(null);

    const [center] = useState(() => {
        if (typeof window !== "undefined") {
            const savedLocation = sessionStorage.getItem("selected_kickboard_loc");
            if (savedLocation) {
                const parsed = JSON.parse(savedLocation);
                // 컴포넌트 생성 시점에 dclrId가 있으면 상태의 초기값으로 심어주기 위해 세션에서 잠시 유지하거나,
                // 아래 useEffect에서 바로 꺼내 쓰도록 유도합니다.
                return { lat: parsed.lat, lng: parsed.lng };
            }
        }
        return { lat: 37.429, lng: 127.255 };
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedLocation = sessionStorage.getItem("selected_kickboard_loc");
            if (savedLocation) {
                const parsed = JSON.parse(savedLocation);
                if (parsed.dclrId) {
                    setActiveDclrId(parsed.dclrId); // 선택된 마커 ID 마킹
                }
                sessionStorage.removeItem("selected_kickboard_loc"); // 사용 후 클리어
            }
        }
    }, []);
    const [bachList, setBachList] = useState<any[]>([]);

    useEffect(() => {
        const initData = async () => {
            try {
                const [reportRes, outlineRes]:any = await Promise.all([
                    getTowDclrListApi({ searchMonth: "", searchDate: "", prcsUserId: "", dclrSttsCd: "" ,isMap :"Y"},pmtoken),
                    getOutlineType()
                ]);
                if (reportRes) setReports(reportRes);

                if (outlineRes && Array.isArray(outlineRes)) {
                    const formattedPath:any = outlineRes
                        .sort((a: any, b: any) => a.ord - b.ord)
                        .map((item: any) => ({
                            lat: Number(item.ycrdn),
                            lng: Number(item.xcrdn)
                        }));
                    setOutlinePath(formattedPath);
                }
            } catch (err) {
                console.error("초기 데이터 로드 실패:", err);
            }
        };

        if (!loading) initData();
    }, [loading]);

    // useEffect(() => {
    //     const getMyCompanyBach = async () => {
    //         try {
    //             const res = await getMyBachList();
    //             if (res && res.success && Array.isArray(res.data)) {
    //                 setBachList(res.data);
    //             }
    //
    //         } catch (e) {
    //             console.error('Error : ', e);
    //         }
    //     };
    //     getMyCompanyBach();
    // }, []);

    const handleMarkerClick = useCallback((id: string) => {
        router.push(`${prefix}/reportDetail/${id}`);
    }, [prefix, router]);

    // 레전드 카운트 최적화
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
                {/*<div className="item lezone">*/}
                {/*    <span className="label">배치존</span>*/}
                {/*</div>*/}
            </div>

            <div className="mainmap">
                {!loading && (
                    <KakaoMapSection
                        reports={reports}
                        outlinePath={outlinePath}
                        center={center}
                        onMarkerClick={handleMarkerClick}
                        bachList={bachList}
                        activeDclrId={activeDclrId}
                    />
                )}
            </div>
        </>
    );
}