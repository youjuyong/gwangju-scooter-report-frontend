"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StatisticDayPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색 필터 상태 관리
    const [targetDate, setTargetDate] = useState('');
    const [pmCompany, setPmCompany] = useState('전체');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    // 3. 상단 세부 탭 메뉴 데이터 정의 (일별/월별/년별)
    const tabItems = [
        { id: 'day', name: '일별', path: `/${userRole}/statistic01` },
        { id: 'month', name: '월별', path: `/${userRole}/statistic02` },
        { id: 'year', name: '년별', path: `/${userRole}/statistic03` },
    ];

    // 검색 버튼 이벤트 핸들러
    const handleSearch = () => {
        const searchData = {
            targetDate,
            pmCompany
        };
        console.log('민원처리통계 검색 요청:', searchData);
        // 추후 API 조회 로직 연동 시 사용
    };

    // 엑셀 저장 버튼 이벤트 핸들러
    const handleExcelDownload = () => {
        console.log('민원처리통계 엑셀 다운로드 실행');
    };

    return (
        <div className="wrap statistic_wrap">
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소가 민원처리통계(statistic01, 02, 03) 계열이면 세 번째 메뉴 활성화
                            const isStatisticMenu = pathname.startsWith(`/${userRole}/statistic0`);
                            const isSubActive = item.id === 'statistic' ? isStatisticMenu : pathname === item.path;

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

            {/* 오른쪽 서브 아티클 영역 */}
            <div className="subarticle">
                {/* 내부 탭 영역 (일별 / 월별 / 년별) */}
                <nav className="tab">
                    <ul>
                        {tabItems.map((tab) => {
                            const isTabActive = pathname === tab.path;
                            return (
                                <li key={tab.id} className={isTabActive ? 'click' : ''}>
                                    <Link href={tab.path}>
                                        {tab.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* 검색영역 */}
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
                            <dt>PM사</dt>
                            <dd>
                                <select
                                    className="pmsel"
                                    value={pmCompany}
                                    onChange={(e) => setPmCompany(e.target.value)}
                                >
                                    <option value="전체">전체</option>
                                    <option value="지쿠">지쿠</option>
                                    <option value="스윙">스윙</option>
                                </select>
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>

                    <button className="btnExcel" onClick={handleExcelDownload}>엑셀저장</button>
                </div>

                {/* 차트 및 그리드 결과 영역 */}
                <div className="infoContent">
                    <div className="chartbox">
                        <div>차트</div>
                        {/* 여기에 Recharts나 Chart.js 같은 라이브러리 연동 */}
                    </div>
                    <div className="gridbox">
                        <div>그리드(그리드 박스 내에서 세로스크롤 생기지 않도록 자기 높이대로 세로 사이즈 늘어나게 해야 합니다)</div>
                        {/* 그리드가 세로 스롤 없이 높이가 유연하게 늘어나도록 퍼블리싱 스타일링 대응 구역 */}
                    </div>
                </div>
            </div>
        </div>
    );
}