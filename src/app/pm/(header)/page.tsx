"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {Map, CustomOverlayMap, useKakaoLoader, MapMarker, Polygon} from "react-kakao-maps-sdk";
import {getPmDclrListApi} from "@/services/report/reportApi";
import {pmDcleReportRequestForm, pmDcleReportResponse} from "@/types/report";
import {getOutlineType} from "@/services/common/commonApi";

export default function MainHome() {
    const router = useRouter();
    const pathname = usePathname();

    // 1. 상태 관리
    const [reports, setReports] = useState<pmDcleReportResponse[]>([]);
    const [mapLoading, setMapLoading] = useState(true);

    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY!,
        libraries: ["services"],
    });
    const [outlinePath, setOutlinePath] = useState<{ lat: number; lng: number }[]>([]);

    // 1. 상태 코드에 따른 마커 이미지 매핑 (데이터의 dclrStts.cdId 기준)
    const markerImages: { [key: string]: string } = {
        "DEST02": "/images/le_red.png",   // 접수 (예시)
        "DEST03": "/images/le_blue.png",  // 회수요청 (데이터에 있는 값)
        "DEST04": "/images/le_gray.png",  // 완료 (예시)
    };
    const Token = useAuthStore((state) => state.pm);

    // URL Prefix 추출
    const prefix = pathname.startsWith("/pm") ? "/pm" : pathname.startsWith("/tow") ? "/tow" : "";

    // 지도 중심 좌표 상태
    const [center, setCenter] = useState({ lat: 37.429, lng: 127.255 }); // 광주시청 근처 예시 좌표
// 3. 데이터 패칭 로직
    const fetchReports = async () => {
        try {
            // 필터링 값이 없다면 전체 조회 혹은 기본값 설정
            const requestParams: pmDcleReportRequestForm = {
                searchMonth: "", // 필요 시 추가
                searchDate: "" ,
                prcsUserId: "",
                dclrSttsCd: ""
            };
            const response = await getPmDclrListApi(requestParams);
            setReports(response || [] );
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        }
    };
    useEffect(() => {
        const fetchOutline = async () => {
            try {
                const ousLine = await getOutlineType();
                if (ousLine && Array.isArray(ousLine)) {
                    // [개선 2] ord(순서) 기준 정렬 및 데이터 변환
                    const formattedPath = ousLine
                        .sort((a: any, b: any) => a.ord - b.ord)
                        .map((item: any) => ({
                            lat: Number(item.ycrdn),
                            lng: Number(item.xcrdn)
                        }));
                    setOutlinePath(formattedPath);
                }
            } catch (error) {
                console.error("외곽선 로드 실패:", error);
            }
        };

        fetchOutline();
    }, []); // 빈 배열이므로 최초 1회만 실행됨

    useEffect(() => {
        fetchReports();

    }, []);

    const companyLogos: { [key: string]: string } = {
        "빔(BEAM)": "/images/logo_beam.png",
        "스윙(SWING)": "/images/simbol.png",
        "카카오 T 바이크": "/images/logo_dear.png",
        // ... 추가 업체들
    };
    if (error) return <div>지도 로딩 에러</div>;

    return (
        <>
            <button className="btn_result" onClick={() => router.push(`${prefix}/report`)}>
                회수등록
            </button>

            <div className="legend">
                <div className="item red">
                    {/* 상태 코드별 카운팅 */}
                    <span className="badge">{reports.filter(r => r.dclrStts?.cdId === "DEST02").length}</span>
                    <span className="label">미배정</span>
                </div>
                <div className="item blue">
                    <span className="badge">{reports.filter(r => r.dclrStts?.cdId === "DEST03").length}</span>
                    <span className="label">처리중</span>
                </div>
                <div className="item gray">
                    <span className="badge">{reports.filter(r => r.dclrStts?.cdId === "DEST04").length}</span>
                    <span className="label">완료</span>
                </div>
            </div>

            {/* 지도 영역 */}
            <div className="mainmap">
                {!loading && (
                    <Map center={center} style={{width: "100%", height: "100%"}} level={3}>
                        {outlinePath.length > 0 && (
                            <Polygon
                                path={outlinePath} // 위에서 변환한 좌표 배열
                                strokeWeight={3}
                                strokeColor={"#2524FF"}
                                strokeOpacity={0.9}
                                strokeStyle={"shortdash"}
                                fillColor={"#B3B1B1"}
                                fillOpacity={0.2}
                                zIndex={1}
                            />
                        )}
                        {/* 4. 데이터 기반 마커 렌더링 */}
                        {reports.map((report) => (
                            report.latVl && report.lotVl && (
                                <React.Fragment key={report.dclrId}>
                                    {/* 1. 상태를 나타내는 기본 마커 (Red, Blue, Gray) */}
                                    <MapMarker
                                        position={{ lat: report.latVl, lng: report.lotVl }}
                                        image={{
                                            src: markerImages[report.dclrStts?.cdId] || "/images/mark.png",
                                            size: { width: 39, height: 44 },
                                        }}
                                        onClick={() => router.push(`${prefix}/reportDetail/${report.dclrId}`)}
                                    />

                                    {/* 2. 마커 위에 겹쳐서 보여줄 회사 로고 오버레이 */}
                                    <CustomOverlayMap
                                        position={{ lat: report.latVl, lng: report.lotVl }}
                                        yAnchor={1.32} // 마커보다 약간 위로 올리기 위해 조정 (숫자가 클수록 위로 감)
                                    >
                                        <div
                                            onClick={() => router.push(`${prefix}/reportDetail/${report.dclrId}`)}
                                            style={{
                                            width: "29px",
                                            height: "29px",
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            border: "2px solid white",
                                            backgroundColor: "white",
                                            boxShadow: "0 2px 2px rgba(0,0,0,0.2)"
                                        }}>
                                            <img
                                                src={companyLogos[report.bzenty.bzentyNm] || "/images/mark.png"}
                                                alt="logo"
                                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                            />
                                        </div>
                                    </CustomOverlayMap>
                                </React.Fragment>
                            )
                        ))}

                        {/* 현재 시청 위치 표시 오버레이 */}
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