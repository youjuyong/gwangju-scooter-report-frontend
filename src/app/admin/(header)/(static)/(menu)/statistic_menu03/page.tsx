"use client";

import React, {useState, useEffect, useRef, useContext, useMemo} from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from "@/services/api";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {getRandomColor ,getYearOptions} from "@/utils/format";
import { useMenuTypes } from '@/hooks/useMenuType';

interface gridData {
    menuNm : string;
    [year: number]: number;
}

const getTodayYear = () => {
    return String(new Date().getFullYear());
};

export default function StatisticMenuYearsPage(){
    const pathname = usePathname();
    const userRole = "admin";

    const [targetYear, setTargetYear] = useState(getTodayYear());
    const [menuTypeNm, setMenuTypeNm] = useState('');
    const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);

    //그리드
    const [reportGridData, setComplainGridData] = useState<gridData[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);
    const yearOptions = getYearOptions();

    const {
        menuTypeList,
        menuType,
        setMenuType,
        isLoading
    } = useMenuTypes();
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    const tabItems = [
        { id: 'day', name: '일별', path: `/${userRole}/statistic_menu01` },
        { id: 'month', name: '월별', path: `/${userRole}/statistic_menu02` },
        { id: 'year', name: '년별', path: `/${userRole}/statistic_menu03` },
    ];

    //엑셀 다운로드
    useEffect(() => {
        if (reportGridRef.current) {
            setGrid(reportGridRef.current);
            setFileName(`${targetYear}년_연별메뉴기능활용통계`);
        }
    }, [reportGridData, setGrid, setFileName]);

    const handleSearchYearly = async () => {
        if (!targetYear) return alert("일자를 선택해주세요.");
        setLoading(true);
        setIsSearched(true);
        try {
            const response = await api.get('/statistics/menu/yearly', {
                params: { targetYear : targetYear, menuTypeCd : menuType }
            });

            const data = response.data;
            const monthsCategories = Array.from({ length: 12 }, (_, i) => `${i +1}월`);

            if (data && data.menuDatasets) {

                const seriesData = data.menuDatasets.map((item:any) => {
                    return {
                        name: item.menuNm,       // "홈화면", "회수관리" 등
                        data: item.statData,     // [0, 0, 0, ..., 2, 1, 1] (24개 배열)
                        color: getRandomColor(), // 호출할 때마다 새로운 랜덤 색상 부여
                        type: 'line'             // 고정값 'line'
                    };
                });

                const chartTitle = menuTypeNm? `[${menuTypeNm}] 시간별 메뉴 기능 활용 추이` : '시간별 메뉴 기능 활용 추이';
                const options = createLineChartOptions(chartTitle, monthsCategories, seriesData as any);

                setChartOptions(options);
                setComplainGridData(data.gridData);
            }
        } catch (error) {
            console.error("통계 조회 실패:", error);
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

    const handleSelectChange = (e:any) => {
        // 1. 선택된 option의 value (cdId)
        const currentId = e.target.value;

        // 2. 선택된 option의 text (cdNm) -> e.target.options[인덱스].text로 접근
        const currentName = e.target.options[e.target.selectedIndex].text;

        setMenuType(currentId);
        setMenuTypeNm(currentName); // cdNm 값 세팅!
    };


    return (
        <div className="wrap statistic_wrap">

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

            <div className="subarticle">
                {/*탭*/}
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

                {/*검색영역*/}
                <div className="searchBox">

                    <div className="search_left">
                        <dl>
                            <dt>년도</dt>
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
                            <dt>종류</dt>
                            <dd>
                                <select
                                    className="pmsel"
                                    value={menuType}
                                    onChange={handleSelectChange}
                                >
                                    {menuTypeList.length === 0 ? (
                                        <option value="">메뉴 종류 없음</option>
                                    ) : (
                                        menuTypeList.map((menutype) => (
                                            <option key={menutype.cdId} value={menutype.cdId}>
                                                {menutype.cdNm}
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


                <div className="infoContent">

                    <div className="chartbox">
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
                            columns={useYearlyGridColumns()}
                            data={reportGridData}
                        />
                    </div>

                </div>

            </div>

        </div>
    )
}