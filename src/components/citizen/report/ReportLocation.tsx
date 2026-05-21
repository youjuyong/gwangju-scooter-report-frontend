"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Circle, Map, MapMarker} from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";
import {getBachList} from "@/services/report/reportApi";
import "../../../assets/style/css/base_style.css";
import "../../../assets/style/css/style.css";
import {getOutlineType} from "@/services/common/commonApi";
import LoadingOverlay from "@/components/LoadingOverlay";

interface MapProps {
    brandId: string;
    onSelect: (location: { address: string; lat: number; lng: number, zoneId: string }) => void;
    onBack: () => void;
}

export default function ReportLocation({brandId, onSelect, onBack}: MapProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("위치를 선택해 주세요");
    const [zoneId, setZoneId] = useState<string>("");
    const [outlinePath, setOutlinePath] = useState([]);
    const [bachList, setBachList] = useState<any[]>([]);
    const [jibunAddress, setJibunAddress] = useState<string>("");

    const fetchAddressInfo = useCallback((lat: number, lng: number) => {
        const {kakao} = window;
        if (!kakao || !kakao.maps.services) return;
        kakao.maps.load(() => {
            const geocoder = new kakao.maps.services.Geocoder();

            geocoder.coord2Address(lng, lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const addr = result[0].road_address
                        ? result[0].road_address.address_name
                        : result[0].address.address_name;
                    setAddress(addr);

                    if (result[0].address && result[0].address.address_name) {
                        setJibunAddress(result[0].address.address_name);
                    } else {
                        setJibunAddress("");
                    }
                } else {
                    setAddress("주소를 찾을 수 없는 지역입니다.");
                }
            });

            geocoder.coord2RegionCode(lng, lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const zoneInfo = result.find((item: any) => item.region_type === 'B');
                    if (zoneInfo) {
                        setZoneId(zoneInfo.code);
                    }
                }
            });
        });
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            alert("GPS를 지원하지 않는 기기입니다.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setPosition(newPos);
                fetchAddressInfo(newPos.lat, newPos.lng);
            },
            (err) => {
                console.warn("GPS 획득 실패:", err);

                navigator.geolocation.getCurrentPosition(
                    (secondPos) => {
                        const newPos = {
                            lat: secondPos.coords.latitude,
                            lng: secondPos.coords.longitude,
                        };
                        setPosition(newPos);
                        fetchAddressInfo(newPos.lat, newPos.lng);
                    },
                    (secondErr) => {
                        console.error("최종 위치 획득 실패, 기본 위치로 지도를 엽니다:", secondErr);
                        // alert("현재 위치를 가져올 수 없습니다. 지도를 직접 움직여 선택해 주세요.");

                        const defaultPos = {lat: 37.42870, lng: 127.25618};
                        setPosition(defaultPos);
                        fetchAddressInfo(defaultPos.lat, defaultPos.lng);
                    },
                    {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000}
                );
            },
            {enableHighAccuracy: false, timeout: 6000, maximumAge: Infinity}
        );

        const initData = async () => {
            try {
                const [outlineRes]: any = await Promise.all([
                    getOutlineType()
                ]);

                if (outlineRes && Array.isArray(outlineRes)) {
                    const formattedPath: any = outlineRes
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
        initData();
    }, [fetchAddressInfo]);

    useEffect(() => {
        if (!brandId || brandId.trim() === "") {
            return;
        }
        const getBach = async () => {
            try {
                const res = await getBachList(brandId);
                if (res && res.success && Array.isArray(res.data)) {
                    setBachList(res.data);
                }
            } catch (e) {
                console.error('Error :', e);
            }
        };
        getBach();
    }, []);


    const optimizedPath = useMemo(() => {
        if (!outlinePath || outlinePath.length === 0) return [];
        return outlinePath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlinePath]);

    const checkValidLocation = (lat: number, lng: number) => {
        const {kakao} = window;
        if (!kakao || !kakao.maps) return false;

        const markerPoint = new kakao.maps.LatLng(lat, lng);

        return bachList.some((item) => {
            const zonePoint = new kakao.maps.LatLng(Number(item.lat), Number(item.lot));

            const polyLine = new kakao.maps.Polyline({
                path: [markerPoint, zonePoint]
            });

            return polyLine.getLength() <= 15;
        });
    };

    const handleLocationSubmit = () => {
        if (!position || !zoneId || address === "위치를 선택해 주세요") {
            alert("정확한 위치를 선택해 주세요.");
            return;
        }
        if (outlinePath.length > 0) {
            const isInside = checkValidLocation(position.lat, position.lng);

            if (isInside) {
                alert("지정된 금지 영역 내부에는 등록할 수 없습니다. 다른 위치를 선택해 주세요.");
                return;
            }
        }
        onSelect({
            address: address,
            lat: position.lat,
            lng: position.lng,
            zoneId: zoneId,
        });
    };

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>위치 확인</h1>
                <button type="button" className="back" onClick={onBack}>뒤로 가기</button>
            </header>

            {!position ? (
                <LoadingOverlay message={"사용자의 위치를 찾는중입니다.."}/>
            ) : (
                <main className="sub_article">
                    <div className="min">
                        <div className="mapbox" style={{position: 'relative'}}>
                            {typeof window !== "undefined" && window.kakao && position && (
                                <Map
                                    center={position}
                                    style={{width: "100%", height: "80vh", minHeight: "300px"}}
                                    level={3}
                                    onIdle={(map) => {
                                        const center = map.getCenter();
                                        const lat = center.getLat();
                                        const lng = center.getLng();

                                        setPosition({lat, lng});
                                        fetchAddressInfo(lat, lng);
                                    }}
                                >
                                    <MapMarker position={position}/>

                                    {bachList.map((item) => {
                                        const centerLatLng = {
                                            lat: Number(item.lat),
                                            lng: Number(item.lot),
                                        };

                                        return (
                                            <React.Fragment key={item.btchZoneId}>
                                                <Circle
                                                    center={centerLatLng}
                                                    radius={15}
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
                                    {outlinePath.length > 0 && (
                                        <CityOutline path={optimizedPath}/>
                                    )}
                                </Map>
                            )}
                        </div>

                        <div className="mapBottom">
                            <p className="address_road">{address}</p>
                            <p className="address" style={{fontSize: '12px', color: '#888'}}>
                                {jibunAddress ? `${jibunAddress}` : "(지도를 움직여 정확한 위치를 선택해 주세요)"}
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
            )}

        </div>
    );
}