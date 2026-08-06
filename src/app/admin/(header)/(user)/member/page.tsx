"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState,useContext} from 'react';
import Link from 'next/link';
import api from "@/services/api";
import { usePathname } from 'next/navigation';
import {UserListResponse} from "@/types/managment";
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {registerMenuLog} from "@/services/common/commonApi";

export default function MemberPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 페이징 관련 상태 관리
    const [page, setPage] = useState(0);          // 백엔드는 0부터 시작
    const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수 (백엔드 응답값)
    const size = 20;                              // 한 페이지당 사이즈 고정

    const [gridData, setGridData] = useState<UserListResponse[]>([]);
    const gridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);
    const [excelGridData,setExcelGridData] = useState<UserListResponse[]>([]);
    const excelGridRef = useRef<RaontecGridHandle>(null);

    const [keyword, setKeyword] = useState('');
    const [dclUserId, setDclUserId] = useState('');


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

    const GridColumns = useMemo<CustomColumnDef<UserListResponse>[]>(() => [
        {
            header : '사용자 아이디',
            accessorKey : 'dclUserId',
            meta: { id: 'dclUserId', isKey: true }, // 고유 Key(PK) 설정
            size:200
        },
        {
            header: '사용자 이름',
            accessorKey: 'dclUserName',
            size:150
        },
        {
            header: '이메일 주소',
            accessorKey: 'emailAddr',
        },
        {
            header: '연락처',
            accessorKey: 'telNo',
        },
        {
            header: 'SNS 아이디',
            accessorKey: 'snsId',
            size : 240
        },
        {
            header: 'SNS 종류',
            accessorKey: 'snsTypeName',
            meta: { filterType: "check" },
         //   cell: renderEmptyCell
        },
        // {
        //     header: 'SNS TYPE CODE',
        //     accessorKey: 'getSnsTypeCd',
        //     meta: { filterType: "check" },
        // },
        {
            header: '등록 날짜',
            accessorKey: 'regDt',
            meta: { filterType: "check" },
        },
        {
            header: '로그인 날짜',
            accessorKey: 'lgnDt',
            meta: { filterType: "check" },
        },
    ], []);

    const fetchData = useCallback(async (searchKeyword?: string) => {
        const currentKeyword = searchKeyword !== undefined ? searchKeyword : keywordRef.current;
        try {
            const response = await api.get(`/dclr/user`, {
                params: {
                    page: page,
                    size: size,
                    keyword: currentKeyword
                }
            });

            // 데이터 상태 세팅 (안전)
            setTimeout(() => {
                setGridData(response.data.content || []);
                setTotalPages(response.data.page.totalPages || 1);
            }, 0);

        } catch (error) {
            console.error("데이터 조회 실패:", error);
        }
    }, [page, size]);

    // 3. 버튼 이벤트 핸들러 정의
    const handleDelete = async () => {
        if (dclUserId === '') {
            alert("삭제할 항목을 선택해 주세요.");
            return;
        }
        const confirmMessage = `선택하신 회원을 정말로 삭제하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await api.delete(`/dclr/user/${dclUserId}`, {
            });

            if (response.status === 200 || response.data === true) {
                alert("성공적으로 삭제되었습니다.");
                fetchData();
                fetchUserAllList();  //보이지 않는 엑셀용 전체 데이터도 백엔드에서 새로고침
            }
        } catch (error) {
            console.error("회원 데이터 삭제 실패:", error);
        } finally {

        }
    }

    const handleSearch = useCallback(() => {
        keywordRef.current = keyword; // 즉시 업데이트 보장

        if (page === 0) {
            // 이미 0페이지라면 page 상태가 안 바뀌므로 직접 fetchData를 실행해 줍니다.
            fetchData();
        } else {
            // 페이지가 0이 아니었다면 page를 0으로 바꾸는 순간,
            // 위의 useEffect([page])가 그걸 감지해서 자동으로 fetchData를 실행해 줍니다.
            setPage(0);
        }
    }, [page,keyword, fetchData]);

    const onClickReportRow=(rowData:any)=>{
        setDclUserId((prevId) => {
            // 현재 선택되어 있는 ID(prevId)와 지금 클릭한 행의 ID가 같다면?
            if (prevId === rowData.dclUserId) {
                console.log('클릭 해제됨. ID 비우기');
                return '';
            }
            // 다르다면? 새로운 행을 선택한 것이므로 해당 ID를 세팅합니다.
            console.log('새로운 행 선택됨 ID:', rowData.dclUserId);
            return rowData.dclUserId;
        });
    }
    // 4. 페이지 이동 핸들러 함수들 (요구사항 반영)
    const handleFirstPage = () => {
        setPage(0); // 첫 페이지 (0)
    };

    const handleBackPage = () => {
        if (page > 0) {
            setPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        // 다음 페이지로 이동 (최대 페이지를 넘지 않도록 제한)
        if (page < totalPages - 1) {
            setPage(prev => prev + 1);
        }
    };

    const handleLastPage = () => {
        if (totalPages > 0) {
            setPage(totalPages - 1);
        }
    };

    const handleNumberClick = (pageNum:number) => {
        setPage(pageNum); // 숫자 버튼 클릭 시 해당 페이지로 이동
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const fetchUserAllList = useCallback(async () => {
        try {
            const response = await api.get('/dclr/user/all');
            const data = response.data || [];
            setExcelGridData(data);
        } catch (error) {
            console.error("엑셀 전체 데이터 조회 실패:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [page]);

    //엑셀 다운로드
    useEffect(() => {
        if (excelGridRef.current) {
            setGrid(excelGridRef.current);
            setFileName(`일반회원관리`);
        }
    }, [gridData, setGrid, setFileName]);

    useEffect(() => {
        fetchUserAllList();
    }, [fetchUserAllList]);

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR5100");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <>
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
                                    <Link prefetch={false}  href={item.path}>
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

                    {/* 선택 삭제 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    {/* HTML 구조 분석 결과 엑셀 전용 정렬 클래스명 유지 */}
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
                    <ExcelDownload></ExcelDownload>
                </div>

                {/* 데이터 결과 영역 */}
                <div className="infoContent memberContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={gridRef}
                            data={gridData}
                            columns={GridColumns}
                            globalCellClickEvent={onClickReportRow}
                        />
                    </div>
                    {/*엑셀다운 용 숨김처리 */}
                    <div style={{display: 'none'}}>
                        {excelGridData && excelGridData.length > 0 && (
                            <RaontecTanstackGrid
                                ref={excelGridRef}
                                data={excelGridData}
                                columns={GridColumns}
                            />
                        )}
                    </div>
                    <div className="pagebox">
                        <div className="page_nav">
                            <button className="page_first" aria-label="첫 페이지로" onClick={handleFirstPage}></button>
                            <button className="page_back" aria-label="이전 페이지" onClick={handleBackPage}></button>
                        </div>
                        <div className="page_number">
                            {Array.from({length: totalPages}, (_, index) => (
                                <button
                                    key={index}
                                    className={page === index ? "click" : ""} // 현재 선택된 페이지에 click 클래스 부여
                                    onClick={() => handleNumberClick(index)}
                                >
                                    {index + 1} {/* 화면에는 1부터 표시 */}
                                </button>
                            ))}
                        </div>
                        <div className="page_nav">
                            <button className="page_next" aria-label="다음 페이지" onClick={handleNextPage}></button>
                            <button className="page_last" aria-label="마지막 페이지로" onClick={handleLastPage}></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}