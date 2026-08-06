"use client";

import {usePathname} from "next/navigation";
import React, {useState, useEffect, useRef, useContext} from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import api from "@/services/api";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {getCodeType, registerMenuLog} from "@/services/common/commonApi";
import {getRandomColor} from "@/utils/format";
import {RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import {ExcelContext} from "@/components/admin/ExcelContext";
import ExcelDownload from "@/components/admin/ExcelDownload";
import { useMenuTypes } from '@/hooks/useMenuType';

const getTodayMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
};
interface Types {
    cdId : string;
    cdNm : string;
}
interface gridData {
    menuNm : string;
    [month: number]: number;
}

export default function StatisticMonthPage(){
    const pathname = usePathname();
    const userRole = "admin";

    const [targetMonth, setTargetMonth] = useState(getTodayMonth());
    const [searchedMonth, setSearchedMonth] = useState('2026-06');
    const [menuTypeNm, setMenuTypeNm] = useState('');
    const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    const [totalDays, setTotaldays] = useState(0);

    //그리드
    const [reportGridData, setMenuGridData] = useState<gridData[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);

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


    const handleSearchMonthly = async () => {
        if (!targetMonth) return alert("일자를 선택해주세요.");

        setMenuGridData([]);
        setTotaldays(0);
        setSearchedMonth(targetMonth);
        setLoading(true);
        setIsSearched(true);
        try {
            const response = await api.get('/statistics/menu/monthly', {
                params: { targetMonth: targetMonth, menuTypeCd : menuType }
            });

            const data = response.data;
            const [year, month] = targetMonth.split('-').map(Number);
            const totalDays = new Date(year, month, 0).getDate(); // 6월이면 30, 7월이면 31 동적 반환
            const daysCategories = Array.from({ length: totalDays }, (_, i) => `${i + 1}일`);

            if (data && data.menuDatasets) {

                const seriesData = data.menuDatasets.map((item:any) => {
                    return {
                        name: item.menuNm,       // "홈화면", "회수관리" 등
                        data: item.statData,     // [0, 0, 0, ..., 2, 1, 1] (24개 배열)
                        color: getRandomColor(), // 호출할 때마다 새로운 랜덤 색상 부여
                        type: 'line'             // 고정값 'line'
                    };
                });

                const chartTitle = menuTypeNm? `[${menuTypeNm}] 월별 메뉴 기능 활용 추이` : '월별 메뉴 기능 활용 추이';
                const options = createLineChartOptions(chartTitle, daysCategories, seriesData as any);

                setChartOptions(options);
                setMenuGridData(data.gridData);
            }
        } catch (error) {
            console.error("통계 조회 실패:", error);
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

    const handleSelectChange = (e:any) => {
        // 1. 선택된 option의 value (cdId)
        const currentId = e.target.value;

        // 2. 선택된 option의 text (cdNm) -> e.target.options[인덱스].text로 접근
        const currentName = e.target.options[e.target.selectedIndex].text;

        setMenuType(currentId);
        setMenuTypeNm(currentName); // cdNm 값 세팅!
    };

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR2400");
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
            setFileName(`${targetMonth}_월별메뉴기능활용통계`);
        }
    }, [reportGridData, setGrid, setFileName]);
    { console.log(userRole)
        console.log( pathname.startsWith(`/${userRole}/statistic_menu02`))}
    return(
        <div className="wrap statistic_wrap">

            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isStatisticMenu = pathname.startsWith(`/${userRole}/statistic_menu02`);
                            const isSubActive = item.id === 'menuStat' ? isStatisticMenu : pathname === item.path;
                            console.log(pathname);
                            console.log(isStatisticMenu);
                            console.log(isSubActive);
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link prefetch={false}  href={item.path}>{item.name}</Link>
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
                                    <Link prefetch={false}  href={tab.path}>{tab.name}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

               {/*검색영역*/}
                <div className="searchBox">

                    <div className="search_left">
                        <dl>
                            <dt>날짜</dt>
                            <dd>
                                <input
                                    type="month"
                                    value={targetMonth}
                                    onChange={(e) => setTargetMonth(e.target.value)}
                                />
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
                        <button className="btnSearch" onClick={handleSearchMonthly}>검색</button>
                    </div>
                    <ExcelDownload></ExcelDownload>
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
                            columns={getStatGridColumns(totalDays, searchedMonth)}
                            data={reportGridData}
                        />
                    </div>
                </div>

            </div>

        </div>
    )
}