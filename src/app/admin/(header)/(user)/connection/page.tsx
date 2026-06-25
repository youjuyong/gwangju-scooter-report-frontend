"use client";
import React, {useCallback, useContext, useMemo, useRef, useState, useEffect} from 'react';
import {usePathname} from "next/navigation";
import Link from "next/link";
import {UserConnHistroyForm, UserConntHistoryResponse} from "@/types/adminReport";
import {UserConntHistoryListApi} from "@/services/report/adminReportApi";
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

    //그리드
    const [reportGridData, setHistoryGridData] = useState<UserConntHistoryResponse[]>([]);
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
    const gridColumns = useMemo<CustomColumnDef<UserConntHistoryResponse>[]>(() => [
        {
            header : '접속 로그 ID',
            accessorKey : 'cntnLogId',
            meta: { id: 'chgUserNm'}, // 고유 Key(PK) 설정
        }
        ,
        {
            header: '사용자 아이디',
            accessorKey: 'userId',
            meta: { filterType: "check" },

        },
        {
            header: 'IP 주소',
            accessorKey: 'cntnIpAddr',
            meta: { filterType: "check" },
        },
        {
            header: '접속 날짜',
            accessorKey: 'cntnDt',
            meta: { filterType: "check" },
        },
    ], []);
    const handleSearch = () => {
        const requestData: UserConnHistroyForm = {
            startDate: startDate,
            endDate: endDate,
        };

        fetchData(requestData);
    };

    // 이력 데이터 조회
    const fetchData = useCallback(async (searchParams: UserConnHistroyForm) => {
        try {
            const result = await UserConntHistoryListApi(searchParams);
            console.log(result);
            setHistoryGridData(result);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        handleSearch();

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR5400");
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
            setFileName("시스템접속이력");
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
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>
                    <ExcelDownload></ExcelDownload>
                </div>

                <div className="infoContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            data={reportGridData}
                            columns={gridColumns}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}