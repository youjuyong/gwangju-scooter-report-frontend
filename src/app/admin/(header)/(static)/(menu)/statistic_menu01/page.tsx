"use client";

import React, {useState, useEffect, useMemo, useRef, useContext} from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from "@/services/api";
import {getCodeType, registerMenuLog} from "@/services/common/commonApi";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import {CustomColumnDef, RaontecGridHandle, RaontecTanstackGrid} from "@rxjacx/raontec-grid";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";
import {getRandomColor} from "@/utils/format";
import { useMenuTypes } from '@/hooks/useMenuType';

interface Types {
    cdId : string;
    cdNm : string;
}
interface gridData {
    menuNm : string;
    [hour: number]: number;
}

export default function StatisticMenuDay(){
    const pathname = usePathname();
    const userRole = "admin";

    const [targetDate, setTargetDate] = useState(() => {
        const now = new Date();
        const kstOffset = now.getTimezoneOffset() * 60000;
        const kstDate = new Date(now.getTime() - kstOffset);
        return kstDate.toISOString().split('T')[0];
    });
    const [menuTypeNm, setMenuTypeNm] = useState('');
    const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);

    //그리드
    const [reportGridData, setMenuGridData] = useState<gridData[]>([]);
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
        { id: 'day', name: '일별', path: `/${userRole}/statistic_menu01` },
        { id: 'month', name: '월별', path: `/${userRole}/statistic_menu02` },
        { id: 'year', name: '년별', path: `/${userRole}/statistic_menu03` },
    ];

    const {
        menuTypeList,
        menuType,
        setMenuType,
        isLoading
    } = useMenuTypes();

    const handleSearch = async () => {
        if (!targetDate) return alert("일자를 선택해주세요.");
        setLoading(true);
        setIsSearched(true);
        try {
            const response = await api.get('/statistics/menu/daily', {
                params: { targetDate: targetDate, menuTypeCd : menuType }
            });

            const data = response.data;
            const hoursCategories = Array.from({ length: 24 }, (_, i) => `${i}시`);

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
                const options = createLineChartOptions(chartTitle, hoursCategories, seriesData as any);

                setChartOptions(options);
                setMenuGridData(data.gridData);
            }
        } catch (error) {
            console.error("통계 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const useHourlyGridColumns = () => {
        return useMemo<CustomColumnDef<any>[]>(() => {
            const baseColumns: CustomColumnDef<any>[] = [
                {
                    header: '구분',
                    accessorKey: 'menuNm',
                    meta: { id: 'menuNm', isKey: true },
                    enableSorting: false,
                    enableColumnFilter: false
                }
            ];

            // 0시부터 23시까지 고정 생성
            const hourColumns = Array.from({ length: 24 }, (_, i) => {
                const hour = `${i}`;
                return {
                    header: `${hour}시`,
                    accessorKey: hour, // 백엔드 Map의 Key인 "0", "1", "2" 등과 매핑
                    enableColumnFilter: false,
                    enableSorting: false,
                };
            });

            return [...baseColumns, ...hourColumns];
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
            setFileName(`${targetDate}_일별메뉴기능활용통계`);
        }
    }, [reportGridData, setGrid, setFileName]);

    return (
        <div className="wrap statistic_wrap">

            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isStatisticMenu = pathname.startsWith(`/${userRole}/statistic_menu01`);
                            const isSubActive = item.id === 'menuStat' ? isStatisticMenu : pathname === item.path;
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
                            <dt>일자</dt>
                            <dd>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
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
                        <button className="btnSearch"onClick={handleSearch}>검색</button>
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
                            columns={useHourlyGridColumns()}
                            data={reportGridData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}