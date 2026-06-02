"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PolicyPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 약관 내용 텍스트 상태 관리
    const [policyContent, setPolicyContent] = useState('');

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'notice', name: '공지사항', path: `/${userRole}/notice` },
        { id: 'policy', name: '약관관리', path: `/${userRole}/policy` },
    ];

    // 3. 버튼 이벤트 핸들러 정의
    const handleUpdate = () => {
        console.log('수정 버튼 클릭');
        // 약관 수정 모드로 전환하거나 API 요청 처리
    };

    /* 추후 주석 해제 시 사용할 핸들러 예시
    const handleCancel = () => {
        console.log('취소 버튼 클릭');
    };

    const handleSave = () => {
        console.log('저장 버튼 클릭', policyContent);
    };
    */

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

            {/* 오른쪽 서브 아티클 (기능 버튼 및 텍스트 영역) 구역 */}
            <div className="subarticle">
                {/* 검색영역 (기존 마크업의 구조적 매칭용 틀 유지) */}
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleUpdate}>수정</button>
                        {/* <button onClick={handleCancel}>취소</button>
                        <button className="red" onClick={handleSave}>저장</button> */}
                    </div>
                </div>

                {/* 데이터 내용 입력 영역 */}
                <div className="infoContent">
                    <textarea
                        className="policytext"
                        placeholder="내용을 입력하세요"
                        value={policyContent}
                        onChange={(e) => setPolicyContent(e.target.value)}
                    ></textarea>
                </div>
            </div>
        </div>
    );
}