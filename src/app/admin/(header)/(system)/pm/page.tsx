"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PmPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '권역코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 2. 버튼 이벤트 핸들러 정의
    const handleCreate = () => {
        console.log('등록 버튼 클릭');
        // 업체 등록 팝업이나 모달을 띄우는 로직 추가
    };

    const handleUpdate = () => {
        console.log('수정 버튼 클릭');
        // 그리드에서 선택된 업체를 수정하는 로직 추가
    };

    const handleDelete = () => {
        console.log('삭제 버튼 클릭');
        // 그리드에서 선택된 업체를 삭제하는 로직 추가
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

            {/* 오른쪽 서브 아티클 (기능 버튼 및 그리드) 영역 */}
            <div className="subarticle">
                {/* 검색영역 (기존 마크업의 구조적 매칭용 틀 유지) */}
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
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