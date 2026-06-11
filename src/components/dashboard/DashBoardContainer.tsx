"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getDashboardList, getOutlineType} from "@/services/common/commonApi";
import {useAlert} from "@/components/popup/PopupProvider";
import {Map, MapMarker} from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";
import ReportDetailPopup from "@/components/admin/popup/ReportDetailPopup";

export default function DashboardContainer() {
    const [isToggleChecked, setIsToggleChecked] = useState(false);
    const [activeListId, setActiveListId] = useState<number | null>(null);
    const [isLeftOff, setIsLeftOff] = useState(false);
    const [isUpperOff, setIsUpperOff] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [status, setStatus] = useState("");

    const showAlert = useAlert();
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("위치를 선택해 주세요");
    const [zoneId, setZoneId] = useState<string>("");
    const [bachList, setBachList] = useState<any[]>([]);
    const [jibunAddress, setJibunAddress] = useState<string>("");

    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const [isMobileSize, setIsMobileSize] = useState<boolean>(
        typeof window !== "undefined" ? window.innerWidth <= 1430 : false
    );

    const {data: outlineRes} = useQuery({
        queryKey: ["outlineType"],
        queryFn: getOutlineType,
    });

    const {data: dashboardResponse} = useQuery({
        queryKey: ["dashboardList"],
        queryFn: getDashboardList,
    });

    const dashboardList = (dashboardResponse?.data || []).filter((item: any) => {
        const code = item.dclrStts?.cdId;
        return code !== "DEST05" && code !== "DEST10";
    });

    useEffect(() => {
        console.log(dashboardList, 'dashboardList');
    }, []);

    const selectedItem = useMemo(() => {
        if (!activeListId || !Array.isArray(dashboardList)) return null;
        return dashboardList.find((item: any) => item.dclrId === activeListId) || null;
    }, [activeListId, dashboardList]);

    const optimizedPath = useMemo(() => {
        if (!outlineRes || !Array.isArray(outlineRes)) return [];
        const formattedPath = outlineRes
            .sort((a: any, b: any) => a.ord - b.ord)
            .map((item: any) => ({
                lat: Number(item.ycrdn),
                lng: Number(item.xcrdn)
            }));
        return formattedPath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlineRes]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleResizeMode = () => {
            setIsMobileSize(window.innerWidth <= 1430);
        };
        window.addEventListener("resize", handleResizeMode);
        return () => window.removeEventListener("resize", handleResizeMode);
    }, []);

    useEffect(() => {
        if (!mapInstance || !position) return;
        mapInstance.relayout();

        const {kakao} = window;
        const projection = mapInstance.getProjection();
        const currentLatLng = new kakao.maps.LatLng(position.lat, position.lng);
        const pixelPoint = projection.pointFromCoords(currentLatLng);
        const isMobileLayout = window.innerWidth <= 1430;

        let offsetX = isLeftOff ? 0 : (320 / 2);
        if (!isMobileLayout && isLeftOff) {
            offsetX = offsetX + 160;
        }
        const offsetY = isUpperOff ? 0 : ((isMobileSize ? 86 : 51) / 2);

        const correctedPixel = new kakao.maps.Point(
            pixelPoint.x + offsetX,
            pixelPoint.y + offsetY
        );

        const correctedLatLng = projection.coordsFromPoint(correctedPixel);

        setMapCenter({lat: correctedLatLng.getLat(), lng: correctedLatLng.getLng()});

        mapInstance.setCenter(correctedLatLng);
    }, [isLeftOff, isUpperOff, mapInstance, position]);

    useEffect(() => {
        if (!mapInstance) return;

        const handleResize = () => {
            const {kakao} = window;
            if (!kakao || !mapInstance) return;

            const targetCenter = mapCenter || position;
            if (!targetCenter) return;

            mapInstance.relayout();

            const projection = mapInstance.getProjection();
            const currentLatLng = new kakao.maps.LatLng(targetCenter.lat, targetCenter.lng);
            const pixelPoint = projection.pointFromCoords(currentLatLng);
            const isMobileLayout = window.innerWidth <= 1430;
            const moveLatLng = new kakao.maps.LatLng(targetCenter.lat, targetCenter.lng);

            let offsetX = 0;
            if (!isLeftOff) {
                offsetX = isMobileSize ? 0 : (320 / 2);
            }
            let offsetY = 0;
            if (!isUpperOff) {
                offsetY = (isMobileSize ? 86 : 51) / 2;
            }

            const correctedPixel = new kakao.maps.Point(
                pixelPoint.x + offsetX,
                pixelPoint.y + offsetY
            );

            const correctedLatLng = projection.coordsFromPoint(correctedPixel);
            mapInstance.setCenter(correctedLatLng);

            if (isLeftOff || isUpperOff) {
                let offX = 0, offY = 0;
                if (!isMobileLayout) {
                    if (isLeftOff) offX += 160;
                    if (isUpperOff) offY += ((isMobileLayout ? 86 : 51) / 2);
                }
                const correctedPixel = new kakao.maps.Point(
                    pixelPoint.x + offsetX,
                    pixelPoint.y + offsetY
                );

                const correctedLatLng = mapInstance.setCenter(projection.coordsFromPoint(correctedPixel));
                mapInstance.setCenter(correctedLatLng);
            } else {
                mapInstance.setCenter(moveLatLng);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [mapInstance, mapCenter, position, isLeftOff, isUpperOff]);

    const handleListClick = (item: any) => {
        setActiveListId(item.dclrId);
        setIsPopupOpen(true);
        if (typeof window !== "undefined" && window.innerWidth <= 1430) {
            setIsLeftOff(true);
        }
    };

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

                    setJibunAddress(result[0].address?.address_name || "");
                } else {
                    setAddress("주소를 찾을 수 없는 지역입니다.");
                }
            });

            geocoder.coord2RegionCode(lng, lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const zoneInfo = result.find((item: any) => item.region_type === 'B');
                    if (zoneInfo) setZoneId(zoneInfo.code);
                }
            });
        });
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            showAlert("GPS를 지원하지 않는 기기입니다.");
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

                        const defaultPos = {lat: 37.42870, lng: 127.25618};
                        setPosition(defaultPos);
                        fetchAddressInfo(defaultPos.lat, defaultPos.lng);
                    },
                    {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000}
                );
            },
            {enableHighAccuracy: false, timeout: 6000, maximumAge: Infinity}
        );
    }, [fetchAddressInfo]);

    return (
        <div className={`wrap ${isLeftOff ? "leftoff" : "lefton"} ${isUpperOff ? "off" : "on"} `}>
            <div className="subnav dashboardTop">
                <dl>
                    <dt>모드선택</dt>
                    <dd>
                        <label className="switch">
                            <input
                                type="checkbox"
                                id="toggle"
                                checked={isToggleChecked}
                                onChange={(e) => setIsToggleChecked(e.target.checked)}
                            />
                            <span className="modeslider">
                              <span className="text on">자동</span>
                              <span className="text off">수동</span>
                            </span>
                        </label>
                    </dd>
                    <dt>PM</dt>
                    <dd className="pm">
                        <button className="click"><img src="./../assets/style_admin/images/gcoo.png" alt="지쿠"/>지쿠
                        </button>
                        <button><img src="./../assets/style_admin/images/swing.png" alt="스윙"/>스윙</button>
                    </dd>
                </dl>
                <dl>
                    <dt>상태/건수</dt>
                    <dd className="status status1">
                        <button className="icon1 click" disabled={!isToggleChecked}>미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon2 click">미배정 [0]</button>
                        <button className="icon3 click">처리중 [0]</button>
                        <button className="icon4 click">처리완료 [0]</button>
                    </dd>
                    <dd className="status status2">
                        <button className="icon5 click" disabled={!isToggleChecked}>견인미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon6">견인요청 [0]</button>
                        <button className="icon7">견인처리중 [0]</button>
                        <button className="icon8">견인완료 [0]</button>
                    </dd>
                </dl>
            </div>

            <button className="btnarrow" onClick={() => setIsUpperOff(!isUpperOff)}></button>

            <div className="article">
                <section className="listBox">
                    <button className="btnarrow_left" onClick={() => setIsLeftOff(!isLeftOff)}></button>
                    <div className="leftinfo">
                        {isToggleChecked ? <div className="hand">수동모드</div> : <div className="auto">자동 승인 처리중..</div>}
                    </div>

                    <div className="listconten">
                        <h2>목록</h2>
                        <ul className="">
                            {Array.isArray(dashboardList) && dashboardList.map((item: any) => {
                                /*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8*/
                                const statusMap: Record<string, { className: string; text: string }> = {
                                    "DEST01": {className: "st1", text: "미승인"},
                                    "DEST02": {className: "st2", text: "미배정"},
                                    "DEST03": {className: "st3", text: "처리중"},
                                    "DEST04": {className: "st4", text: "처리완료"},
                                    "DEST06": {className: "st5", text: "견인미승인"},
                                    "DEST07": {className: "st6", text: "견인요청"},
                                    "DEST08": {className: "st7", text: "견인처리중"},
                                    "DEST09": {className: "st8", text: "견인완료"},
                                };

                                const currentCdId = item.dclrStts?.cdId;
                                const currentStatus = statusMap[currentCdId] || {
                                    className: "st1",
                                    text: item.dclrStts?.cdNm || "미승인"
                                };

                                return (
                                    <li key={item.dclrId} className={activeListId === item.dclrId ? "click" : ""}
                                        onClick={() => handleListClick(item)}>
                                        <div className="listtop">
                                            <p className={`state ${currentStatus.className}`}>{currentStatus.text}</p>
                                            <div className="pmname">{item.pmName}</div>
                                        </div>
                                        <div className="address">{item.address}</div>
                                        <div className="details">
                                            <div className="detail_tableBox">
                                                <table>
                                                    <tbody>
                                                    <tr>
                                                        <th>신고일시</th>
                                                        <td>{item.regDt}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>위반유형</th>
                                                        <td>{item.vltnType?.cdNm || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>상세설명</th>
                                                        <td>{item.dclrCn}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>처리자ID</th>
                                                        <td>{item.prcrHis?.prcr?.userId || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>처리일자</th>
                                                        <td className="blue">{item.prcrHis?.prcsDt || "-"}</td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </section>

                <section className="mapBox">
                    {selectedItem && (
                        <ReportDetailPopup
                            isOpen={isPopupOpen}
                            onClose={() => setIsPopupOpen(false)}
                            onRefreshList={() => {
                                // sse 연동 후 추가 예정
                            }}
                            bzentyId={selectedItem.bzenty?.bzentyId}
                            data={{
                                dclrId: selectedItem.dclrId,
                                dclDt: selectedItem.regDt,
                                dclrUserId: selectedItem.dclrUserId,
                                vltnTypeNm: selectedItem.vltnType?.cdNm,
                                dclrCn: selectedItem.dclrCn || selectedItem.prcrHis?.prcsRsn,
                                bzentyNm: selectedItem.bzenty?.bzentyNm ? selectedItem.bzenty.bzentyNm.split("(")[0]?.trim() : "-",
                                qrVal: selectedItem.qrcdVl,
                                prcsStpCd: selectedItem.dclrStts?.cdId,
                                prcsStpNm: selectedItem.dclrStts?.cdNm,
                                prcrId: selectedItem.prcrHis?.prcr?.userId,
                                prcsDt: selectedItem.prcrHis?.prcsDt,
                                prcsRsn: selectedItem.prcrHis?.prcsRsn
                            }}
                        />
                    )}

                    <div className="map">
                        {typeof window !== "undefined" && window.kakao && position && (
                            <Map center={mapCenter || position}
                                 style={{width: "100%", height: "100%", minHeight: "300px"}} level={3}
                                 onCreate={(map) => setMapInstance(map)}>
                                <MapMarker position={position}/>
                                {optimizedPath.length > 0 && <CityOutline path={optimizedPath}/>}
                            </Map>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}