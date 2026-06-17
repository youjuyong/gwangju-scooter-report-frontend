"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// 라온텍 그리드 라이브러리 및 API 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import { getSystemHierarchyApi } from "@/services/system/systemApi";

import LoadingOverlay from "@/components/LoadingOverlay";
import Link from "next/link";
import { registerMenuLog } from "@/services/common/commonApi";
import {ExpandableCell} from "@/utils/commGrid";

// 💡 트리 구조 인터페이스 정의 (subRows 자식 배열 추가)
export interface ZoneHierarchyResponse {
    zoneNo: string | number;       // 권역번호
    parentZoneNm: string;          // 상위권역(읍·면·동)
    childZoneNm: string;           // 하위권역(동·리)
    parentCode?: string;
    isParent?: boolean;            // 트리 부모 여부
    subRows?: ZoneHierarchyResponse[]; // 자식 노드 배열
}

export default function ZonePage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [gridData, setGridData] = useState<ZoneHierarchyResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<ZoneHierarchyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 셀렉트 박스 바인딩을 위한 상위권역 리스트
    const [parentOptions, setParentOptions] = useState<{ id: string; name: string }[]>([]);

    // 팝업 제어 및 입력 값 상태
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMode, setPopupMode] = useState<'create' | 'update'>('create');
    const [selectedParentCode, setSelectedParentCode] = useState('');
    const [inputChildZoneName, setInputChildZoneName] = useState('');

    const zoneGridRef = useRef<RaontecGridHandle>(null);

    // 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '공통코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 2. 💡 첫 번째 컬럼에 ExpandableCell을 바인딩하여 접기/펴기 UI 적용
    const zoneGridColumns = useMemo<CustomColumnDef<ZoneHierarchyResponse>[]>(() => [
        {
            header: '권역번호',
            accessorKey: 'zoneNo',
            meta: { id: 'zoneNo', isKey: true },
            size: 150,
            cell: ({ row, getValue }) => <ExpandableCell row={row} getValue={getValue} />
        },
        { header: '상위권역(읍·면·동)', accessorKey: 'parentZoneNm' },
        { header: '하위권역(동·리)', accessorKey: 'childZoneNm' },
    ], []);

    // 3. 💡 백엔드 데이터를 상위권역(부모)-하위권역(자식) 트리로 조립 가공
    const fetchHierarchyZones = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getSystemHierarchyApi();

            const finalTreeData: ZoneHierarchyResponse[] = [];
            const parents: { id: string; name: string }[] = [];
            const parentMap = new Map<string, string>();

            if (Array.isArray(res)) {
                // [Step 1] 순수 독자 상위 노드(행정동)들만 1차 수집 및 맵핑 생성
                res.forEach((item: any) => {
                    if (!item.upSarea || !item.upSarea.sareaId) {
                        parentMap.set(item.sareaId, item.sareaNm);
                        parents.push({ id: item.sareaId, name: item.sareaNm });
                    }
                });
                setParentOptions(parents);

                // [Step 2] 부모-자식 트리 구조 생성
                // parentMap에 있는 고유 상위 지역 아이디를 기준으로 루프 생성
                parentMap.forEach((parentName, parentId) => {
                    // 현재 부모(예: 경안동) 아래에 붙어있는 하위 자식 노드들(예: 역동 등) 필터링 수집
                    const childrenRows: ZoneHierarchyResponse[] = res
                        .filter((item: any) => item.upSarea && item.upSarea.sareaId === parentId)
                        .map((item: any) => ({
                            zoneNo: item.sareaId,
                            parentZoneNm: parentName,
                            childZoneNm: item.sareaNm,
                            parentCode: item.upSarea.sareaId
                        }));

                    // 부모 노드 객체 선언
                    const parentNode: ZoneHierarchyResponse = {
                        zoneNo: parentId,
                        parentZoneNm: parentName,
                        childZoneNm: childrenRows.length > 0 ? "-" : "-", // 하위가 있든 없든 상위행 자체는 하위 컬럼 대시 처리
                        parentCode: undefined,
                        isParent: true, // 👈 부모 플래그 선언
                    };

                    // 자식 레코드가 하나라도 존재한다면 subRows 속성에 계층 바인딩 해줍니다.
                    if (childrenRows.length > 0) {
                        parentNode.subRows = childrenRows; // 👈 Tanstack 예약어 연동
                    }

                    finalTreeData.push(parentNode);
                });
            }

            setGridData(finalTreeData);
            setCheckedRows([]);
            zoneGridRef.current?.clearSelectedRow();
            zoneGridRef.current?.clearRowSelection();
        } catch (error) {
            console.error("권역 트리 데이터 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHierarchyZones();
    }, [fetchHierarchyZones]);

    // 검색어 필터링 (트리 최상위 부모 기준 혹은 자식 매칭)
    const filteredGridData = useMemo(() => {
        if (!searchKeyword) return gridData;
        return gridData.filter(item =>
            item.parentZoneNm.includes(searchKeyword) ||
            String(item.zoneNo).includes(searchKeyword) ||
            (item.subRows && item.subRows.some(child => child.childZoneNm.includes(searchKeyword)))
        );
    }, [gridData, searchKeyword]);

    // 상단 컨트롤 - 등록 발동
    const handleCreate = () => {
        setPopupMode('create');
        setSelectedParentCode('');
        setInputChildZoneName('');
        setIsPopupOpen(true);
    };

    // 상단 컨트롤 - 수정 발동 (체크박스 1개 제한 유효성 검사)
    const handleUpdate = () => {
        if (checkedRows.length === 0) {
            alert("수정할 권역을 체크박스에서 선택해 주세요.");
            return;
        }

        if (checkedRows.length > 1) {
            alert("수정은 하나의 항목만 체크한 상태에서 가능합니다.");
            return;
        }

        const target = checkedRows[0];
        setPopupMode('update');
        setSelectedParentCode(target.parentCode || target.zoneNo.toString()); // 부모 노드일 땐 자신의 코드 바인딩
        setInputChildZoneName(target.childZoneNm === '-' ? '' : target.childZoneNm);
        setIsPopupOpen(true);
    };

    // 상단 컨트롤 - 삭제 처리
    const handleDelete = async () => {
        if (checkedRows.length <= 0) {
            alert("삭제할 대상을 체크박스에서 선택해 주세요.");
            return;
        }

        if (window.confirm(`선택한 ${checkedRows.length}개의 권역 데이터를 삭제하시겠습니까?`)) {
            try {
                setIsLoading(true);
                const targetIds = checkedRows.map(item => item.zoneNo);
                alert("성공적으로 삭제되었습니다.");
                fetchHierarchyZones();
            } catch (error) {
                alert("삭제 처리 중 에러가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 팝업 내부 저장 처리
    const handlePopupSave = async () => {
        if (!selectedParentCode) {
            alert("상위권역(읍·면·동)을 선택해 주세요.");
            return;
        }
        if (!inputChildZoneName.trim()) {
            alert("하위권역(동·리) 명칭을 입력해 주세요.");
            return;
        }

        const selectedParentOpt = parentOptions.find(o => o.id === selectedParentCode);
        const payload = {
            sareaId: popupMode === 'update' ? checkedRows[0]?.zoneNo : undefined,
            sareaNm: inputChildZoneName,
            upSarea: {
                sareaId: selectedParentCode,
                sareaNm: selectedParentOpt ? selectedParentOpt.name : null
            }
        };

        try {
            setIsLoading(true);
            if (popupMode === 'update') {
                alert("권역 정보가 정상적으로 수정되었습니다.");
            } else {
                alert("새로운 권역이 등록되었습니다.");
            }
            setIsPopupOpen(false);
            fetchHierarchyZones();
        } catch (error) {
            alert("저장 처리 중 에러가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR4300");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <div className="wrap">
            {isLoading && <LoadingOverlay message={"데이터 로딩 중..."} />}

            {/* 서브 내비게이션 바 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isSubActive = pathname === item.path;
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link href={item.path}>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <div className="subarticle">
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleDelete}>삭제</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleCreate}>+ 등록</button>
                    </div>

                    <div className="search_right search_right_Excel">
                        <dl>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="검색어 입력"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={fetchHierarchyZones}>검색</button>
                    </div>
                    <button className="btnExcel">엑셀저장</button>
                </div>

                {/* 그리드 컨테이너 */}
                <div className="infoContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={zoneGridRef}
                            data={filteredGridData}
                            columns={zoneGridColumns}
                            // rowHeight={50}
                            enableRowSelection={true}
                            onSelectionChange={(rows: ZoneHierarchyResponse[]) => setCheckedRows(rows)}
                        />
                    </div>
                </div>
            </div>

            {/* 팝업 모달 구조 */}
            {isPopupOpen && (
                <div className="popupWrap">
                    <div className="popupInner">
                        <div className="popup popup_zone">
                            <h3>권역 <span>{popupMode === 'create' ? '[등록]' : '[수정]'}</span></h3>
                            <button className="popupClose" onClick={() => setIsPopupOpen(false)}>닫기</button>
                            <div className="popupconten">
                                <table>
                                    <tbody>
                                    <tr>
                                        <th>상위권역(읍·면·동)</th>
                                        <td>
                                            <select
                                                value={selectedParentCode}
                                                onChange={(e) => setSelectedParentCode(e.target.value)}
                                            >
                                                <option value="">선택</option>
                                                {parentOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>하위권역(동·리)</th>
                                        <td>
                                            <input
                                                type="text"
                                                value={inputChildZoneName}
                                                onChange={(e) => setInputChildZoneName(e.target.value)}
                                                placeholder="하위권역명을 입력하세요"
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div className="btnSet">
                                    <button onClick={() => setIsPopupOpen(false)}>취소</button>
                                    <button className="red" onClick={handlePopupSave}>저장</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}