"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import LoadingOverlay from "@/components/LoadingOverlay";
import SettingPopup, {SettingData} from "@/components/admin/popup/SettingPopup";



// 자동 모드 시간 그리드 데이터 인터페이스 정의
export interface AutoModeResponse {
    id: number;
    settingNm: string;
    startTime: string;
    endTime: string;
    appliedZone: string;
    status: string;
}

export default function SettingPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [gridData, setGridData] = useState<AutoModeResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<AutoModeResponse[]>([]);

    // 상단 단일 설정 값 관리 (신고 가능 시간 / 견인 제한 시간)
    const [reportTime, setReportTime] = useState({ start: "07:00", end: "17:00", isUsed: "사용" });
    const [towTime, setTowTime] = useState({ start: "07:00", end: "17:00", isUsed: "사용" });

    // 💡 팝업 제어를 위한 상태 관리
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupTitle, setPopupTitle] = useState("");
    const [popupInitialData, setPopupInitialData] = useState<SettingData | null>(null);

    // 그리드 핸들러 Ref
    const settingGridRef = useRef<RaontecGridHandle>(null);

    // 왼쪽 서브 내비게이션 메뉴 데이터
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '권역코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 하단 그리드 컬럼 정의
    const settingGridColumns = useMemo<CustomColumnDef<AutoModeResponse>[]>(() => [
        { header: '순번', accessorKey: 'id', meta: { id: 'id', isKey: true } },
        { header: '설정 명칭', accessorKey: 'settingNm' },
        { header: '시작 시간', accessorKey: 'startTime' },
        { header: '종료 시간', accessorKey: 'endTime' },
        { header: '적용 권역', accessorKey: 'appliedZone' },
        { header: '상태', accessorKey: 'status' }
    ], []);

    // 데이터 로드 함수
    const fetchSettingData = useCallback(async () => {
        try {
            setIsLoading(true);
            const dummyGridData: AutoModeResponse[] = [
                { id: 1, settingNm: "평일 출근시간대 자동 전환", startTime: "07:00", endTime: "09:00", appliedZone: "광산구, 북구", status: "활성" },
                { id: 2, settingNm: "주말 야간 제한 설정", startTime: "22:00", endTime: "05:00", appliedZone: "전지역", status: "비활성" },
            ];
            setGridData(dummyGridData);
        } catch (error) {
            console.error("운영 설정 데이터 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettingData();
    }, [fetchSettingData]);

    // 💡 2. 신고 가능 시간 [수정] 버튼 클릭 핸들러
    const handleReportTimeEdit = () => {
        setPopupTitle("신고 가능 시간");
        setPopupInitialData({
            type: 'report',
            startTime: reportTime.start,
            endTime: reportTime.end,
            isUsed: reportTime.isUsed
        });
        setIsPopupOpen(true);
    };

    // 💡 3. 견인 제한 시간 [수정] 버튼 클릭 핸들러
    const handleTowTimeEdit = () => {
        setPopupTitle("견인 제한 시간");
        setPopupInitialData({
            type: 'tow',
            startTime: towTime.start,
            endTime: towTime.end,
            isUsed: towTime.isUsed
        });
        setIsPopupOpen(true);
    };

    // 💡 4. 팝업에서 [저장] 버튼을 눌렀을 때 실행될 함수
    const handleSaveSetting = async (savedData: SettingData) => {
        try {
            setIsLoading(true);

            // 원래는 여기서 백엔드 API를 호출하여 저장합니다.
            // await updateSettingTimeApi(savedData);

            if (savedData.type === 'report') {
                // 신고 가능 시간 상태 업데이트
                setReportTime({
                    start: savedData.startTime,
                    end: savedData.endTime,
                    isUsed: savedData.isUsed
                });
            } else if (savedData.type === 'tow') {
                // 견인 제한 시간 상태 업데이트
                setTowTime({
                    start: savedData.startTime,
                    end: savedData.endTime,
                    isUsed: savedData.isUsed
                });
            }

            alert(`${popupTitle} 설정이 성공적으로 저장되었습니다.`);
            setIsPopupOpen(false); // 팝업 닫기
        } catch (error) {
            console.error("설정 저장 실패:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 하단 그리드용 액션들
    const handleCreate = () => alert("자동 모드 시간 등록 팝업 오픈");
    const handleUpdate = () => alert("자동 모드 시간 수정");
    const handleDelete = () => alert("자동 모드 시간 삭제");

    return (
        <>
            {isLoading && <LoadingOverlay />}

            <div className="wrap seting_wrap">
                <div className="subnav">
                    <nav>
                        <ul>
                            {subNavItems.map((item) => {
                                const isSubActive = pathname === item.path || (item.id === 'setting' && pathname.endsWith('/seting'));
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
                    <div className="setingBox row-two">

                        {/* 섹션 1: 신고 가능 시간 */}
                        <section className="seting1">
                            <div className="sectiontop">
                                <h4>신고 가능 시간</h4>
                                <div className="btnSet">
                                    {/* 💡 핸들러 연결 */}
                                    <button onClick={handleReportTimeEdit}>수정</button>
                                </div>
                            </div>
                            <div className="tablebox">
                                <div className="borderbox">
                                    <table className="data-table">
                                        <thead>
                                        <tr>
                                            <th>시작시간</th>
                                            <th>종료시간</th>
                                            <th>사용여부</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>{reportTime.start}</td>
                                            <td>{reportTime.end}</td>
                                            <td>{reportTime.isUsed}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* 섹션 2: 견인 제한 시간 */}
                        <section className="seting2">
                            <div className="sectiontop">
                                <h4>견인 제한 시간</h4>
                                <div className="btnSet">
                                    {/* 💡 핸들러 연결 */}
                                    <button onClick={handleTowTimeEdit}>수정</button>
                                </div>
                            </div>
                            <div className="tablebox">
                                <div className="borderbox">
                                    <table className="data-table">
                                        <thead>
                                        <tr>
                                            <th>시작시간</th>
                                            <th>종료시간</th>
                                            <th>사용여부</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>{towTime.start}</td>
                                            <td>{towTime.end}</td>
                                            <td>{towTime.isUsed}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* 하단 1열 배치 구역 (자동 모드 시간 그리드) */}
                    <div className="setingBox">
                        <section className="seting3">
                            <div className="sectiontop">
                                <h4>자동 모드 시간</h4>
                                <div className="btnSet">
                                    <button onClick={handleCreate}>+ 등록</button>
                                    <button onClick={handleUpdate}>수정</button>
                                    <button onClick={handleDelete}>삭제</button>
                                </div>
                            </div>

                            <div className="gridbox scroll-free">
                                <div className="borderbox">
                                    <RaontecTanstackGrid
                                        ref={settingGridRef}
                                        data={gridData}
                                        columns={settingGridColumns}
                                        rowHeight={50}
                                        enableRowSelection={true}
                                        onSelectionChange={(rows: AutoModeResponse[]) => setCheckedRows(rows)}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* 💡 5. 수정하신 SettingPopup 컴포넌트 마운트 및 Props 주입 */}
            <SettingPopup
                isOpen={isPopupOpen}
                title={popupTitle}
                initialData={popupInitialData}
                onClose={() => setIsPopupOpen(false)}
                onSave={handleSaveSetting}
            />
        </>
    );
}