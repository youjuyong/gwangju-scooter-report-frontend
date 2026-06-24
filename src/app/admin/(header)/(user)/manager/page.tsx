"use client";

import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {validateFields} from "@/utils/validation";
import {ExcelContext} from "@/components/admin/ExcelContext";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {registerMenuLog} from "@/services/common/commonApi";
import ManagerPopup from "@/components/admin/popup/ManagerPopup";
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import {AdminReportResponse, UserConnHistroyForm, UserConntHistoryResponse} from "@/types/adminReport";
import {ManagerListResponse, UserListResponse} from "@/types/managment";
import {UserConntHistoryListApi} from "@/services/report/adminReportApi";
import api from "@/services/api";
import {useAlert} from "@/components/popup/PopupProvider";


export default function ManagerPage() {
    const pathname = usePathname();
    const userRole = "admin";
    //그리드
    const [gridData, setGridData] = useState<ManagerListResponse[]>([]);
    const gridRef = useRef<RaontecGridHandle>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedGridtId, setSelectedGridId] = useState<string >('');
    const [selectedGrid, setSelectedGrid] = useState<ManagerListResponse | null>(null); // 단일 행 클릭 데이터 State
    //팝업 모드 관리
    const [popupMode, setPopupMode] = useState<'CREATE' | 'UPDATE'>('CREATE');
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);
    const [excelGridData,setExcelGridData] = useState<ManagerListResponse[]>([]);
    const excelGridRef = useRef<RaontecGridHandle>(null);

    const [keyword, setKeyword] = useState('');
    const [userId, setUserId] = useState('');

    const keywordRef = useRef(keyword);
    useEffect(() => {
        keywordRef.current = keyword;
    }, [keyword]);
    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'member', name: '일반회원관리', path: `/${userRole}/member` },
        { id: 'manager', name: '관리자관리', path: `/${userRole}/manager` },
        { id: 'history', name: '시스템사용이력', path: `/${userRole}/history` },
        { id: 'connection', name: '시스템접속이력', path: `/${userRole}/connection` },
    ];

    const gridColumns = useMemo<CustomColumnDef<ManagerListResponse>[]>(() => [
        {
            header : '관리자 아이디',
            accessorKey : 'userId',
            meta: { id: 'userId', isKey: true }, // 고유 Key(PK) 설정
        }
        ,
        {
            header: '관리자 이름',
            accessorKey: 'userNm',
            meta: { filterType: "check" },

        },
        {
            header: '이메일 주소',
            accessorKey: 'emlAddr',
            meta: { filterType: "check" },
        },
        {
            header: '연락처',
            accessorKey: 'telno',
            meta: { filterType: "check" },
        },
        {
            header: '부서',
            accessorKey: 'deptNm',
            meta: { filterType: "check" },
        },
        {
            header: '종류',
            accessorKey: 'deptTypeNm',
            meta: { filterType: "check" },
        },
        {
            header: '상태',
            accessorKey: 'sttsNm',
            meta: { filterType: "check" },
        },
        {
            header: '등록 날짜',
            accessorKey: 'regDate',
            meta: { filterType: "check" },
        },
        {
            header: '로그인 날짜',
            accessorKey: 'lgnDate',
            meta: { filterType: "check" },
        },

    ], []);

    const fetchData = useCallback(async  (searchKeyword?: string) => {
        const currentKeyword = searchKeyword !== undefined ? searchKeyword : keywordRef.current;
        try {
            const response = await api.get(`/admin/user`, {
                params: {
                    keyword: currentKeyword
                }
            });
            // 데이터 상태 세팅 (안전)
            setTimeout(() => {
                setGridData(response.data || []);
            }, 0);
        } catch (error) {

            console.error(error);
        }
    }, []);

    // 3. 버튼 이벤트 핸들러 정의
    const handleCreate = () => {
        setPopupMode('CREATE');
        setSelectedGrid(null); // 등록일 때는 데이터 비우기
        setIsDetailOpen(true);
        gridRef.current?.clearSelectedRow();
    };

    const handleUpdate = (rowData: any)  => {
        if(selectedGrid == null ) {
            alert("수정할 항목을 선택해 주세요.");
            return;
        }
        setPopupMode('UPDATE');
        setIsDetailOpen(true);
    };

    const handleDelete = () => {
        console.log(selectedGridtId);
        if(selectedGrid == null ) {
            alert("삭제할 항목을 선택해 주세요.");
            return;
        }
        const confirmMessage = `선택하신 회원을 정말로 삭제하시겠습니까?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        // try {
        //     const response = await api.delete(`/dclr/user/${dclUserId}`, {
        //     });
        //
        //     if (response.status === 200 || response.data === true) {
        //         alert("성공적으로 삭제되었습니다.");
        //         fetchData();
        //         fetchUserAllList();  //보이지 않는 엑셀용 전체 데이터도 백엔드에서 새로고침
        //     }
        // } catch (error) {
        //     console.error("회원 데이터 삭제 실패:", error);
        // } finally {
        //
        // }
    };

    const handleSearch = () => {
        keywordRef.current = keyword; // 즉시 업데이트 보장
        fetchData();
    };

    const handleExcelDownload = () => {
        console.log('관리자목록 엑셀 다운로드 실행');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const onClickReportRow=(rowData:any)=>{
        //그리드 선택 초기화
        setSelectedGridId('');
        setSelectedGrid(null);
        if (selectedGrid && selectedGrid.userId === rowData.userId) {
            return;
        }
        setSelectedGridId(rowData.userId);
        setSelectedGrid(rowData);
    }
    useEffect(() => {
        fetchData();
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR5200");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <div className="wrap">
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소가 설정된 메뉴의 path와 일치하면 'click' 클래스 부여
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

            {/* 오른쪽 서브 아티클 (기능 버튼, 검색창 및 그리드) 영역 */}
            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">

                    {/* 관리자 제어용 등록 / 수정 / 삭제 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    {/* 우측 검색어 필터 구역 */}
                    <div className="search_right search_right_Excel">
                        <dl>
                            <dt>검색어</dt>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="검색어 입력"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>

                    <button className="btnExcel" onClick={handleExcelDownload}>엑셀저장</button>
                </div>

                {/* 데이터 그리드 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={gridRef}
                            data={gridData}
                            columns={gridColumns}
                            globalCellClickEvent={onClickReportRow}
                        />
                    </div>
                </div>
            </div>
            {isDetailOpen  && (
                <ManagerPopup
                    data={selectedGrid}
                    onClose={() => {
                        setIsDetailOpen(false);
                  //      setSelectedGridId('');
                  //      setSelectedGrid(null);
                    }}
                    isOpen={isDetailOpen}
                    mode={popupMode}
                    onRefreshList={fetchData}
                />
            )}
        </div>
    );
}