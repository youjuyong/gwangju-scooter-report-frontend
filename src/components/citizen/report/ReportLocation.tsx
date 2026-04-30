"use client";

import {useEffect, useState} from "react";
import {Map, MapMarker, useKakaoLoader} from "react-kakao-maps-sdk";
import "@/css/base_style.css";
import "@/css/style.css";

interface MapProps {
    onSelect: (location: { address: string; lat: number; lng: number, zoneId: string }) => void;
    onBack: () => void;
}

export default function ReportLocation({onSelect, onBack}: MapProps) {
    const [loading, error] = useKakaoLoader({
        appkey: "e0886cf3ac458009e2bf2d9a8dd9dbdd",
        libraries: ["services"],
    });

    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("위치를 선택해 주세요");
    const [zoneId, setZoneId] = useState<string>("");

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            (err) => {
                console.warn("GPS 권한 거부 또는 오류가 발생했습니다.");
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const {kakao} = window;
        if (loading || !kakao || !kakao.maps || !position) return;

        kakao.maps.load(() => {
            if (!kakao.maps.services) return;

            const geocoder = new kakao.maps.services.Geocoder();

            geocoder.coord2Address(position.lng, position.lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const addr = result[0].road_address
                        ? result[0].road_address.address_name
                        : result[0].address.address_name;
                    setAddress(addr);
                } else {
                    setAddress("주소를 찾을 수 없는 지역입니다.");
                }
            });

            geocoder.coord2RegionCode(position.lng, position.lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const zoneInfo = result.find((item: any) => item.region_type === 'B');

                    if (zoneInfo) {
                        setZoneId(zoneInfo.code);
                    }
                }
            });

        });
    }, [position, loading]);

    const handleLocationSubmit = () => {
        if (!position || address === "위치를 선택해 주세요" || !zoneId) {
            alert("정확한 위치를 선택해 주세요.");
            return;
        }
        onSelect({
            address: address,
            lat: position.lat,
            lng: position.lng,
            zoneId: zoneId,
        });
    };

    if (error) return <div className="loading_box">지도 로드 중 에러가 발생했습니다.</div>;
    if (loading) return <div className="loading_box">지도를 불러오는 중...</div>;

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>위치 확인</h1>
                <button type="button" className="back" onClick={onBack}>뒤로 가기</button>
            </header>

            <main className="sub_article">
                <div className="min">
                    <div className="mapbox" style={{position: 'relative'}}>
                        {typeof window !== "undefined" && window.kakao && position && (
                            <Map
                                center={position}
                                style={{width: "100%", height: "400px"}}
                                level={3}
                                onCenterChanged={(map) => {
                                    setPosition({
                                        lat: map.getCenter().getLat(),
                                        lng: map.getCenter().getLng(),
                                    });
                                }}
                            >
                                <MapMarker position={position}/>
                            </Map>
                        )}
                    </div>

                    <div className="mapBottom">
                        <p className="address_road">{address}</p>
                        <p className="address" style={{fontSize: '12px', color: '#888'}}>
                            (지도를 움직여 정확한 위치를 선택해 주세요)
                        </p>

                        <button
                            type="button"
                            className="go_report"
                            onClick={handleLocationSubmit}
                        >
                            이 위치로 등록
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}