"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PersonalPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 년도 선택 상태 관리 (기본값: 2026)
    const [selectedYear, setSelectedYear] = useState('2026');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    // 검색 버튼 이벤트 핸들러
    const handleSearch = () => {
        console.log('검색 요청 년도:', selectedYear);
        // 추후 API 연동 시 selectedYear 값을 쿼리 파라미터로 넘겨주시면 됩니다.
    };

    // 엑셀 저장 버튼 이벤트 핸들러
    const handleExcelDownload = () => {
        console.log('개인정보파기이력 엑셀 다운로드 실행');
    };

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
                                    <Link href={item.path}>
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
                                    <option value="2026">2026</option>
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                </select>
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>

                    <button className="btnExcel" onClick={handleExcelDownload}>엑셀저장</button>
                </div>

                {/* 데이터 결과 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        <div>그리드(그리드내부스크롤, 창 사이즈에 따라 실시간으로 사이즈 변하게)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}