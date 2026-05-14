"use client";

import React, { memo, useMemo} from "react";
import { Map, MapMarker, CustomOverlayMap, Polygon } from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";
const MARKER_CONFIG = {
    images: {
        "DEST02": "/images/le_red.png",
        "DEST03": "/images/le_blue.png",
        "DEST04": "/images/le_gray.png",
    } as Record<string, string>,
    logos: {
        "빔(BEAM)": "/images/logo_beam.png",
        "스윙(SWING)": "/images/simbol.png",
        "카카오 T 바이크": "/images/logo_dear.png",
    } as Record<string, string>
};

const KakaoMapSection = memo(({ reports, outlinePath, center, onMarkerClick }: any) => {

    const optimizedPath = useMemo(() => {
        if (!outlinePath || outlinePath.length === 0) return [];
        return outlinePath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlinePath]);
   
    return (
        <Map center={center} style={{ width: "100%", height: "100%" }} level={3}>
            {reports.map((report: any) => (
                report.latVl && report.lotVl && (
                    <React.Fragment key={report.dclrId}>
                        <MapMarker
                            position={{ lat: report.latVl, lng: report.lotVl }}
                            image={{
                                src: MARKER_CONFIG.images[report.dclrStts?.cdId] || "/images/mark.png",
                                size: { width: 39, height: 44 },
                            }}
                            onClick={() => onMarkerClick(report.dclrId)}
                        />
                        <CustomOverlayMap position={{ lat: report.latVl, lng: report.lotVl }} yAnchor={1.32}>
                            <div 
                                onClick={() => onMarkerClick(report.dclrId)} 
                                style={{ width: "29px", height: "29px", borderRadius: "50%", overflow: "hidden", border: "2px solid white", backgroundColor: "white", boxShadow: "0 2px 2px rgba(0,0,0,0.2)", cursor: "pointer" }}
                            >
                                <img
                                    src={MARKER_CONFIG.logos[report.bzenty.bzentyNm] || "/images/mark.png"}
                                    alt="logo"
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                            </div>
                        </CustomOverlayMap>
                    </React.Fragment>
                )
            ))}
            {outlinePath.length > 0 && (
               <CityOutline path={optimizedPath}/>
            )}
            {/* 3. 중심점 표시 */}
            <CustomOverlayMap position={center}>
                <div className="zone"><span className="spot"></span><span className="round"></span></div>
            </CustomOverlayMap>
        </Map>
    );
});

KakaoMapSection.displayName = "KakaoMapSection";
export default KakaoMapSection;