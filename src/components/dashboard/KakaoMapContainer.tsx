"use client";

import React, { memo, useMemo, useRef, useEffect } from "react"; //  useRef, useEffect 추가
import { Circle, CustomOverlayMap, Map } from "react-kakao-maps-sdk";
import { CityOutline } from "@/components/dashboard/CityOutline";

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

const KakaoMapSection = memo(({ reports, outlinePath, center, onMarkerClick, bachList = [], activeDclrId }: any) => {
    //  1. 실제 카카오 지도 인스턴스를 핸들링할 Ref 생성
    const mapRef = useRef<kakao.maps.Map>(null);

    const optimizedPath = useMemo(() => {
        if (!outlinePath || outlinePath.length === 0) return [];
        return outlinePath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlinePath]);

    //  2. 부모로부터 새로운 center 좌표가 내려오면 지도를 그 위치로 부드럽게 이동
    useEffect(() => {
        if (mapRef.current && center) {
            // 부드러운 스크롤 이동을 원하면 panTo, 즉시 이동을 원하면 setCenter를 사용하세요.
            mapRef.current.panTo(new kakao.maps.LatLng(center.lat, center.lng));
        }
    }, [center]); // 👈 center 값이 변경될 때마다 실행됩니다.

    return (
        <Map
            ref={mapRef} //  3. 여기에 ref를 바인딩해 주어야 카카오 지도 객체에 접근할 수 있습니다.
            center={center}
            style={{ width: "100%", height: "100%" }}
            level={3}
        >
            {reports.map((report: any) => (
                report.latVl && report.lotVl && (
                    <React.Fragment key={report.dclrId}>
                        <CustomOverlayMap
                            position={{ lat: report.latVl, lng: report.lotVl }}
                            clickable={true}
                        >
                            <div
                                className={`my-custom-marker ${activeDclrId === report.dclrId ? "click" : ""}`}
                                onClick={() => onMarkerClick(report.dclrId)}
                                style={{ cursor: "pointer" }}
                            >
                                <img
                                    src={MARKER_CONFIG.images[report.dclrStts?.cdId] || "/assets/style_pm/images/mark.png"}
                                    alt="marker"
                                    style={{ width: "25px", height: "36px" }}
                                />
                            </div>
                        </CustomOverlayMap>
                    </React.Fragment>
                )
            ))}
            {outlinePath.length > 0 && (
                <CityOutline path={optimizedPath} />
            )}

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