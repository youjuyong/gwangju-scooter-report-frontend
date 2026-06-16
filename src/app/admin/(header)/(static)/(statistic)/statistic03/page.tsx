"use client";

import React, {useState, useEffect, useRef, useContext,useMemo} from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from "@/services/api";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {RaontecGridHandle,CustomColumnDef, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {getYearOptions} from "@/utils/format";

interface PmCompany {
    bzentyId: string; 
    bzentyNm: string; 
}
interface gridData {
    category : string;
    [year: number]: number;
}

const getTodayYear = () => {
    return String(new Date().getFullYear());
};

export default function StatisticDayPage() {
    const pathname = usePathname();
    const userRole = "admin";

    const [targetYear, setTargetYear] = useState(getTodayYear());
    const [pmCompanyList, setPmCompanyList] = useState<PmCompany[]>([]);
    const [pmCompany, setPmCompany] = useState('');
    const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    //그리드
    const [reportGridData, setComplainGridData] = useState<gridData[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);
    const yearOptions = getYearOptions();

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

        fetchPmCompanies();
    }, []);

    //엑셀 다운로드
    useEffect(() => {
        if (reportGridRef.current) {
            setGrid(reportGridRef.current);
            setFileName(`${targetYear}년_연별민원처리통계`);
        }
    }, [reportGridData, setGrid, setFileName]);

    const handleSearchYearly = async () => {
        if (!targetYear) return alert("조회 연도를 선택해주세요.");
        if (!pmCompany) return alert("PM사를 선택해주세요.");
        
        setLoading(true);
        setIsSearched(true);
        
        try {
            const response = await api.get('/statistics/pm-yearly', {
                params: { targetYear: targetYear, bzentyId: pmCompany }
            });

            const data = response.data;
            
            const monthsCategories = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
            
            const receivedSeries = Array.from({ length: 12 }, (_, i) => data.hourlyData.received[i] || 0);
            const processedSeries = Array.from({ length: 12 }, (_, i) => data.hourlyData.pmProcessed[i] || 0);
            const towedSeries = Array.from({ length: 12 }, (_, i) => data.hourlyData.towed[i] || 0);

            const seriesData = [
                { name: '신고접수', data: receivedSeries, color: '#818cf8', type: 'line' },
                { name: 'PM사회수', data: processedSeries, color: '#34d399', type: 'line' },
                { name: '견인완료', data: towedSeries, color: '#f87171', type: 'line' }
            ];

            const chartTitle = data.companyName ? `[${data.companyName}] 연간 민원 처리 추이` : '연간 민원 처리 추이';
            
            // 공통 테마 유틸 함수 재사용
            const options = createLineChartOptions(chartTitle, monthsCategories, seriesData as any);
            setChartOptions(options);
            setComplainGridData(data.gridData);
        } catch (error) {
            console.error("연별 통계 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const useYearlyGridColumns = () => {
        return useMemo<CustomColumnDef<any>[]>(() => {
            const baseColumns: CustomColumnDef<any>[] = [
                {
                    header: '구분',
                    accessorKey: 'category',
                    meta: { id: 'category', isKey: true },
                    enableSorting: false,
                    enableColumnFilter: false
                }
            ];

            // 1월부터 12월까지 고정 생성
            const monthColumns = Array.from({ length: 12 }, (_, i) => {
                const month = `${i + 1}`;
                return {
                    header: `${month}월`,
                    accessorKey: month, // 백엔드 Map의 Key인 "1", "2" ... "12"와 매핑
                    enableColumnFilter: false,
                    enableSorting: false,
                };
            });

            return [...baseColumns, ...monthColumns];
        }, []);
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
                            <dt>조회연도</dt>
                            <dd>
                                <select 
                                    value={targetYear} 
                                    onChange={(e) => setTargetYear(e.target.value)}
                                    className="yearSel"
                                >
                                    {yearOptions.map((year) => (
                                        <option key={year} value={String(year)}>
                                            {year}년
                                        </option>
                                    ))}
                                </select>
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
                        <button className="btnSearch" onClick={handleSearchYearly}>검색</button>
                        <ExcelDownload></ExcelDownload>
                    </div>
                </div>

                <div className="infoContent" style={{ width: '100%' }}>
                    <div className="chartbox" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <div className="loading" style={{ margin: 'auto' ,color: '#fff' }}>데이터를 불러오는 중입니다...</div>
                        ) : !isSearched ? (
                            <div className="placeholder" style={{ margin: 'auto', color: '#888' }}>조건을 선택한 후 검색 버튼을 눌러주세요.</div>
                        ) : (
                            chartOptions && (
                                <div style={{ width: '100%', overflow: 'hidden' }}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={chartOptions}
                                        containerProps={{ style: { width: '100%' } }} 
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <div className="new_grid_zone" style={{ width: '100%', marginTop: '20px' }}>
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            columns={useYearlyGridColumns()}
                            data={reportGridData}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}