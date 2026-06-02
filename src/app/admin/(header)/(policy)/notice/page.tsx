"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NoticePage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색어 상태 관리
    const [keyword, setKeyword] = useState('');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'notice', name: '공지사항', path: `/${userRole}/notice` },
        { id: 'policy', name: '약관관리', path: `/${userRole}/policy` },
    ];

    // 3. 버튼 이벤트 핸들러 정의
    const handleCreate = () => {
        console.log('등록 버튼 클릭');
        // 등록 팝업을 띄우거나 등록 페이지로 이동하는 로직 추가
    };

    const handleUpdate = () => {
        console.log('수정 버튼 클릭');
        // 그리드에서 선택된 항목을 수정하는 로직 추가
    };

    const handleDelete = () => {
        console.log('삭제 버튼 클릭');
        // 그리드에서 선택된 항목을 삭제하는 로직 추가
    };

    const handleSearch = () => {
        console.log('공지사항 검색 요청 키워드:', keyword);
        // 검색어 기반 API 연동 시 사용
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

                    {/* 등록 / 수정 / 삭제 제어 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    <div className="search_right">
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