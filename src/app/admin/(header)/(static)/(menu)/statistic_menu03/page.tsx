"use client";

import React, { useState, useEffect } from 'react';
import { createLineChartOptions } from "@/utils/highchart";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from "@/services/api";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'

export default function StatisticMenuYearsPage(){
    const pathname = usePathname();
    const userRole = "admin";
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
                                <select className="pmsel">
                                    <option selected>2026</option>
                                    {/*현재 년도 기본 셀렉*/}
                                    <option>2025</option>
                                    <option>2024</option>
                                    {/*정보가 있는 년도 부터*/}
                                </select>
                            </dd>
                            <dt>PM사</dt>
                            <dd>
                                <select className="pmsel">
                                    <option>전체</option>
                                    <option>지쿠</option>
                                    <option>스윙</option>
                                </select>
                            </dd>
                        </dl>
                        <button className="btnSearch">검색</button>
                    </div>

                    <button className="btnExcel">엑셀저장</button>
                </div>


                <div className="infoContent">

                    <div className="chartbox">
                        <div>차트</div>
                    </div>
                    <div className="gridbox">
                        <div>그리드(그리드 박스 내에서 세로스크롤 생기지 않도록 자기 높이대로 세로 사이즈 늘어나게 해야 합니다)</div>
                    </div>

                </div>

            </div>

        </div>
    )
}