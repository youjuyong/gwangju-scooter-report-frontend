"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState,useContext} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import {PrivacyReportForm, PrivacyReportResponse} from "@/types/adminReport";
import {getPrivacyReportListApi} from "@/services/report/adminReportApi";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {registerMenuLog} from "@/services/common/commonApi";

export default function PersonalPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 년도 선택 상태 관리 (기본값: 2026)
    const [selectedYear, setSelectedYear] = useState('2026');

    //그리드
    const [reportGridData, setPrivacyGridData] = useState<PrivacyReportResponse[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);
    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    //1. 현재 올해가 몇 년도인지 실시간으로 가져옵니다. (예: 2026)
    const currentYear = new Date().getFullYear();
    const startYear = 2026; // 시작 기준 년도

    //2026년부터 올해까지의 년도 배열을 자동으로 생성
    const yearList = Array.from(
        { length: currentYear - startYear + 1 },
        (_, index) => startYear + index
    );

    const reportGridColumns = useMemo<CustomColumnDef<PrivacyReportResponse>[]>(() => [
        {
            header : '이력ID',
            accessorKey : 'delLogId',
            meta: { id: 'delLogId', isKey: true } // 고유 Key(PK) 설정
        }
        ,
        {
            header: '파기건수',
            accessorKey: 'delNocs',
            meta: { filterType: "check" }

        },
        {
            header: '파기날짜',
            accessorKey: 'delDt',
            meta: { filterType: "check" }
        },

    ], []);

    // 검색 버튼 이벤트 핸들러
    const handleSearch = () => {
        const requestData: PrivacyReportForm = {
            targetYear : selectedYear
        }
        fetchData(requestData)
    };

    const fetchData = useCallback(async(searchParams:PrivacyReportForm)=>{
        try{
            const result = await getPrivacyReportListApi(searchParams);
            setPrivacyGridData(result);

        }catch (error){
            console.error(error);
        }
    },[])

    useEffect(() => {
        handleSearch(); // 화면이 열리자마자 검색

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR2200");
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
            setFileName("개인정보파기이력");
        }
    }, [reportGridData, setGrid, setFileName]);

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
                                    <Link prefetch={false}  href={item.path}>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 오른쪽 서브 아티클 (검색 및 그리드) 영역 */}
            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">
                    <div className="search_left">
                        <dl>
                            <dt>년도</dt>
                            <dd>
                                <select
                                    className="yesel"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    {yearList.map((year) => (
                                        <option key={year} value={year.toString()}>
                                            {year}년
                                        </option>
                                    ))}
                                </select>
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>
                    <ExcelDownload></ExcelDownload>
                </div>

                {/* 데이터 결과 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            data={reportGridData}
                            columns={reportGridColumns}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}