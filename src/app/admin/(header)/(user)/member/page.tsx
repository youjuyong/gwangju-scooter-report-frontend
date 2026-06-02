"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MemberPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색어 상태 관리
    const [keyword, setKeyword] = useState('');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'member', name: '일반회원관리', path: `/${userRole}/member` },
        { id: 'manager', name: '관리자관리', path: `/${userRole}/manager` },
        { id: 'history', name: '시스템사용이력', path: `/${userRole}/history` },
    ];

    // 3. 버튼 이벤트 핸들러 정의
    const handleDelete = () => {
        console.log('삭제 버튼 클릭');
        // 그리드에서 선택된 일반 회원을 삭제/탈퇴 처리하는 로직 추가
    };

    const handleSearch = () => {
        console.log('일반회원 검색 요청 키워드:', keyword);
        // 백엔드 API 연동 시 사용
    };

    const handleExcelDownload = () => {
        console.log('일반회원목록 엑셀 다운로드 실행');
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

            {/* 오른쪽 서브 아티클 (기능 버튼, 검색창 및 그리드) 영역 */}
            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">

                    {/* 선택 삭제 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    {/* HTML 구조 분석 결과 엑셀 전용 정렬 클래스명 유지 */}
                    <div className="search_right search_right_Excel">
                        <dl>
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
        </div>
    );
}