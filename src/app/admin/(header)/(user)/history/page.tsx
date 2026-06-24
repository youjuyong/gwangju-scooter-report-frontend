"use client";
import React, {useCallback, useContext, useMemo, useRef, useState, useEffect} from 'react';
import {usePathname} from "next/navigation";
import Link from "next/link";
import {UserHistoryForm,UserHistoryResponse} from "@/types/adminReport";
import {getReportListApi, getUserHistoryListApi} from "@/services/report/adminReportApi";
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import {ExcelContext} from "@/components/admin/ExcelContext";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {registerMenuLog} from "@/services/common/commonApi";

export default function UserHistory(){
    const pathname = usePathname();
    const userRole = "admin";

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const kstOffset = now.getTimezoneOffset() * 60000;
        const kstDate = new Date(now.getTime() - kstOffset);
        return kstDate.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        const kstOffset = now.getTimezoneOffset() * 60000;
        const kstDate = new Date(now.getTime() - kstOffset);
        return kstDate.toISOString().split('T')[0];
    });
    const [keyword, setKeyword] = useState('');

    //그리드
    const [reportGridData, setHistoryGridData] = useState<UserHistoryResponse[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);

    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'member', name: '일반회원관리', path: `/${userRole}/member` },
        { id: 'manager', name: '관리자관리', path: `/${userRole}/manager` },
        { id: 'history', name: '시스템사용이력', path: `/${userRole}/history` },
        { id: 'connection', name: '시스템접속이력', path: `/${userRole}/connection` },
    ];
    const historyGridColumns = useMemo<CustomColumnDef<UserHistoryResponse>[]>(() => [
        {
            header : '사용자이름',
            accessorKey : 'chgUserNm',
            size: 200
        }
        ,
        {
            header: 'ID',
            accessorKey: 'chgUserId',
            meta: { id: 'chgUserId', isKey: true , filterType: "check"}, // 고유 Key(PK) 설정
            size: 200

        },
        {
            header: '구분',
            accessorKey: 'aftrVl',
            meta: { filterType: "check" },
            cell: (info) => {
                const value = info.getValue() as string;
                const statusMap: Record<string, string> = {
                    UPDATE: '수정',
                    DELETE: '삭제',
                    INSERT: '등록'
                };
                // 매핑되는 값이 있으면 바꾸고, 없으면 원본 값 그대로 노출
                return statusMap[value] || value;
            },
            size : 100
        },
        {
            header: '계정유형',
            accessorKey: 'deptTypeNm',
            meta: { filterType: "check" },
            size: 200
        },
        {
            header: '로그일시',
            accessorKey: 'chgDt',
            meta: { filterType: "check" },
            size: 300
        },
        {
            header: '내용',
            accessorKey: 'displayContent',
        },
    ], []);


    const handleSearch = () => {
        const requestData: UserHistoryForm = {
            startDate: startDate,
            endDate: endDate,
            keyword: keyword,
        };

        fetchData(requestData);
    };

    // 이력 데이터 조회
    const fetchData = useCallback(async (searchParams: UserHistoryForm) => {
        try {
            const result = await getUserHistoryListApi(searchParams);
            console.log(result);
            setHistoryGridData(result);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        handleSearch();

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR5300");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };

        recordMenuLog();
    }, []);

    //엑셀 다운로드
    useEffect(() => {
        if (reportGridRef.current) {
            setGrid(reportGridRef.current);
            setFileName("시스템사용이력");
        }
    }, [reportGridData, setGrid, setFileName]);

    return(
        <div className="wrap history_wrap">

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

            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">
                    <div className="search_left">
                        <dl className="dlfirst">
                            <dt>기간</dt>
                            <dd>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                ~
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </dd>
                        </dl>
                        <dl className="dlnth3">
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

                <div className="infoContent">
                    <div className="gridbox">
                        {/*<div>그리드(그리드내부스크롤, 창 사이즈에 따라 실시간으로 사이즈 변하게)</div>*/}
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            data={reportGridData}
                            columns={historyGridColumns}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}