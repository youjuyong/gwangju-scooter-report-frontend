"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
//  약관 조회 및 수정 API 임포트
import {getPolicyApi, updatePolicyApi,} from "@/services/notice/noticeApi";
import {registerMenuLog} from "@/services/common/commonApi";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function PolicyPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [policyContent, setPolicyContent] = useState(''); // 텍스트 영역 상태
    const [policyId, setPolicyId] = useState('');           // 서버에서 받아올 약관 고유 ID(PK)
    const [isReadOnly, setIsReadOnly] = useState(true);     // 읽기전용 유무 상태
    const [isLoading, setIsLoading] = useState(false);       // 로딩 상태
    const [originContent, setOriginContent] = useState(''); // 수정 취소용 원본 백업 상태

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'notice', name: '공지사항', path: `/${userRole}/notice` },
        { id: 'policy', name: '약관관리', path: `/${userRole}/policy` },
    ];

    // 3. 약관 데이터 로드 함수
    const fetchPolicy = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getPolicyApi();
            const policyData = Array.isArray(result) ? result[0] : result;

            if (policyData) {
                setPolicyId(policyData.ntcId || '');
                setPolicyContent(policyData.cnData || '');
                setOriginContent(policyData.cnData || ''); // 원본 백업
            }
        } catch (error) {
            console.error("약관 데이터 로딩 실패:", error);
            alert("약관 데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 페이지 진입 시 최초 조회
    useEffect(() => {
        fetchPolicy();
    }, [fetchPolicy]);

    // 4. 버튼 이벤트 핸들러

    // [수정] 모드 전환
    const handleEditMode = () => {
        if (!policyId) {
            alert("수정할 약관 데이터 데이터 정보가 로드되지 않았습니다.");
            return;
        }
        setIsReadOnly(false);
    };

    // [취소] 원본 되돌리기
    const handleCancel = () => {
        if (window.confirm("수정중이던 내용이 사라집니다. 취소하시겠습니까?")) {
            setPolicyContent(originContent); // 백업 데이터로 롤백
            setIsReadOnly(true);
        }
    };

    const handleSave = async () => {
        if (!policyContent.trim()) {
            alert("약관 내용을 입력해주세요.");
            return;
        }
        try {
            setIsLoading(true);
            const requestBody = {
                ntcId: policyId,           // 조회할 때 보관해둔 약관 고유 고유 ID
                ttlNm: '이용약관',          // 필수 항목 방어용 제목 지정
                cnData: policyContent,     // ◀ 사용자가 textarea에 입력한 실제 수정 약관 내용
            };
            await updatePolicyApi(requestBody);
            alert("약관이 성공적으로 수정 및 저장되었습니다.");

            setOriginContent(policyContent); // 취소용 백업 데이터 최신화
            setIsReadOnly(true);             // 다시 보기 전용 모드로 전환
        } catch (error) {
            console.error("약관 저장 실패:", error);
            alert("저장 처리 중 오류가 발생했습니다. 데이터를 다시 확인해주세요.");
        } finally {
            setIsLoading(false);
        }
    };
    //메뉴 이동 이력
    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR3200");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    if (isLoading && policyContent === '') {
        return <LoadingOverlay
            message={"데이터를 로딩 중입니다..."}
        />;
    }

    return (
        <div className="wrap">
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            const isSubActive = pathname === item.path;
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link prefetch={false}  href={item.path}>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 오른쪽 서브 아티클 구역 */}
            <div className="subarticle">
                {/* 상단 컨트롤 영역 */}
                <div className="searchBox">
                    <div className="btnSet">
                        {isReadOnly ? (
                            // 🔎 1. 읽기 전용 상태일 때 버튼 구조
                            <button onClick={handleEditMode}>수정</button>
                        ) : (
                            // 🛠️ 2. 수정 모드 활성화 상태일 때 버튼 구조
                            <>
                                <button onClick={handleCancel}>취소</button>
                                <button className="red" onClick={handleSave}>저장</button>
                            </>
                        )}
                    </div>
                </div>

                {/* 데이터 내용 입력 영역 */}
                <div className="infoContent">
                    <textarea
                        className="policytext"
                        placeholder={isLoading ? "데이터를 가져오는 중입니다..." : "내용을 입력하세요"}
                        value={policyContent}
                        disabled={isReadOnly} //  읽기전용 상태 스위칭 연동
                        onChange={(e) => setPolicyContent(e.target.value)}

                    ></textarea>
                </div>
            </div>
        </div>
    );
}