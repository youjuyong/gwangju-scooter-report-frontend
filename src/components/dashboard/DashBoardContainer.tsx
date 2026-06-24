"use client";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getOutlineType} from "@/services/common/commonApi";
import {useAlert} from "@/components/popup/PopupProvider";
import {Circle, CustomOverlayMap, Map} from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";
import ReportDetailPopup from "@/components/admin/popup/ReportDetailPopup";
import {
    approveDclr,
    approveTowDclr,
    getAutoApprove,
    getDashboardList,
    patchAutoApprove,
    rejectDclr
} from "@/services/dashboard/dashboardApi";
import {useModeStore} from "@/store/dashboardStore";
import {getBatchPointListApi, getPmCompanyListApi} from "@/services/system/systemApi";
import LoadingOverlay from "@/components/LoadingOverlay";
import {useSseStore} from "@/store/sseStore";
import {useAuthStore} from "@/store/authStore";


export default function DashboardContainer() {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.admin?.accessToken);
    const [activeListId, setActiveListId] = useState<number | null>(null);
    const [isLeftOff, setIsLeftOff] = useState(false);
    const [isUpperOff, setIsUpperOff] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const showAlert = useAlert();
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("위치를 선택해 주세요");
    const [zoneId, setZoneId] = useState<string>("");
    const [bachList, setBachList] = useState<any[]>([]);
    const [jibunAddress, setJibunAddress] = useState<string>("");
    const [selectedPmIds, setSelectedPmIds] = useState<string[]>([]);

    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const [isMobileSize, setIsMobileSize] = useState<boolean>(
        typeof window !== "undefined" ? window.innerWidth <= 1430 : false
    );

    const {connectSSE, disconnectSSE} = useSseStore();

    const {setMode, setIsSubmitting} = useModeStore();
    const [isPmInitialized, setIsPmInitialized] = useState(false);
    const {processingDclrId, setProcessingDclrId} = useModeStore();
    const isLoading = !!processingDclrId;

    const {data: outlineRes} = useQuery({
        queryKey: ["outlineType"],
        queryFn: getOutlineType,
    });

    const {data: dashboardResponse} = useQuery({
        queryKey: ["dashboardList", token],
        queryFn: () => getDashboardList(token),
        enabled: !!token,
    });

    const {data: approveResponse} = useQuery({
        queryKey: ["status"],
        queryFn: getAutoApprove,
    });

    const {data: pmCompanyResponse} = useQuery({
        queryKey: ["pmCompanyList"],
        queryFn: getPmCompanyListApi,
    });

    const {data: bachListResponse} = useQuery({
        queryKey: ["bachList"],
        queryFn: getBatchPointListApi,
    });

    const allBachList = bachListResponse || [];

    const filteredBachList = useMemo(() => {
        if (!Array.isArray(allBachList)) return [];
        return allBachList.filter((item: any) => {
            const targetPmId = item.bzentyId;
            return selectedPmIds.includes(String(targetPmId));
        });
    }, [allBachList, selectedPmIds]);

    const getMapColors = (bzentyNm: string, isSelected: boolean) => {
        const isSwing = bzentyNm === '스윙(SWING)';
        if (isSelected) {
            return {strokeColor: "rgba(0, 246, 255, 0.7)", fillColor: "rgba(0, 246, 255, 0.3)", centerColor: "#00f6ff"};
        }
        return {
            strokeColor: isSwing ? "rgba(150, 0, 255, 0.5)" : "rgba(255, 0, 255, 0.4)",
            fillColor: isSwing ? "rgba(150, 0, 255, 0.2)" : "rgba(255, 0, 255, 0.2)",
            centerColor: isSwing ? "#9600ff" : "#ff00dc"
        };
    };

    const pmImageMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (Array.isArray(pmCompanyResponse)) {
            pmCompanyResponse.forEach((company: any) => {
                if (company.bzentyId) {
                    map[company.bzentyId] = company.markImgBase64 || "";
                }
            });
        }
        return map;
    }, [pmCompanyResponse]);

    useEffect(() => {
        if (approveResponse !== undefined) {
            const isManualFromServer = approveResponse?.data === false || approveResponse?.data === "N";
            setMode(isManualFromServer ? 'MANUAL' : 'AUTO');

            if (isManualFromServer) {
                setSelectedStatus((prev) => {
                    const nextStatus = [...prev];
                    if (!nextStatus.includes("DEST01")) nextStatus.push("DEST01");
                    if (!nextStatus.includes("DEST06")) nextStatus.push("DEST06");
                    return nextStatus;
                });
            }
        }
    }, [approveResponse, setMode]);

    const [tempToggleOverride, setTempToggleOverride] = useState<boolean | null>(null);

    const isToggleChecked = tempToggleOverride !== null
        ? tempToggleOverride
        : (approveResponse?.data === false || approveResponse?.data === "N");

    useEffect(() => {
        setMode(isToggleChecked ? 'MANUAL' : 'AUTO');
    }, [isToggleChecked, setMode]);

    const toggleMutation = useMutation({
        mutationFn: (checkedStatus: boolean) => patchAutoApprove(checkedStatus),
        onMutate: () => {
            setIsSubmitting(true);
        },
        onSuccess: (data, checkedStatus) => {
            setTempToggleOverride(checkedStatus);
            setMode(checkedStatus ? 'MANUAL' : 'AUTO');
            queryClient.invalidateQueries({queryKey: ["status"]});
        },
        onError: (error) => {
            console.error("모드 변경 실패:", error);
            setTempToggleOverride(null);
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    const approveMutation = useMutation({
        mutationFn: (dclrId: string) => approveDclr(dclrId),
        onMutate: (dclrId) => {
            setProcessingDclrId(dclrId);
        },
        onSuccess: async () => {
            try {
                await queryClient.refetchQueries({
                    queryKey: ["dashboardList", token]
                });

                showAlert("승인 처리 완료");
            } finally {
                setProcessingDclrId(null);
            }
        },
        onError:
            (error) => {
                console.error("승인 실패:", error);
            },
    });

    const approveTowMutation = useMutation({
        mutationFn: (dclrId: string) => approveTowDclr(dclrId),
        onMutate: (dclrId) => {
            setProcessingDclrId(dclrId);
        },
        onSuccess: async () => {
            try {
                await queryClient.refetchQueries({
                    queryKey: ["dashboardList", token]
                });

                showAlert("승인 처리 완료");
            } finally {
                setProcessingDclrId(null);
            }
        },
        onError:
            (error) => {
                console.error("승인 실패:", error);
            },
    });

    const rejectMutation = useMutation({
        mutationFn: (dclrId: string) => rejectDclr(dclrId),
        onMutate: (dclrId) => {
            setProcessingDclrId(dclrId);
        },
        onSuccess: async () => {
            try {
                await queryClient.refetchQueries({
                    queryKey: ["dashboardList", token]
                });

                showAlert("반려 처리가 완료되었습니다.");
            } finally {
                setProcessingDclrId(null);
            }
        },
        onError: (error) => {
            console.error("반려 실패:", error);
        },
    });

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;

        setMode(isChecked ? 'MANUAL' : 'AUTO');
        toggleMutation.mutate(isChecked);

        if (isChecked) {
            setSelectedStatus((prev) => {
                const nextStatus = [...prev];
                if (!nextStatus.includes("DEST01")) nextStatus.push("DEST01");
                if (!nextStatus.includes("DEST06")) nextStatus.push("DEST06");
                return nextStatus;
            });
        } else {
            setSelectedStatus((prev) => prev.filter(code => code !== "DEST01" && code !== "DEST06"));
        }
    };

    useEffect(() => {
        if (isPmInitialized || !Array.isArray(pmCompanyResponse) || pmCompanyResponse.length === 0) {
            return;
        }

        const allIds = pmCompanyResponse.map((company: any) => String(company.bzentyId));

        setSelectedPmIds(allIds);
        setIsPmInitialized(true);
    }, [pmCompanyResponse, isPmInitialized]);

    const [selectedStatus, setSelectedStatus] = useState<string[]>([
        "DEST02", // 미배정
        "DEST03", // 처리중
        "DEST04"  // 처리완료
    ]);

    const statusCount = useMemo(() => {
        const count: Record<string, number> = {
            DEST01: 0, DEST02: 0, DEST03: 0, DEST04: 0,
            DEST06: 0, DEST07: 0, DEST08: 0, DEST09: 0
        };
        const rawData = dashboardResponse?.data || [];

        rawData.forEach((item: any) => {
            const pmId = item.bzenty?.bzentyId ? String(item.bzenty.bzentyId) : "";

            if (selectedPmIds.includes(pmId)) {
                const code = item.dclrStts?.cdId;
                if (code in count) {
                    count[code]++;
                }
            }
        });
        return count;
    }, [dashboardResponse, selectedPmIds]);

    const dashboardList = useMemo(() => {
        const data = (dashboardResponse?.data || []).filter((item: any) => {
            const code = item.dclrStts?.cdId;
            return code !== "DEST05" && code !== "DEST10";
        });

        const pmIds = data.filter((item: any) => selectedPmIds.includes(item.bzenty?.bzentyId));

        return pmIds.filter((item: any) => selectedStatus.includes(item.dclrStts?.cdId));
    }, [dashboardResponse, selectedPmIds, selectedStatus]);

    const selectedItem = useMemo(() => {
        if (!activeListId || !Array.isArray(dashboardList)) return null;
        return dashboardList.find((item: any) => item.dclrId === activeListId) || null;
    }, [activeListId, dashboardList]);

    useEffect(() => {
        if (token) {
            connectSSE(token, queryClient);
        }

        return () => {
            disconnectSSE();
        };
    }, [token]);

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

        if (item.latVl && item.lotVl) {
            const targetPos = {lat: Number(item.latVl), lng: Number(item.lotVl)};

            setPosition(targetPos);
            setMapCenter(targetPos);

        }
    };

    const handlePmFilterClick = (bzentyId: string) => {
        setSelectedPmIds((prevIds) => {
            if (prevIds.includes(bzentyId)) {
                return prevIds.filter((id) => id !== bzentyId);
            } else {
                return [...prevIds, bzentyId];
            }
        });
        setActiveListId(null);
    };

    const handleStatusFilterClick = (statusCode: string) => {
        setSelectedStatus((prev) => {
            if (prev.includes(statusCode)) {
                return prev.filter((code) => code !== statusCode);
            } else {
                return [...prev, statusCode];
            }
        });
        setActiveListId(null);
    };

    const handleApprove = (e: React.MouseEvent, item: any) => {
        e.stopPropagation();

        if (confirm("승인하시겠습니까?")) {
            if (item?.dclrStts?.cdId === "DEST06") {
                approveTowMutation.mutate(String(item.dclrId));
            } else {
                approveMutation.mutate(String(item.dclrId));
            }
        }
    }

    const handleReject = (e: React.MouseEvent, dclrId: string) => {
        e.stopPropagation();

        if (confirm("반려하시겠습니까?")) {
            rejectMutation.mutate(dclrId);
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
                                disabled={toggleMutation.isPending || isPopupOpen}
                                onChange={handleToggleChange}
                            />
                            <span className="modeslider">
                              <span className="text on">자동</span>
                              <span className="text off">수동</span>
                            </span>
                        </label>
                    </dd>
                    <dt>PM</dt>
                    <dd className="pm">
                        {Array.isArray(pmCompanyResponse) && pmCompanyResponse.map((company: any) => (
                            <button
                                key={company.bzentyId}
                                className={selectedPmIds.includes(company.bzentyId) ? "click" : ""}
                                style={isPopupOpen ? {pointerEvents: "none"} : {}}
                                onClick={() => handlePmFilterClick(company.bzentyId)}
                            >
                                {company.markImgBase64 && (
                                    <img src={company.markImgBase64} alt={company.bzentyNm || ""}/>
                                )}
                                {company.bzentyNm ? company.bzentyNm.split("(")[0]?.trim() : ""}
                            </button>
                        ))}
                    </dd>
                </dl>
                <dl>
                    <dt>상태/건수</dt>
                    <dd className="status status1">
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button
                            className={`icon1 ${selectedStatus.includes("DEST01") ? "click" : ""}`}
                            disabled={!isToggleChecked}
                            onClick={() => handleStatusFilterClick("DEST01")}
                        >
                            미승인 [{statusCount.DEST01}]
                        </button>
                        <button
                            className={`icon2 ${selectedStatus.includes("DEST02") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST02")}
                        >
                            미배정 [{statusCount.DEST02}]
                        </button>
                        <button
                            className={`icon3 ${selectedStatus.includes("DEST03") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST03")}
                        >
                            처리중 [{statusCount.DEST03}]
                        </button>
                        <button
                            className={`icon4 ${selectedStatus.includes("DEST04") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST04")}
                        >
                            처리완료 [{statusCount.DEST04}]
                        </button>
                    </dd>
                    <dd className="status status2">
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button
                            className={`icon5 ${selectedStatus.includes("DEST06") ? "click" : ""}`}
                            disabled={!isToggleChecked}
                            onClick={() => handleStatusFilterClick("DEST06")}
                        >
                            견인미승인 [{statusCount.DEST06}]
                        </button>
                        <button
                            className={`icon6 ${selectedStatus.includes("DEST07") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST07")}
                        >
                            견인요청 [{statusCount.DEST07}]
                        </button>
                        <button
                            className={`icon7 ${selectedStatus.includes("DEST08") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST08")}
                        >
                            견인처리중 [{statusCount.DEST08}]
                        </button>
                        <button
                            className={`icon8 ${selectedStatus.includes("DEST09") ? "click" : ""}`}
                            onClick={() => handleStatusFilterClick("DEST09")}
                        >
                            견인완료 [{statusCount.DEST09}]
                        </button>
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

                    {(isLoading || toggleMutation.isPending) && (
                        <LoadingOverlay message="처리 중입니다..."/>
                    )}

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
                                    "DEST10": {className: "st4", text: "자동취소"}
                                };

                                const currentCdId = item.dclrStts?.cdId;
                                const currentStatus = statusMap[currentCdId] || {
                                    className: "st1",
                                    text: item.dclrStts?.cdNm || "미승인"
                                };

                                const pmId = item.bzenty?.bzentyId;
                                const pmImg = pmImageMap[pmId];

                                const currentLoading = processingDclrId === String(item.dclrId);

                                return (
                                    <li key={item.dclrId} className={activeListId === item.dclrId ? "click" : ""}
                                        onClick={() => handleListClick(item)}>
                                        <div className="listtop">
                                            <p className={`state ${currentStatus.className}`}>{currentStatus.text}</p>
                                            <div className="pmname">
                                                {pmImg ? (
                                                    <>
                                                        <img src={pmImg} alt={item.pmName || ""}/>
                                                        {item.bzenty?.bzentyNm?.split("(")[0]?.trim()}
                                                    </>
                                                ) : null}
                                            </div>
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
                                        {isToggleChecked && ["DEST01", "DEST06"].includes(item?.dclrStts?.cdId) && !currentLoading && (
                                            <div className="btnSet">
                                                <button
                                                    onClick={(e) => handleReject(e, String(item.dclrId))}
                                                    disabled={currentLoading}
                                                >
                                                    {currentLoading ? "처리중..." : "반려"}
                                                </button>
                                                {/*반려 시 아예 삭제*/}
                                                <button
                                                    className="red"
                                                    onClick={(e) => handleApprove(e, item)}
                                                    disabled={currentLoading}
                                                >
                                                    {currentLoading ? "처리중..." : "승인"}
                                                </button>
                                                {/*승인 시 미배정으로 변경*/}
                                            </div>
                                        )}
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
                            isDashBoard={isPopupOpen}
                        />
                    )}

                    <div className="map">
                        {typeof window !== "undefined" && window.kakao && position && (
                            <Map center={mapCenter || position}
                                 style={{width: "100%", height: "100%", minHeight: "300px"}} level={3}
                                 onCreate={(map) => setMapInstance(map)}>
                                {/*<MapMarker position={position}/>*/}

                                {/* 마커 */}
                                {Array.isArray(dashboardList) && dashboardList.map((item: any) => {
                                    if (!item.latVl || !item.lotVl) return null;

                                    const markerLatLng = {lat: Number(item.latVl), lng: Number(item.lotVl)};

                                    /*marker1(미승인) ~ marker8(견인완료) 순서대로 번호 / 클릭 시 click 넣기*/
                                    const statusMarkerNumberMap: Record<string, string> = {
                                        "DEST01": "1", // 미승인
                                        "DEST02": "2", // 미배정
                                        "DEST03": "3", // 처리중
                                        "DEST04": "4", // 처리완료
                                        "DEST06": "5", // 견인미승인
                                        "DEST07": "6", // 견인요청
                                        "DEST08": "7", // 견인처리중
                                        "DEST09": "8", // 견인완료
                                    };
                                    const markerNum = statusMarkerNumberMap[item.dclrStts?.cdId] || "1";

                                    const selectedItem = activeListId === item.dclrId;

                                    const pmImg = pmImageMap[item.bzenty?.bzentyId];

                                    return (
                                        <CustomOverlayMap
                                            key={`marker-${item.dclrId}`}
                                            position={markerLatLng}
                                            clickable={true}
                                        >
                                            <div
                                                className={`marker marker${markerNum} ${selectedItem ? "click" : ""}`}
                                                onClick={() => handleListClick(item)}
                                                style={{cursor: "pointer"}}
                                            >
                                                <div className="img">
                                                    <p className="tow"></p>
                                                    {pmImg ? (
                                                        <img src={pmImg} alt={item.bzenty?.bzentyNm || "logo"}/>
                                                    ) : (
                                                        <img src="/assets/style_pm/images/mark.png" alt="defaultLogo"/>
                                                    )}
                                                </div>
                                            </div>
                                        </CustomOverlayMap>
                                    );
                                })}

                                {/* 배치존 */}
                                {Array.isArray(filteredBachList) && filteredBachList.map((item: any) => {
                                    if (!item.ycrdn || !item.xcrdn) return null;

                                    const centerLatLng = {lat: Number(item.ycrdn), lng: Number(item.xcrdn)};
                                    const isSelected = activeListId === item.btchZoneId;
                                    const colors = getMapColors(item.bzentyNm, isSelected);

                                    return (
                                        <React.Fragment key={item.btchZoneId || `${item.ycrdn}-${item.xcrdn}`}>
                                            <Circle
                                                center={centerLatLng}
                                                radius={25}
                                                strokeWeight={1}
                                                strokeColor={colors.strokeColor}
                                                strokeOpacity={0.8}
                                                strokeStyle={"solid"}
                                                fillColor={colors.fillColor}
                                                fillOpacity={0.5}
                                            />
                                            <Circle
                                                center={centerLatLng}
                                                radius={2}
                                                strokeWeight={1}
                                                strokeColor={colors.centerColor}
                                                strokeOpacity={1}
                                                fillColor={colors.centerColor}
                                                fillOpacity={1}
                                            />
                                        </React.Fragment>
                                    );
                                })}

                                {optimizedPath.length > 0 && <CityOutline path={optimizedPath}/>}
                            </Map>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}