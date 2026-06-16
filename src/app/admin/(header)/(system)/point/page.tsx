"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";

// API 임포트
import {
    getBatchPointListApi,
    createBatchPointApi,
    updateBatchPointApi,
    deleteBatchPointApi
} from "@/services/system/systemApi";

// 엑셀 다운로드 컴포넌트 및 컨텍스트
import ExcelDownload from "@/components/admin/ExcelDownload";
import { ExcelContext } from '@/components/admin/ExcelContext';

//  Kakao Maps 컴포넌트
import { Map, Circle, CustomOverlayMap } from "react-kakao-maps-sdk";
import { CityOutline } from "@/components/dashboard/CityOutline";
import { useQuery } from "@tanstack/react-query";
import {getOutlineType, registerMenuLog} from "@/services/common/commonApi";
import LoadingOverlay from "@/components/LoadingOverlay";

// 배치 포인트 응답 인터페이스 정의
export interface BatchPointResponse {
    btchZoneId: string | number; // 배치존 ID (삭제/수정 키)
    bzentyId?: string;           // 업체 고유 ID
    bzentyNm: string;            // PM 업체명
    bachZoneAddrNm: string;      // 배치포인트명
    ycrdn?: number;              // 위도
    xcrdn?: number;              // 경도
}

export default function PointPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [gridData, setGridData] = useState<BatchPointResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<BatchPointResponse[]>([]);
    const [selectedRow, setSelectedRow] = useState<BatchPointResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    //저장 진행 중임을 나타내는 플래그 (지도 클릭 방지용 락)
    const [isSaving, setIsSaving] = useState(false);

    // 팝업 제어 상태
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMode, setPopupMode] = useState<'create' | 'update' | 'detail'>('detail');

    const [currentZoneId, setCurrentZoneId] = useState<string | number>('');
    const [pmCompany, setPmCompany] = useState('BZE-0000005');
    const [pointName, setPointName] = useState('');

    // 좌표 관리 상태
    const [coordinatesText, setCoordinatesText] = useState('37.4292450 , 127.2552140');
    const [exactCoords, setExactCoords] = useState({ lat: 37.4292450, lng: 127.2552140 });
    const [mapCenter, setMapCenter] = useState({ lat: 37.4292450, lng: 127.2552140 });
    const [popupPosition, setPopupPosition] = useState({ lat: 37.4292450, lng: 127.2552140 });

    // 그리드 및 지도 Ref
    const mapRef = useRef<kakao.maps.Map>(null);
    const pointGridRef = useRef<RaontecGridHandle>(null);

    // 엑셀 다운로드 Context
    const { setGrid, setFileName }: any = useContext(ExcelContext);

    const { data: outlineRes } = useQuery({
        queryKey: ["outlineType"],
        queryFn: getOutlineType,
    });

    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '공통코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    const pointGridColumns = useMemo<CustomColumnDef<BatchPointResponse>[]>(() => [
        { header: '배치존 고유 ID', accessorKey: 'btchZoneId', meta: { id: 'btchZoneId', isKey: true }, size: 130 },
        { header: 'PM 업체명', accessorKey: 'bzentyNm' },
        { header: '배치포인트명', accessorKey: 'bachZoneAddrNm' },
        { header: '위도', accessorKey: 'ycrdn', size: 100, enableColumnFilter: false },
        { header: '경도', accessorKey: 'xcrdn', size: 100, enableColumnFilter: false }
    ], []);

    const clearSelection = useCallback(() => {
        setSelectedRow(null);
        pointGridRef.current?.clearSelectedRow();
    }, []);

    const getCompanyIdByName = (name: string): string => {
        if (name?.includes("스윙") || name?.includes("SWING")) return "BZE-0000001";
        return "BZE-0000005"; // 기본값 지쿠
    };
    const fetchBatchPoints = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getBatchPointListApi();
            console.log(data)
            setGridData(data || []);
            clearSelection();
            setCheckedRows([]);
            pointGridRef.current?.clearRowSelection();
        } catch (error) {
            console.error("배치포인트 목록 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, [clearSelection]);

    useEffect(() => {
        fetchBatchPoints();
    }, [fetchBatchPoints]);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.relayout();
        }
    }, [mapCenter, isPopupOpen]);

    useEffect(() => {
        if (pointGridRef.current) {
            setGrid(pointGridRef.current);
            setFileName("배치포인트관리");
        }
    }, [gridData, setGrid, setFileName]);

    // 그리드 행 클릭 시 상세 팝업 오픈
    const handleRowClick = (row: BatchPointResponse) => {
        if (selectedRow?.btchZoneId === row.btchZoneId) {
            clearSelection();
            setIsPopupOpen(false);
            return;
        }

        setSelectedRow(row);
        setPopupMode('detail');
        setCurrentZoneId(row.btchZoneId);
        setPmCompany(row.bzentyId || getCompanyIdByName(row.bzentyNm));
        setPointName(row.bachZoneAddrNm);

        const formattedLat = row.ycrdn ? Number(row.ycrdn).toFixed(7) : '';
        const formattedLng = row.xcrdn ? Number(row.xcrdn).toFixed(7) : '';
        setCoordinatesText(`${formattedLat} , ${formattedLng}`);

        if (row.ycrdn && row.xcrdn) {
            const nextCenter = { lat: Number(Number(row.ycrdn).toFixed(7)), lng: Number(Number(row.xcrdn).toFixed(7)) };
            setExactCoords(nextCenter);
            setMapCenter(nextCenter);
            setPopupPosition(nextCenter);

            if (mapRef.current) {
                mapRef.current.panTo(new kakao.maps.LatLng(nextCenter.lat, nextCenter.lng));
            }
        }
        setIsPopupOpen(true);
    };

    // 지도 위 포인트 클릭 시 상세 팝업 오픈 및 그리드 동기화
    const handleCircleClick = (item: BatchPointResponse) => {
        if (selectedRow?.btchZoneId === item.btchZoneId) {
            clearSelection();
            setIsPopupOpen(false);
            return;
        }

        setSelectedRow(item);
        setPopupMode('detail');
        setCurrentZoneId(item.btchZoneId);
        setPmCompany(item.bzentyId || getCompanyIdByName(item.bzentyNm));
        setPointName(item.bachZoneAddrNm);

        const formattedLat = item.ycrdn ? Number(item.ycrdn).toFixed(7) : '';
        const formattedLng = item.xcrdn ? Number(item.xcrdn).toFixed(7) : '';
        setCoordinatesText(`${formattedLat} , ${formattedLng}`);

        if (item.ycrdn && item.xcrdn) {
            const targetPos = { lat: Number(Number(item.ycrdn).toFixed(7)), lng: Number(Number(item.xcrdn).toFixed(7)) };
            setExactCoords(targetPos);
            setMapCenter(targetPos);
            setPopupPosition(targetPos);
        }
        setIsPopupOpen(true);

        if (pointGridRef.current) {
            pointGridRef.current.triggerRowClick('btchZoneId', String(item.btchZoneId));
        }
    };

    // 상단 제어 버튼 이벤트 핸들러 - 등록
    const handleCreate = () => {
        setPopupMode('create');
        setCurrentZoneId('');
        setPmCompany("BZE-0000005");
        setPointName('');

        clearSelection();

        const fixedLat = Number(mapCenter.lat.toFixed(7));
        const fixedLng = Number(mapCenter.lng.toFixed(7));
        const initialCoords = { lat: fixedLat, lng: fixedLng };

        setCoordinatesText(`${fixedLat} , ${fixedLng}`);
        setExactCoords(initialCoords);
        setPopupPosition(initialCoords);
        setIsPopupOpen(true);
    };

    // 상단 제어 버튼 이벤트 핸들러 - 수정
    const handleUpdate = () => {
        const target = selectedRow || (checkedRows.length === 1 ? checkedRows[0] : null);
        if (!target) {
            alert("수정할 배치포인트를 목록에서 한 개 선택해 주세요.");
            return;
        }

        setPopupMode('update');
        setCurrentZoneId(target.btchZoneId);
        setPmCompany(target.bzentyId || getCompanyIdByName(target.bzentyNm));
        setPointName(target.bachZoneAddrNm);

        const isClicked = exactCoords.lat !== Number(Number(target.ycrdn).toFixed(7)) ||
            exactCoords.lng !== Number(Number(target.xcrdn).toFixed(7));

        if (!isClicked && target.ycrdn && target.xcrdn) {
            const targetPos = { lat: Number(Number(target.ycrdn).toFixed(7)), lng: Number(Number(target.xcrdn).toFixed(7)) };

            const formattedLat = target.ycrdn ? Number(target.ycrdn).toFixed(7) : '';
            const formattedLng = target.xcrdn ? Number(target.xcrdn).toFixed(7) : '';

            setCoordinatesText(`${formattedLat} , ${formattedLng}`);
            setExactCoords(targetPos);
            setMapCenter(targetPos);
            setPopupPosition(targetPos);
        }
        setIsPopupOpen(true);
    };

    const handleDelete = async () => {
        const targets = checkedRows.length > 0 ? checkedRows : (selectedRow ? [selectedRow] : []);
        if (targets.length <= 0) {
            alert("삭제할 배치포인트를 체크박스에서 선택해 주세요.");
            return;
        }

        if (window.confirm(`선택된 ${targets.length}개의 배치포인트를 정말로 삭제하시겠습니까?`)) {
            try {
                setIsLoading(true);
                await Promise.all(targets.map(item => deleteBatchPointApi(item.btchZoneId)));
                alert("성공적으로 삭제되었습니다.");
                clearSelection();
                setIsPopupOpen(false);
                fetchBatchPoints();
            } catch (error) {
                console.error("배치포인트 삭제 실패:", error);
                alert("삭제 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 팝업 저장 핸들러
    const handlePopupSave = async () => {
        // 👑 저장 시작 시 즉시 락을 걸어 이후 발생하는 모든 지도 클릭 이벤트를 무력화합니다.
        setIsSaving(true);
        const payload = {
            btchZoneId: popupMode === 'update' ? currentZoneId : undefined,
            bzentyId: pmCompany,
            btchZoneNm: pointName,
            lat: Number(exactCoords.lat.toFixed(7)),
            lot: Number(exactCoords.lng.toFixed(7)),
        };

        try {
            setIsLoading(true);
            console.log(payload);
            if (popupMode === 'update') {
                await updateBatchPointApi(payload);
                alert("배치포인트가 수정되었습니다.");
            } else {
                await createBatchPointApi(payload);
                alert("새로운 배치포인트가 등록되었습니다.");
            }
            setIsPopupOpen(false);
            clearSelection();
            await fetchBatchPoints();
        } catch (error) {
            console.error("배치포인트 저장 실패:", error);
            alert("저장 처리 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
            setIsSaving(false); // 👑 정상 종료든 에러든 처리가 끝나면 락 해제
        }
    };

    const handlePopupCancel = () => {
        setIsPopupOpen(false);
        clearSelection();
    };

    // 지도 클릭 시 팝업 폼의 좌표 및 팝업 핀 위치를 실시간으로 업데이트
    const handleMapClick = (_target: any, mouseEvent: kakao.maps.event.MouseEvent) => {
        // 👑 팝업창이 안 열렸거나, 상세보기 모드이거나, [저장 프로세스 진행 중(락)] 상태이면 절대 좌표를 바꾸지 못하게 막음
        if (!isPopupOpen || popupMode === 'detail' || isSaving) {
            return;
        }

        if (mapRef.current) {
            mapRef.current.relayout();
        }

        const latlng = mouseEvent.latLng;
        const clickedLatText = latlng.getLat().toFixed(7);
        const clickedLngText = latlng.getLng().toFixed(7);
        const nextPos = { lat: Number(clickedLatText), lng: Number(clickedLngText) };

        setCoordinatesText(`${clickedLatText} , ${clickedLngText}`);
        setExactCoords(nextPos);
        setPopupPosition(nextPos);
    };

    const optimizedPath = useMemo(() => {
        if (!outlineRes || !Array.isArray(outlineRes)) return [];
        const formattedPath = outlineRes
            .sort((a: any, b: any) => a.ord - b.ord)
            .map((item: any) => ({ lat: Number(item.ycrdn), lng: Number(item.xcrdn) }));
        return formattedPath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlineRes]);

    const getMapColors = (bzentyNm: string, isSelected: boolean) => {
        const isSwing = bzentyNm === '스윙(SWING)';
        if (isSelected) {
            return { strokeColor: "rgba(0, 246, 255, 0.7)", fillColor: "rgba(0, 246, 255, 0.3)", centerColor: "#00f6ff" };
        }
        return {
            strokeColor: isSwing ? "rgba(150, 0, 255, 0.5)" : "rgba(255, 0, 255, 0.4)",
            fillColor: isSwing ? "rgba(150, 0, 255, 0.2)" : "rgba(255, 0, 255, 0.2)",
            centerColor: isSwing ? "#9600ff" : "#ff00dc"
        };
    };

    const getPopupTitle = () => {
        if (popupMode === 'create') return '[등록]';
        if (popupMode === 'update') return '[수정]';
        return '[상세보기]';
    };

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR4200");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <div className="wrap point_wrap">
            {isLoading && <LoadingOverlay
                message={"데이터를 로딩중입니다.."}
            />}

            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isSubActive = pathname === item.path;
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link href={item.path}>{item.name}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <div className="subarticle">
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>
                    <ExcelDownload />
                </div>

                <div className="infoContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={pointGridRef}
                            data={gridData}
                            columns={pointGridColumns}
                            rowHeight={50}
                            enableRowSelection={true}
                            onSelectionChange={(rows: BatchPointResponse[]) => setCheckedRows(rows)}
                            globalCellClickEvent={handleRowClick}
                        />
                    </div>

                    <div className="point_map">
                        <div className="map" style={{ position: "relative", width: "100%", height: "100%" }} >
                            <Map
                                ref={mapRef}
                                center={mapCenter}
                                style={{ width: "100%", height: "100%" }}
                                level={3}
                                onClick={handleMapClick}
                            >
                                {isPopupOpen && (
                                    <CustomOverlayMap
                                        position={popupPosition}
                                        yAnchor={1.05}
                                        zIndex={10}
                                        clickable={true}
                                    >
                                        <div
                                            className="popup popup_point"
                                            style={{position: 'relative', margin: 0, transform: 'translateX(0%)'}}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h3>배치포인트 <span>{getPopupTitle()} [범위:50M]</span></h3>
                                            <button className="popupClose" onClick={handlePopupCancel}>닫기</button>
                                            <div className="popupconten">
                                                <table>
                                                    <tbody>
                                                    <tr>
                                                        <th>좌표</th>
                                                        <td>{coordinatesText}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>PM사</th>
                                                        <td>
                                                            <select
                                                                value={pmCompany}
                                                                onChange={(e) => setPmCompany(e.target.value)}
                                                                disabled={popupMode !== 'create'}
                                                            >
                                                                <option value="BZE-0000005">지쿠</option>
                                                                <option value="BZE-0000001">스윙</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>배치포인트명</th>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={pointName}
                                                                onChange={(e) => setPointName(e.target.value)}
                                                                placeholder={popupMode === 'detail' ? "" : "포인트명을 입력하세요"}
                                                                readOnly={popupMode === 'detail'}
                                                            />
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>

                                                <div className="btnSet">
                                                    {popupMode === 'detail' ? (
                                                        <button style={{visibility: 'hidden'}}
                                                                onClick={handlePopupCancel}>닫기</button>
                                                    ) : (
                                                        <>
                                                            <button onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePopupCancel();
                                                            }}>취소
                                                            </button>
                                                            <button className="red" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePopupSave();
                                                            }}>저장
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <img src="/assets/style_admin/images/popup_arrow.png" className="poparrow"
                                                 alt="화살표"/>
                                        </div>
                                    </CustomOverlayMap>
                                )}

                                {gridData.map((item: BatchPointResponse) => {
                                    if (!item.ycrdn || !item.xcrdn) return null;

                                    const centerLatLng = { lat: Number(item.ycrdn), lng: Number(item.xcrdn) };
                                    const isSelected = selectedRow?.btchZoneId === item.btchZoneId;
                                    const colors = getMapColors(item.bzentyNm, isSelected);

                                    return (
                                        <React.Fragment key={item.btchZoneId}>
                                            <Circle
                                                center={centerLatLng}
                                                radius={25}
                                                strokeWeight={1}
                                                strokeColor={colors.strokeColor}
                                                strokeOpacity={0.8}
                                                strokeStyle={"solid"}
                                                fillColor={colors.fillColor}
                                                fillOpacity={0.5}
                                                onClick={() => handleCircleClick(item)}
                                            />
                                            <Circle
                                                center={centerLatLng}
                                                radius={2}
                                                strokeWeight={1}
                                                strokeColor={colors.centerColor}
                                                strokeOpacity={1}
                                                fillColor={colors.centerColor}
                                                fillOpacity={1}
                                                onClick={() => handleCircleClick(item)}
                                            />
                                        </React.Fragment>
                                    );
                                })}
                                {optimizedPath.length > 0 && <CityOutline path={optimizedPath}/>}
                            </Map>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}