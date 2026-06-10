"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";

// API 및 팝업 컴포넌트 임포트
import {createPmCompanyApi, getPmCompanyListApi, updatePmCompanyApi} from "@/services/system/systemApi";
import PmPopup from "@/components/admin/popup/PmPopup";
import LoadingOverlay from "@/components/LoadingOverlay";


// 💡 확정된 백엔드 응답 인터페이스 정의
export interface pmResponse {
    bzentyId: string;
    bzentyNm : string;
    qrcdUrlForm : string;
    qrcdIdExtrRule: string;
    markImgId: string;
    markImgBase64: string; // Base64 이미지 데이터
}

export default function PmPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리
    const [gridData, setGridData] = useState<pmResponse[]>([]);
    const [checkedRows, setCheckedRows] = useState<pmResponse[]>([]);
    const [selectedRow, setSelectedRow] = useState<pmResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // 모달 제어 상태
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupInitialData, setPopupInitialData] = useState<{
        bzentyId?: string;
        bzentyNm: string;
        logoUrl?: string;       // 신규 업로드용 프리뷰
        markImgBase64?: string; //  Base64 데이터 추가
        qrcdUrlForm?: string;
        qrcdIdExtrRule?: string;
    } | null>(null);

    // 그리드 핸들러 Ref
    const pmGridRef = useRef<RaontecGridHandle>(null);

    // 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '권역코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 2. 💡 백엔드 응답 Spec에 맞춘 라온텍 그리드 컬럼 정의
    const pmGridColumns = useMemo<CustomColumnDef<pmResponse>[]>(() => [

        {
            header: '로고 이미지',
            accessorKey: 'markImgBase64' as any,
            enableColumnFilter: false,
            enableSorting: false,
            cell: ({ row }) => {
                const rowData = row.original as pmResponse;
                let base64Data = rowData.markImgBase64;
                if (base64Data) {
                    // 순수 base64 데이터만 남기기 위해 기존에 붙어있는 접두사 패턴들을 전부 제거
                    base64Data = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                    // 혹시 한 번 더 반복되어 남아있을 접두사까지 완전히 제거
                    base64Data = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                }

                return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        {base64Data ? (
                            <img
                                // 💡 정제된 순수 데이터 앞에 표준 접두사를 단 한 번만 명확하게 조립
                                src={`data:image/jpeg;base64,${base64Data}`}
                                alt="업체 로고"
                                style={{
                                    maxWidth: '70px',
                                    maxHeight: '70px',
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                    border: '1px solid #eee'
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span style={{ color: '#ccc', fontSize: '12px' }}>이미지 없음</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: '업체 고유 ID',
            accessorKey: 'bzentyId',
            meta: { id: 'bzentyId', isKey: true }
        },
        {
            header: 'PM 업체명',
            accessorKey: 'bzentyNm',
        },
        {
            header: 'QR코드 URL 포맷',
            accessorKey: 'qrcdUrlForm',
            enableColumnFilter: false,
        },
        {
            header: 'QR ID 추출 규칙',
            accessorKey: 'qrcdIdExtrRule',
            enableColumnFilter: false,
        }
    ], [selectedRow]);

    // 데이터 조회 함수 (목록 갱신)
    const fetchPmCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getPmCompanyListApi();
            setGridData(data);

            setSelectedRow(null);
            setCheckedRows([]);
            pmGridRef.current?.clearSelectedRow();
            pmGridRef.current?.clearRowSelection();
        } catch (error) {

            console.error("PM업체 목록 조회 실패:", error);
        }finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPmCompanies();
    }, [fetchPmCompanies]);


    const handleCreate = () => {
        setPopupInitialData(null);
        setIsPopupOpen(true);
    };

    // 수정 모션 진입 시 변경된 pmResponse 스펙 적용
    const handleUpdate = () => {
        const target = selectedRow || (checkedRows.length === 1 ? checkedRows[0] : null);

        if (!target) {
            alert("수정할 업체를 목록에서 한 개 선택해 주세요.");
            return;
        }

        setPopupInitialData({
            bzentyId: target.bzentyId,
            bzentyNm: target.bzentyNm,
            markImgBase64: target.markImgBase64, // 💡 Base64 데이터 통째로 팝업에 바인딩
            qrcdUrlForm: target.qrcdUrlForm || '',
            qrcdIdExtrRule: target.qrcdIdExtrRule || ''
        });
        setIsPopupOpen(true);
    };

    const handleDelete = async () => {
        const targets = checkedRows.length > 0 ? checkedRows : (selectedRow ? [selectedRow] : []);

        if (targets.length <= 0) {
            alert("삭제할 업체를 체크박스에서 선택해 주세요.");
            return;
        }
        setIsLoading(true);
        if (window.confirm(`선택된 ${targets.length}개의 업체를 정말로 삭제하시겠습니까?`)) {
            try {
                const targetIds = targets.map(item => item.bzentyId);
               // await Promise.all(targetIds.map(id => deletePmCompanyApi(id)));
                alert("성공적으로 삭제되었습니다.");
                fetchPmCompanies();
            } catch (error) {
                console.error("삭제 실패:", error);
                alert("삭제 중 오류가 발생했습니다.");
            }finally {
                setIsLoading(false);
            }
        }
    };

    const handleSavePmCompany = async (formData: FormData) => {
        try {
            // formData 안에 bzentyId가 존재하면 '수정', 없으면 '등록'
            const isUpdate = formData.has('bzentyId');

            if (isUpdate) {
                await updatePmCompanyApi(formData);
                alert("PM업체 정보가 성공적으로 수정되었습니다.");
            } else {
                await createPmCompanyApi(formData);
                alert("PM업체 정보가 성공적으로 등록되었습니다.");
            }

            fetchPmCompanies();
        } catch (error) {
            console.error("PM업체 저장 처리 실패:", error);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="wrap">
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
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

            <div className="subarticle">
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>
                </div>

                <div className="infoContent">
                    <div className="gridbox" >
                        <RaontecTanstackGrid
                            ref={pmGridRef}
                            data={gridData}
                            columns={pmGridColumns}
                            rowHeight ={100}
                            enableRowSelection={true}
                            onSelectionChange={(rows: pmResponse[]) => setCheckedRows(rows)}
                        />
                    </div>
                </div>
            </div>

            <PmPopup
                isOpen={isPopupOpen}
                initialData={popupInitialData}
                onClose={() => {
                    setIsPopupOpen(false);
                    setPopupInitialData(null);
                }}
                onSave={handleSavePmCompany}
            />
        </div>
    );
}