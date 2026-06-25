"use client";

import React, {useState, useMemo, useRef, useEffect, useContext} from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import {
    createCodeDetailApi,
    deleteCodeDetailApi,
    getActiveCodeListApi,
    updateCodeDetailApi
} from "@/services/system/systemApi";
import {registerMenuLog} from "@/services/common/commonApi";
import {useDrag} from "@/hooks/userDrag";
import LoadingOverlay from "@/components/LoadingOverlay";
import {validateFields} from "@/utils/validation";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {useAlert} from "@/components/popup/PopupProvider";

// 1. 데이터 인터페이스 정의
export interface codeResponse {
    clsfCd: string;     // 분류 코드 (예: ALTY, AVST, BZTY)
    clsfCdNm: string;   // 분류 코드명 (예: 알람 유형, 승인 상태)
    cdId: string;       // 코드 ID (예: ALTY01, AVST01)
    cdNm: string;       // 코드명 (예: 승인제, 승인, PM 운영사)
    sortSeq: number;    // 정렬 순서
    regDt : string;
    cdUseYn : string;   // 사용 여부
}



export default function ZoneCodePage() {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);

    // 서브 내비게이션 아이템 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: '/admin/pm' },
        { id: 'point', name: '배치포인트관리', path: '/admin/point' },
        { id: 'zone', name: '권역관리', path: '/admin/zone' },
        { id: 'code', name: '공통코드관리', path: '/admin/code' },
        { id: 'setting', name: '운영설정관리', path: '/admin/seting' },
    ];
    const showAlert = useAlert();
    // API에서 가져올 실제 공통 코드 상태 관리
    const [gridData, setGridData] = useState<codeResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<codeResponse[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');

    // 팝업 상태 및 입력 필드 제어
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMode, setPopupMode] = useState<'create' | 'update'>('create');

    const [inputClsfCd, setInputClsfCd] = useState('');
    const [inputCdId, setInputCdId] = useState('');
    const [inputCdNm, setInputCdNm] = useState('');
    const [originCdId, setOriginCdId] = useState('');
    const zoneGridRef = useRef<RaontecGridHandle>(null);
    const { setGrid, setFileName }: any = useContext(ExcelContext);
    const { position, handleMouseDown, isDragging } = useDrag(isPopupOpen); // 팝업 드래그

    // [추가] 고유한 분류코드(clsfCd) 목록 추출 (Select 박스용)
    const uniqueClsfCodes = useMemo(() => {
        const uniqueMap = new Map<string, string>();
        gridData.forEach(item => {
            if (!uniqueMap.has(item.clsfCd)) {
                uniqueMap.set(item.clsfCd, item.clsfCdNm);
            }
        });
        return Array.from(uniqueMap.entries()).map(([clsfCd, clsfCdNm]) => ({
            clsfCd,
            clsfCdNm
        }));
    }, [gridData]);

    // [추가] 선택된 분류코드(inputClsfCd) 내에서 가장 큰 sortSeq 값 + 1 자동 계산
    const nextSortSeq = useMemo(() => {
        if (!inputClsfCd) return 1;
        const sameClassCodes = gridData.filter(item => item.clsfCd === inputClsfCd);
        if (sameClassCodes.length === 0) return 1;

        const maxSortSeq = Math.max(...sameClassCodes.map(item => item.sortSeq || 0));
        return maxSortSeq + 1;
    }, [gridData, inputClsfCd]);

    // 전체 활성 공통코드 조회 API 호출 (초기 로드)
    const fetchCodeList = async () => {
        setIsLoading(true);
        try {
            const data = await getActiveCodeListApi();
            setGridData(data || []);
        } catch (error) {
            console.error("코드 목록 조회 실패:", error);
            alert("데이터를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (zoneGridRef.current) {
            setGrid(zoneGridRef.current);
            setFileName("코드관리 ");
        }
    }, [gridData, setGrid, setFileName]);

    useEffect(() => {
        fetchCodeList();
    }, []);

    // 그리드 컬럼 설정
    const zoneGridColumns = useMemo<CustomColumnDef<codeResponse>[]>(() => [
        { header: '분류코드', accessorKey: 'clsfCd', meta: { id: 'clsfCd' } },
        { header: '분류코드명', accessorKey: 'clsfCdNm' },
        { header: '코드ID', accessorKey: 'cdId', meta: { id: 'cdId', isKey: true } },
        { header: '코드명', accessorKey: 'cdNm' },
        { header: '정렬순서', accessorKey: 'sortSeq',enableColumnFilter: false, },
        { header: '등록일자', accessorKey: 'regDt',enableColumnFilter: false, },
        { header: '사용여부', accessorKey: 'cdUseYn' },
    ], []);

    // 검색어 필터링
    const filteredGridData = useMemo(() => {
        if (!appliedKeyword) return gridData;
        return gridData.filter(item =>
            item.clsfCd.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
            item.clsfCdNm.includes(appliedKeyword) ||
            item.cdNm.includes(appliedKeyword)
        );
    }, [gridData, appliedKeyword]);

    const handleSearch = () => {
        setAppliedKeyword(searchKeyword);
    };

    // 등록 팝업 오픈
    const handleCreateOpen = () => {
        setPopupMode('create');
        // 첫 번째 분류코드를 기본 선택값으로 지정 (목록이 존재할 때)
        setInputClsfCd(uniqueClsfCodes[0]?.clsfCd || '');
        setInputCdId('');
        setInputCdNm('');
        setIsPopupOpen(true);
    };

    // 수정 팝업 오픈
    const handleUpdateOpen = () => {
        if (checkedRows.length === 0) {
            alert("수정할 코드를 체크박스에서 선택해 주세요.");
            return;
        }
        if (checkedRows.length > 1) {
            alert("수정은 하나의 항목만 체크한 상태에서 가능합니다.");
            return;
        }

        const target = checkedRows[0];
        setPopupMode('update');
        setInputClsfCd(target.clsfCd);
        setOriginCdId(target.cdId);
        setInputCdId(target.cdId);
        setInputCdNm(target.cdNm);
        setIsPopupOpen(true);
    };

    // API 기반 삭제 처리
    const handleDelete = async () => {
        if (checkedRows.length === 0) {
            showAlert("삭제할 대상을 체크박스에서 선택해 주세요.");
            return;
        }

        if (window.confirm(`선택한 ${checkedRows.length}개의 코드를 삭제하시겠습니까?`)) {
            setIsLoading(true);
            try {
                for (const row of checkedRows) {
                    await deleteCodeDetailApi(row.clsfCd, row.cdId);
                }
                alert("삭제되었습니다.");
                await fetchCodeList();
                clearSelection();
            } catch (error) {
                console.error("삭제 실패:", error);
                alert("삭제 처리 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // API 기반 등록/수정 저장 처리
    const handlePopupSave = async () => {
        if (!inputClsfCd.trim() || !inputCdId.trim() || !inputCdNm.trim()) {
            alert("분류코드, 코드ID, 코드명은 필수 입력 항목입니다.");
            return;
        }

        const codeIdResult = validateFields.codeId(inputCdId.trim());
        if (codeIdResult !== true) {
            alert(codeIdResult);
            return;
        }


        setIsLoading(true);
        try {
            if (popupMode === 'create') {
                // 등록 POST API 호출
                await createCodeDetailApi(inputClsfCd.trim(), {
                    cdId: inputCdId.trim(),
                    cdNm: inputCdNm.trim(),
                    sortSeq: nextSortSeq
                });
                alert("등록되었습니다.");
            } else {
                // 수정 PUT API 호출
                await updateCodeDetailApi(inputClsfCd.trim(), originCdId.trim(), {
                    newCdId: inputCdId.trim(),
                    cdNm: inputCdNm.trim(),
                });
                alert("수정되었습니다.");
            }

            setIsPopupOpen(false);
            await fetchCodeList();
            clearSelection();
        } catch (error : any) {
            console.error("저장 실패:", error);
            if (error.response && error.response.data && error.response.data.resultMsg) {
                alert(error.response.data.resultMsg);
            } else {
                alert("저장 처리 중 오류가 발생했습니다.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSelection = () => {
        setCheckedRows([]);
        zoneGridRef.current?.clearSelectedRow();
        zoneGridRef.current?.clearRowSelection();
    };
    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR4400");
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
    }, [isPopupOpen]);

    return (
        <div className="wrap">
            {isLoading && <LoadingOverlay message={"데이터를 처리 중입니다..."} />}

            {/* 서브 내비게이션 바 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isSubActive = pathname === item.path || (item.id === 'code');
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link href={item.path}>{item.name}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="subarticle">
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreateOpen}>+ 등록</button>
                        <button onClick={handleUpdateOpen}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    <div className="search_right search_right_Excel">
                        <dl>
                            <dt>검색어</dt>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="분류코드 / 코드명 입력"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>

                    <ExcelDownload />
                </div>

                {/* 그리드박스 구역 */}
                <div className="infoContent">
                    <div className="gridbox" >
                        <RaontecTanstackGrid
                            ref={zoneGridRef}
                            data={filteredGridData}
                            columns={zoneGridColumns}
                            rowHeight={45}
                            enableRowSelection={true}
                            onSelectionChange={(rows: codeResponse[]) => setCheckedRows(rows)}
                        />
                    </div>
                </div>
            </div>

            {/* 등록 및 수정 팝업 모달 */}
            {isPopupOpen && (
                <div className="popupWrap">
                    <div className="popupInner">
                        <div className="popup popup_code"
                             style={{  // 팝업 드래그
                                 transform: `translate(${position.x}px, ${position.y}px)`,
                                 transition: isDragging ? 'none' : 'transform 0.1s ease'
                             }}>
                            <h3   // 팝업 드래그
                                onMouseDown={handleMouseDown}
                                style={{cursor: 'move', userSelect: 'none'}}
                            >공통코드 {popupMode === 'create' ? '등록' : '수정'}</h3>
                            <button className="popupClose" onClick={() => setIsPopupOpen(false)}>닫기</button>
                            <div className="popupconten">
                                <table>
                                    <tbody>
                                    <tr>
                                        <th>분류코드</th>
                                        <td>
                                            {popupMode === 'create' ? (
                                                /* 등록 모드일 때 select 박스로 표출 */
                                                <select
                                                    value={inputClsfCd}
                                                    onChange={(e) => setInputClsfCd(e.target.value)}
                                                    // style={{ width: '100%', padding: '4px 8px' }}
                                                >
                                                    {uniqueClsfCodes.map(code => (
                                                        <option key={code.clsfCd} value={code.clsfCd}>
                                                            {code.clsfCd} ({code.clsfCdNm})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                /* 수정 모드일 때 기존처럼 인풋창 비활성화 */
                                                <input
                                                    type="text"
                                                    value={inputClsfCd}
                                                    disabled
                                                />
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>코드ID</th>
                                        <td>
                                            <input
                                                type="text"
                                                value={inputCdId}
                                                onChange={(e) => setInputCdId(e.target.value)}
                                               // disabled={popupMode === 'update'}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>코드명</th>
                                        <td>
                                            <input type="text" value={inputCdNm} onChange={(e) => setInputCdNm(e.target.value)} />
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