"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ManagerPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색어 상태 관리
    const [keyword, setKeyword] = useState('');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'member', name: '일반회원관리', path: `/${userRole}/member` },
        { id: 'manager', name: '관리자관리', path: `/${userRole}/manager` },
        { id: 'history', name: '시스템사용이력', path: `/${userRole}/history` },
        { id: 'connection', name: '시스템접속이력', path: `/${userRole}/connection` },
    ];

    // 3. 버튼 이벤트 핸들러 정의
    const handleCreate = () => {
        console.log('관리자 등록 버튼 클릭');
        // 관리자 추가용 모달/팝업 호출 또는 관련 로직 연동
    };

    const handleUpdate = () => {
        console.log('관리자 정보 수정 버튼 클릭');
        // 그리드에서 선택된 계정 수정 로직 연동
    };

    const handleDelete = () => {
        console.log('관리자 삭제 버튼 클릭');
        // 그리드에서 선택된 계정 삭제 처리 로직 연동
    };

    const handleSearch = () => {
        console.log('관리자 계정 검색 요청 키워드:', keyword);
        // 백엔드 API 검색 연동 시 사용
    };

    const handleExcelDownload = () => {
        console.log('관리자목록 엑셀 다운로드 실행');
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

                    {/* 관리자 제어용 등록 / 수정 / 삭제 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    {/* 우측 검색어 필터 구역 */}
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

                {/* 데이터 그리드 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        <div>그리드(그리드내부스크롤, 창 사이즈에 따라 실시간으로 사이즈 변하게)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}