"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ReportPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색 필터 상태 관리 (기능 컴포넌트화를 위한 state)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pmCompany, setPmCompany] = useState('전체');
    const [status, setStatus] = useState('전체');
    const [keyword, setKeyword] = useState('');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    // 검색 버튼 이벤트 핸들러
    const handleSearch = () => {
        const searchData = {
            startDate,
            endDate,
            pmCompany,
            status,
            keyword
        };
        console.log('검색 요청 데이터:', searchData);
        // 추후 API 연동 시 이 지점에서 fetch나 axios를 활용하시면 됩니다.
    };

    // 엑셀 저장 버튼 이벤트 핸들러
    const handleExcelDownload = () => {
        console.log('엑셀 다운로드 실행');
    };

    return (
        <>
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소가 설정된 메뉴의 path와 완전히 일치하면 'click' 클래스 부여
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
                        <dl className="dlnth2">
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
                            <dt>처리상태</dt>
                            <dd>
                                <select
                                    className="sisel"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="전체">전체</option>
                                    <option value="회수완료">회수완료</option>
                                    <option value="견인완료">견인완료</option>
                                </select>
                            </dd>
                        </dl>
                        <dl className="dlnth3">
                            <dt>검색어</dt>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="검색어 입력"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
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
        </>
    );
}