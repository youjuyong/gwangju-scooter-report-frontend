"use client";

import React, {memo, useMemo} from "react";
import {Circle, CustomOverlayMap, Map, MapMarker} from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";

const MARKER_CONFIG = {
    images: {
        "DEST02": "/assets/style_pm/images/icon_red.png",
        "DEST03": "/assets/style_pm/images/icon_blue.png",
        "DEST04": "/assets/style_pm/images/icon_gray.png",

        "DEST07": "/assets/style_pm/images/icon_red.png",
        "DEST08": "/assets/style_pm/images/icon_blue.png",
        "DEST09": "/assets/style_pm/images/icon_gray.png",

    } as Record<string, string>,
    logos: {
        "빔(BEAM)": "/assets/style_pm/images/logo_beam.png",
        "스윙(SWING)": "/assets/style_pm/images/simbol.png",
        "카카오 T 바이크": "/assets/style_pm/images/logo_dear.png",
    } as Record<string, string>
};

const KakaoMapSection = memo(({reports, outlinePath, center, onMarkerClick, bachList = [], activeDclrId}: any) => {
    const optimizedPath = useMemo(() => {
        if (!outlinePath || outlinePath.length === 0) return [];
        return outlinePath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlinePath]);

    return (
        <Map center={center} style={{width: "100%", height: "100%"}} level={3}>
            {reports.map((report: any) => (
                report.latVl && report.lotVl && (
                    <React.Fragment key={report.dclrId}>
                        <CustomOverlayMap
                            position={{ lat: report.latVl, lng: report.lotVl }}
                            clickable={true} // 클릭 이벤트 활성화
                        >
                            <div
                                className={`my-custom-marker ${activeDclrId === report.dclrId ? "click" : ""}`}                                onClick={() => onMarkerClick(report.dclrId)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* 마커 이미지 배치 */}
                                <img
                                    src={MARKER_CONFIG.images[report.dclrStts?.cdId] || "/assets/style_pm/images/mark.png"}
                                    alt="marker"
                                    style={{ width: "25px", height: "36px" }}
                                />

                                {/* 필요하다면 마커 밑에 텍스트나 뱃지 같은 것도 CSS로 마음대로 추가 가능! */}
                            </div>
                        </CustomOverlayMap>
                    </React.Fragment>
                )
            ))}
            {outlinePath.length > 0 && (
                <CityOutline path={optimizedPath}/>
            )}
            {/* 3. 중심점 표시 */}
            {bachList.map((item: any) => {
                const centerLatLng = {
                    lat: Number(item.lat),
                    lng: Number(item.lot),
                };

                return (
                    <React.Fragment key={item.btchZoneId}>
                        <Circle
                            center={centerLatLng}
                            radius={25}
                            strokeWeight={1}
                            strokeColor={"rgba(255, 0, 255, 0.4)"}
                            strokeOpacity={0.8}
                            strokeStyle={"solid"}
                            fillColor={"rgba(255, 0, 255, 0.2)"}
                            fillOpacity={0.5}
                        />

                        <Circle
                            center={centerLatLng}
                            radius={1}
                            strokeWeight={1}
                            strokeColor={"#ff00dc"}
                            strokeOpacity={0.1}
                            fillColor={"#ff00dc"}
                            fillOpacity={1}
                        />
                    </React.Fragment>
                );
            })}
        </Map>
    );
});

KakaoMapSection.displayName = "KakaoMapSection";
export default KakaoMapSection;