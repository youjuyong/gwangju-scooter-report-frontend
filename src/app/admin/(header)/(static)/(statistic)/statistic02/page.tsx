"use client";

import React, {useState, useEffect, useRef, useContext,useMemo} from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from "@/services/api";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {RaontecGridHandle, CustomColumnDef, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {registerMenuLog} from "@/services/common/commonApi";


interface PmCompany {
    bzentyId: string; 
    bzentyNm: string; 
}
interface gridData {
    category : string;
    [month: number]: number;
}

const getTodayMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    
    return `${year}-${month}`;
};

export default function StatisticDayPage() {
    const pathname = usePathname();
    const userRole = "admin";

    const [targetMonth, setTargetMonth] = useState(getTodayMonth());
    const [searchedMonth, setSearchedMonth] = useState('2026-06');
    const [pmCompanyList, setPmCompanyList] = useState<PmCompany[]>([]);
    const [pmCompany, setPmCompany] = useState('');
    const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    const [totalDays, setTotaldays] = useState(0);
    //그리드
    const [reportGridData, setComplainGridData] = useState<gridData[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);

    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    const tabItems = [
        { id: 'day', name: '일별', path: `/${userRole}/statistic01` },
        { id: 'month', name: '월별', path: `/${userRole}/statistic02` },
        { id: 'year', name: '년별', path: `/${userRole}/statistic03` },
    ];

   
    useEffect(() => {
        const fetchPmCompanies = async () => {
            try {
                const response = await api.get('/pm/pm-companies');
                const data = response.data;
                
                setPmCompanyList(data);

                if (data && data.length > 0) {
                    setPmCompany(data[0].bzentyId);
                }
            } catch (error) {
                console.error("PM사 목록 로드 실패:", error);
            }
        };

        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR2300");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };

        recordMenuLog();
        fetchPmCompanies();
    }, []);

    //엑셀 다운로드
    useEffect(() => {
        if (reportGridRef.current) {
            setGrid(reportGridRef.current);
            setFileName(`${targetMonth}_월별민원처리통계`);
        }
    }, [reportGridData, setGrid, setFileName]);

    const handleSearchMonthly = async () => {
        if (!targetMonth) return alert("조회 월을 선택해주세요.");
        if (!pmCompany) return alert("PM사를 선택해주세요.");

        setComplainGridData([]);
        setTotaldays(0);
        setSearchedMonth(targetMonth);
        setLoading(true);
        setIsSearched(true);
        
        try {
            const formattedMonth = targetMonth.replace(/-/g, ''); // '2026-06' -> '202606'
            
            const response = await api.get('/statistics/pm-monthly', {
                params: { targetMonth: formattedMonth, bzentyId: pmCompany }
            });

            const data = response.data; 
            
            const [year, month] = targetMonth.split('-').map(Number);
            const totalDays = new Date(year, month, 0).getDate(); // 6월이면 30, 7월이면 31 동적 반환
            
            const daysCategories = Array.from({ length: totalDays }, (_, i) => `${i + 1}일`);
            
            const receivedSeries = Array.from({ length: totalDays }, (_, i) => data.hourlyData.received[i] || 0);
            const processedSeries = Array.from({ length: totalDays }, (_, i) => data.hourlyData.pmProcessed[i] || 0);
            const towedSeries = Array.from({ length: totalDays }, (_, i) => data.hourlyData.towed[i] || 0);

            const seriesData = [
                { name: '신고접수', data: receivedSeries, color: '#818cf8', type: 'line' },
                { name: 'PM사회수', data: processedSeries, color: '#34d399', type: 'line' },
                { name: '견인완료', data: towedSeries, color: '#f87171', type: 'line' }
            ];

            const chartTitle = data.companyName ? `[${data.companyName}] 월간 민원 처리 추이` : '월간 민원 처리 추이';
            
            const options = createLineChartOptions(chartTitle, daysCategories, seriesData as any);

            setChartOptions(options);
            setComplainGridData(data.gridData);
            setTotaldays(data.totalDays)
        } catch (error) {
            console.error("월별 통계 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatGridColumns = (totalDays: number, currentMonth: string) => {
        // 안전장치: 아직 월 선택이 안 되었을 때 방어
        if (!currentMonth) return [];

        // 1. 넘겨받은 월("2026-02")을 쪼개서 달력 기준 진짜 마지막 날짜 계산
        const [yearStr, monthStr] = currentMonth.split('-');
        const searchYear = Number(yearStr);
        const searchMonth = Number(monthStr);
        const realLastDay = new Date(searchYear, searchMonth, 0).getDate();

        // 2. 서버가 준 날짜 수와 달력 날짜 중 안전한 값 선택
        const finalDaysCount = Math.min(totalDays || 30, realLastDay);

        // 3. 고정 컬럼 (구분)
        const baseColumns: any[] = [
            {
                header: '구분',
                accessorKey: 'category',
                meta: { id: 'category', isKey: true },
                enableSorting: false,
                enableColumnFilter: false
            }
        ];

        // 4. 동적 날짜 컬럼 생성 (28일이면 딱 28개만 생성됨)
        const dayColumns = Array.from({ length: finalDaysCount }, (_, i) => {
            const day = `${i + 1}`;
            return {
                header: `${day}일`,
                accessorKey: day,
                enableColumnFilter: false,
                enableSorting: false,
            };
        });

        return [...baseColumns, ...dayColumns];
    };

    return (
        <div className="wrap statistic_wrap" style={{ width: '100%', maxWidth: '100%' }}>
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isStatisticMenu = pathname.startsWith(`/${userRole}/statistic0`);
                            const isSubActive = item.id === 'statistic' ? isStatisticMenu : pathname === item.path;
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link href={item.path}>{item.name}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 오른쪽 서브 아티클 영역 */}
            <div className="subarticle" style={{ flex: 1, width: '100%', minWidth: 0 }}>
                <nav className="tab">
                    <ul>
                        {tabItems.map((tab) => {
                            const isTabActive = pathname === tab.path;
                            return (
                                <li key={tab.id} className={isTabActive ? 'click' : ''}>
                                    <Link href={tab.path}>{tab.name}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* 검색영역 */}
                  <div className="searchBox" style={{ width: '100%' }}>
                    <div className="search_left">
                        <dl>
                            <dt>일자</dt>
                            <dd>
                               <input
                                    type="month"
                                    value={targetMonth}
                                    onChange={(e) => setTargetMonth(e.target.value)}
                                />
                            </dd>
                            <dt>PM사</dt>
                            <dd>
                                <select
                                    className="pmsel"
                                    value={pmCompany}
                                    onChange={(e) => setPmCompany(e.target.value)}
                                >
                                    {pmCompanyList.length === 0 ? (
                                        <option value="">등록된 PM사 없음</option>
                                    ) : (
                                        pmCompanyList.map((company) => (
                                            <option key={company.bzentyId} value={company.bzentyId}>
                                                {company.bzentyNm}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearchMonthly}>검색</button>
                        <ExcelDownload></ExcelDownload>
                    </div>
                </div>

                <div className="infoContent" style={{width: '100%'}}>
                    <div className="chartbox" style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
                        {loading ? (
                            <div className="loading" style={{margin: 'auto', color: '#fff'}}>데이터를 불러오는 중입니다...</div>
                        ) : !isSearched ? (
                            <div className="placeholder" style={{margin: 'auto', color: '#888'}}>조건을 선택한 후 검색 버튼을
                                눌러주세요.</div>
                        ) : (
                            chartOptions && (
                                <div style={{width: '100%', overflow: 'hidden'}}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={chartOptions}
                                        containerProps={{style: {width: '100%'}}}
                                    />
                                </div>
                            )
                        )}
                    </div>
                    <div className="new_grid_zone" style={{width: '100%', marginTop: '20px'}}>
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            columns={getStatGridColumns(totalDays, searchedMonth)}
                            data={reportGridData}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}