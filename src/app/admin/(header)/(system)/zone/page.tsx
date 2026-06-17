"use client";

import React, {useState, useEffect, useMemo, useRef, useCallback, useContext} from 'react';
import { usePathname } from 'next/navigation';
import Link from "next/link";

// 라온텍 그리드 라이브러리 및 API 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import {
    getSystemHierarchyApi,
    createSareaApi,
    updateSareaApi,
    deleteSareaApi
} from "@/services/system/systemApi";

import LoadingOverlay from "@/components/LoadingOverlay";
import { registerMenuLog } from "@/services/common/commonApi";
import { ExpandableCell } from "@/utils/commGrid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {useDrag} from "@/hooks/userDrag";

// 트리 구조 인터페이스 정의
export interface ZoneHierarchyResponse {
    zoneNo: string | number;       // 권역번호 (sareaId)
    parentZoneNm: string;          // 상위권역(읍·면·동) 명칭
    childZoneNm: string;           // 하위권역(동·리) 명칭
    parentCode?: string;           // 부모의 sareaId
    isParent?: boolean;            // 트리 부모 여부
    subRows?: ZoneHierarchyResponse[];
}

export default function ZonePage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [gridData, setGridData] = useState<ZoneHierarchyResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<ZoneHierarchyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 셀렉트 박스용 상위권역 목록
    const [parentOptions, setParentOptions] = useState<{ id: string; name: string }[]>([]);

    // 팝업 상태 및 입력 필드
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMode, setPopupMode] = useState<'create' | 'update'>('create');
    const [selectedParentCode, setSelectedParentCode] = useState('');
    const [inputChildZoneId, setInputChildZoneId] = useState('');     // 💡 하위권역 ID 상태 분리
    const [inputChildZoneName, setInputChildZoneName] = useState(''); // 💡 하위권역 명칭 상태 분리

    const zoneGridRef = useRef<RaontecGridHandle>(null);
    const { setGrid, setFileName }: any = useContext(ExcelContext);

    const { position, handleMouseDown, isDragging } = useDrag(isPopupOpen); // 팝업 드래그

    // 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '공통코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 컬럼 정의
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
    useEffect(() => {
        if (zoneGridRef.current) {
            setGrid(zoneGridRef.current);
            setFileName("권역관리");
        }
    }, [gridData, setGrid, setFileName]);

    // 2. 백엔드 계층 트리 데이터 패칭 및 조립
    const fetchHierarchyZones = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getSystemHierarchyApi();

            const finalTreeData: ZoneHierarchyResponse[] = [];
            const parents: { id: string; name: string }[] = [];
            const parentMap = new Map<string, string>();

            if (Array.isArray(res)) {
                res.forEach((item: any) => {
                    if (!item.upSarea || !item.upSarea.sareaId) {
                        parentMap.set(String(item.sareaId), item.sareaNm);
                        parents.push({ id: String(item.sareaId), name: item.sareaNm });
                    }
                });
                setParentOptions(parents);

                parentMap.forEach((parentName, parentId) => {
                    const childrenRows: ZoneHierarchyResponse[] = res
                        .filter((item: any) => item.upSarea && String(item.upSarea.sareaId) === parentId)
                        .map((item: any) => ({
                            zoneNo: item.sareaId,
                            parentZoneNm: parentName,
                            childZoneNm: item.sareaNm,
                            parentCode: String(item.upSarea.sareaId)
                        }));

                    const parentNode: ZoneHierarchyResponse = {
                        zoneNo: parentId,
                        parentZoneNm: parentName,
                        childZoneNm: "-",
                        parentCode: undefined,
                        isParent: true,
                    };

                    if (childrenRows.length > 0) {
                        parentNode.subRows = childrenRows;
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

    // 검색 필터링
    const filteredGridData = useMemo(() => {
        if (!searchKeyword) return gridData;
        return gridData.filter(item =>
            item.parentZoneNm.includes(searchKeyword) ||
            String(item.zoneNo).includes(searchKeyword) ||
            (item.subRows && item.subRows.some(child => child.childZoneNm.includes(searchKeyword)))
        );
    }, [gridData, searchKeyword]);

    const handleCreate = () => {
        setPopupMode('create');
        setSelectedParentCode('');
        setInputChildZoneId('');
        setInputChildZoneName('');
        setIsPopupOpen(true);
    };

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

        if (target.isParent) {
            alert("상위권역(부모 노드)은 하위 구역 수정 팝업을 통해 관리합니다.");
            return;
        }

        setPopupMode('update');
        setSelectedParentCode(target.parentCode || '');
        setInputChildZoneId(String(target.zoneNo));       // 💡 기존 ID 세팅
        setInputChildZoneName(target.childZoneNm || '');  // 💡 기존 명칭 세팅
        setIsPopupOpen(true);
    };

    // 실제 삭제 API 연동
    const handleDelete = async () => {
        if (checkedRows.length <= 0) {
            alert("삭제할 대상을 체크박스에서 선택해 주세요.");
            return;
        }

        const targetRows = checkedRows.filter(item => !item.isParent);

        if (targetRows.length <= 0) {
            alert("선택된 하위 권역 데이터가 없습니다. (상위 권역은 단독으로 삭제할 수 없습니다.)");
            return;
        }

        if (window.confirm(`선택한 항목 중 상위 권역을 제외한 ${targetRows.length}개의 하위 권역 데이터를 삭제하시겠습니까?`)) {
            try {
                setIsLoading(true);

                // 필터링된 하위 노드들만 순회하며 삭제 API 호출
                for (const item of targetRows) {
                    await deleteSareaApi({
                        upSareaId: item.parentCode || 0,
                        sareaId: item.zoneNo
                    });
                }

                alert("성공적으로 삭제되었습니다.");
                fetchHierarchyZones(); // 트리 데이터 갱신
            } catch (error) {
                console.error("삭제 실패:", error);
                alert("삭제 처리 중 에러가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 실제 등록 및 수정 API 연동 구현부
    const handlePopupSave = async () => {
        if (!selectedParentCode) {
            alert("상위권역(읍·면·동)을 선택해 주세요.");
            return;
        }

        const childZoneIdTrimmed = inputChildZoneId.trim();
        const childZoneNameTrimmed = inputChildZoneName.trim();

        if (!childZoneIdTrimmed) {
            alert("하위권역(동·리) ID를 입력해 주세요.");
            return;
        }

        if (!/^\d+$/.test(childZoneIdTrimmed)) {
            alert("하위권역(동·리) ID는 숫자로만 입력해 주세요.");
            return;
        }

        if (childZoneIdTrimmed.length > 10) {
            alert("하위권역(동·리) ID는 최대 10자까지만 입력 가능합니다.");
            return;
        }

        // 하위권역 명칭 유효성 검사 추가
        if (!childZoneNameTrimmed) {
            alert("하위권역(동·리) 명칭을 입력해 주세요.");
            return;
        }

        try {
            setIsLoading(true);

            if (popupMode === 'update') {
                // [API 수정 호출] 명세 규칙 연동 및 입력한 한글 명칭 반영
                await updateSareaApi({
                    sareaId: Number(childZoneIdTrimmed),
                    upSareaId: Number(selectedParentCode),
                    sareaNm: childZoneNameTrimmed,
                    sareaTypeCd: "SRTY01"
                });
                alert("권역 정보가 정상적으로 수정되었습니다.");
            } else {
                // [API 등록 호출] 명세 규칙 연동 및 입력한 한글 명칭 반영
                await createSareaApi({
                    upSareaId: Number(selectedParentCode),
                    sareaId: Number(childZoneIdTrimmed),
                    sareaNm: childZoneNameTrimmed
                });
                alert("새로운 권역이 등록되었습니다.");
            }

            setIsPopupOpen(false);
            fetchHierarchyZones();
        } catch (error) {
            console.error("저장 실패:", error);
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
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPopupOpen && e.key === 'Escape') {
                setIsPopupOpen(false); // 컴포넌트 자체 팝업 오프 플래그 연동
            }
        };

        if (isPopupOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPopupOpen]); // 의존성 배열에 현재 컴포넌트 팝업 상태 바인딩

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
                    <ExcelDownload />
                </div>

                {/* 그리드 컨테이너 */}
                <div className="infoContent">
                    <div className="gridbox treegrid">
                        <RaontecTanstackGrid
                            ref={zoneGridRef}
                            data={filteredGridData}
                            columns={zoneGridColumns}
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
                        <div className="popup popup_zone"

                             style={{  // 팝업 드래그
                                 transform: `translate(${position.x}px, ${position.y}px)`,
                                 transition: isDragging ? 'none' : 'transform 0.1s ease'
                             }}
                        >
                            <h3   // 팝업 드래그
                                onMouseDown={handleMouseDown}
                                style={{cursor: 'move', userSelect: 'none'}}
                            >권역 <span>{popupMode === 'create' ? '[등록]' : '[수정]'}</span></h3>
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
                                            disabled={popupMode === 'update'}
                                        >
                                            <option value="">선택</option>
                                            {parentOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th>하위권역(동·리) ID</th>
                                    <td>
                                        <input
                                            type="text"
                                            value={inputChildZoneId}
                                            onChange={(e) => setInputChildZoneId(e.target.value)}
                                            placeholder="숫자 입력 최대 10자"
                                            // disabled={popupMode === 'update'}
                                            maxLength={10}
                                        />
                                    </td>
                                </tr>
                                {/* 💡 하위권역 명칭(sareaNm)을 입력받을 수 있는 행 추가 */}
                                <tr>
                                    <th>하위권역(동·리) 명칭</th>
                                    <td>
                                        <input
                                            type="text"
                                            value={inputChildZoneName}
                                            onChange={(e) => setInputChildZoneName(e.target.value)}
                                            placeholder="예: 초월읍 대쌍령리"
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
)
;
}