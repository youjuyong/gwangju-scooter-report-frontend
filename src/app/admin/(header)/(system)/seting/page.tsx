"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import LoadingOverlay from "@/components/LoadingOverlay";
import SettingPopup, { SettingData } from "@/components/admin/popup/SettingPopup";
import {
    deleteOperationSettingApi,
    getOperationSettingListApi,
    updateOperationSettingApi,
    updateTowingTimeApi
} from "@/services/system/systemApi";
import {OperationSettingItem} from "@/types/system";
import {registerMenuLog} from "@/services/common/commonApi";



export interface AutoModeResponse {
    id: string;
    settingNm: string;
    startTime: string;
    endTime: string;
    appliedZone: string;
    status: string;
}

export interface OperationSettingResponse {
    autoTowingTransferTime: number;          // 견인 자동 이관 시간 (ex: 3)
    operationSettings: OperationSettingItem[]; // 운영 설정 목록 배열
}

export default function SettingPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [gridData, setGridData] = useState<AutoModeResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<AutoModeResponse[]>([]);

    // 백엔드 원본 키를 관리하기 위한 ref 구조 정의 (수정 요청 시 오리지널 ID 매핑용)
    const originalSettingsRef = useRef<{ [key: string]: OperationSettingItem }>({});

    // 상단 단일 설정 값 관리 (시작/종료 포맷은 'HH:mm' 형태로 관리)
    const [reportTime, setReportTime] = useState({ start: "00:00", end: "00:00", isUsed: "사용안함" });
    const [towTime, setTowTime] = useState({ start: "0", end: "0", isUsed: "사용" });

    // 팝업 제어를 위한 상태 관리
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
        { id: 'code', name: '공통코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 하단 그리드 컬럼 정의
    const settingGridColumns = useMemo<CustomColumnDef<AutoModeResponse>[]>(() => [
        { header: '설정 코드', accessorKey: 'id', meta: { id: 'id', isKey: true } },
        { header: '설정 명칭', accessorKey: 'settingNm' },
        { header: '시작 시간', accessorKey: 'startTime',enableColumnFilter: false, },
        { header: '종료 시간', accessorKey: 'endTime',enableColumnFilter: false, },
        { header: '적용 권역', accessorKey: 'appliedZone' },
        { header: '상태', accessorKey: 'status' }
    ], []);



    // 시간 데이터 포맷팅 헬퍼 유틸 함수들
    const parseToDisplayTime = (hm: string) => {
        if (!hm || hm.length !== 4) return "00:00";
        return `${hm.slice(0, 2)}:${hm.slice(2, 4)}`; // "0900" -> "09:00"
    };

    const parseToBackendHm = (timeStr: string) => {
        return timeStr.replace(":", ""); // "09:00" -> "0900"
    };

    //데이터 로드 및 상태 매핑 실서버 연동 함수
    const fetchSettingData = useCallback(async () => {
        try {
            setIsLoading(true);

            // 백엔드 통신 변경 (기존 api.get 제네릭도 새 응답 껍데기에 맞추어 적용되어야 함)
            // 임시로 받아온 객체를 형변환하거나 api 구조에 맞춰 명시
            const responseData = await getOperationSettingListApi() as unknown as OperationSettingResponse;

            const rawData = responseData.operationSettings || [];
            const towingTimeVal = responseData.autoTowingTransferTime ?? 0;

            // 1. 객체의 Key를 고유 ID인 operStngId로 보관 (덮어쓰기 방지)
            const mappingData: { [key: string]: OperationSettingItem } = {};
            rawData.forEach(item => {
                mappingData[item.operStngId] = item;
            });
            originalSettingsRef.current = mappingData;

            // 2. 신고 운영 매핑 (OPER01)
            const report = rawData.find(item => item.operCd === 'OPER01');
            if (report) {
                setReportTime({
                    start: parseToDisplayTime(report.bgngHm),
                    end: parseToDisplayTime(report.endHm),
                    isUsed: report.useYn === 'Y' ? '사용' : '사용안함'
                });
            }

            // 이관 시간은 단일 시간 숫자이므로 start 값에만 해당 값을 채워 화면에 노출합니다.
            setTowTime({
                start: String(towingTimeVal),
                end: "0",
                isUsed: "사용"
            });

            // 4. 자동 운영 매핑 (OPER03)
            const autoSettings = rawData
                .filter(item => item.operCd === 'OPER03')
                .map(item => ({
                    id: item.operStngId,
                    settingNm: item.operCdNm,
                    startTime: parseToDisplayTime(item.bgngHm),
                    endTime: parseToDisplayTime(item.endHm),
                    appliedZone: "전지역 (기본설정)",
                    status: item.useYn === 'Y' ? '활성' : '비활성'
                }));

            setGridData(autoSettings);
            setCheckedRows([]);
        } catch (error) {
            console.error("운영 설정 데이터 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettingData();
    }, [fetchSettingData]);

    // 신고 가능 시간 [수정] 버튼 클릭 핸들러
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

    // 견인 제한 시간 [수정] 버튼 클릭 핸들러
    const handleTowTimeEdit = () => {
        setPopupTitle("견인 자동 이관 시간");
        setPopupInitialData({
            type: 'tow',
            startTime: towTime.start,
            endTime: towTime.end,
            isUsed: towTime.isUsed
        });
        setIsPopupOpen(true);
    };

    // 하단 그리드 자동 모드 시간 수정 버튼 클릭 핸들러
    const handleGridRowUpdate = () => {
        if (checkedRows.length !== 1) {
            alert("수정할 항목을 목록에서 정확히 한 개만 선택해 주세요.");
            return;
        }
        const selectedRow = checkedRows[0];
        setPopupTitle(`${selectedRow.settingNm} 수정`);
        setPopupInitialData({
            type: 'auto', // 자동 모드 수정을 알리는 커스텀 타입 지정
            startTime: selectedRow.startTime,
            endTime: selectedRow.endTime,
            isUsed: selectedRow.status === '활성' ? '사용' : '사용안함'
        });
        setIsPopupOpen(true);
    };


    const handleSaveSetting = async (savedData: SettingData) => {
        if (savedData.type !== 'tow') {
            const startNum = Number(parseToBackendHm(savedData.startTime));
            const endNum = Number(parseToBackendHm(savedData.endTime));

            if (startNum >= endNum) {
                alert("시작 시간은 종료 시간보다 빨라야 합니다. 시간을 다시 확인해 주세요.");
                return;
            }
        }

        try {
            setIsLoading(true);

            //[분기 1] 견인 자동 이관 시간 처리 -> 전용 API 호출
            if (savedData.type === 'tow') {
                const towingPayload = {
                    autoTowingTransferTime: Number(savedData.startTime) // 팝업에서 입력한 숫자
                };
                await updateTowingTimeApi(towingPayload); // 새롭게 정의한 API 호출
            }

            else {
                let targetId: string | null = null;
                let targetOperCd = "";

                if (savedData.type === 'report') {
                    targetOperCd = 'OPER01';
                    const rawList = Object.values(originalSettingsRef.current);
                    const reportItem = rawList.find(item => item.operCd === 'OPER01');

                    if (!reportItem) {
                        alert("수정할 신고 운영 원본 데이터가 존재하지 않습니다.");
                        return;
                    }
                    targetId = reportItem.operStngId;
                }
                else if (savedData.type === 'auto') {
                    targetOperCd = 'OPER03';
                    targetId = checkedRows.length > 0 ? checkedRows[0].id : null;
                }

                if (targetId !== null && !originalSettingsRef.current[targetId]) {
                    alert("수정 대상 원본 설정 데이터를 매칭할 수 없습니다.");
                    return;
                }

                const commonPayload = {
                    operStngId: targetId,
                    operCd: targetOperCd,
                    bgngHm: parseToBackendHm(savedData.startTime),
                    endHm: parseToBackendHm(savedData.endTime),
                    useYn: savedData.isUsed === '사용' ? 'Y' : 'N'
                };

                await updateOperationSettingApi(commonPayload);
            }

            alert("설정이 성공적으로 반영되었습니다.");
            if (settingGridRef.current) {
                settingGridRef.current.clearRowSelection();
            }
            setIsPopupOpen(false);
            await fetchSettingData(); // 목록 새로고침
        } catch (error) {
            console.error("운영 설정 저장 실패:", error);
            alert("서버 저장 처리 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setPopupTitle("자동 모드 시간 등록");
        setPopupInitialData({
            type: 'auto', // 자동 운영 설정 팝업 스타일 공유
            startTime: "00:00", // 등록 시 기본값 설정
            endTime: "00:00",
            isUsed: "사용"
        });
        if (settingGridRef.current) {
            settingGridRef.current.clearRowSelection();
        }

        setCheckedRows([]);
        setIsPopupOpen(true);
    };
    const handleDelete = async () => {
        // 1. 선택된 데이터가 없는 경우 차단
        if (checkedRows.length === 0) {
            alert("삭제할 항목을 목록에서 최소 한 개 이상 선택해 주세요.");
            return;
        }

        // 2. 관리자 실수 방지를 위한 경고창 커스텀 (선택된 개수 노출)
        const confirmMessage = checkedRows.length === 1
            ? `선택하신 자동 모드 설정(${checkedRows[0].startTime} ~ ${checkedRows[0].endTime})을 정말로 삭제하시겠습니까?`
            : `선택하신 총 ${checkedRows.length}개의 자동 모드 설정을 일괄 삭제하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setIsLoading(true);

            // 3. Promise.all을 활용해 선택된 모든 행의 삭제 API를 병렬로 동시 호출
            await Promise.all(
                checkedRows.map(row =>
                    deleteOperationSettingApi({
                        operStngId: row.id, // 각 행의 고유 PK (ex: "STNG_GJS_01")
                        operCd: "OPER03"    // 자동 운영 코드 고정
                    })
                )
            );

            alert("선택한 항목들이 성공적으로 삭제되었습니다.");


            // 4. 삭제 완료 후 상태 최신화 및 그리드 선택 해제
            await fetchSettingData();

        } catch (error) {
            console.error("운영 설정 다중 삭제 실패:", error);
            alert("서버 처리 중 일부 항목의 삭제 작업에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR4500");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

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
                                        <Link prefetch={false}  href={item.path}>{item.name}</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                <div className="subarticle">
                    <div className="setingBox row-two">

                        <section className="seting1">
                            <div className="sectiontop">
                                <h4>신고 가능 시간</h4>
                                <div className="btnSet">
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

                        <section className="seting2">
                            <div className="sectiontop">
                                <h4>견인 자동 이관 시간</h4>
                                <div className="btnSet">
                                    <button onClick={handleTowTimeEdit}>수정</button>
                                </div>
                            </div>
                            <div className="tablebox">
                                <div className="borderbox">
                                    <table className="data-table">
                                        <thead>
                                        <tr>
                                            <th>견인 자동 이관 시간</th>

                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>{towTime.start}</td>

                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="setingBox">
                        <section className="seting3">
                            <div className="sectiontop">
                                <h4>자동 모드 시간</h4>
                                <div className="btnSet">
                                    <button onClick={handleCreate}>+ 등록</button>
                                    <button onClick={handleGridRowUpdate}>수정</button>
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