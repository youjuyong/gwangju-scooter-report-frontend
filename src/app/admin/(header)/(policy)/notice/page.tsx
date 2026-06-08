"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import {addNoticeListApi, getMainNoticeListApi} from "@/services/notice/noticeApi";
import NoticeModal from "@/components/admin/popup/NoticePopup";
import {NoticeAddRequestForm} from "@/types/notice";
import {registerGuestMenuLog} from "@/services/common/commonApi";

// 💡 보내주신 실제 API 응답 규격 반영
export interface NoticeResponse {
    ntcId: string;
    ntcTypeCd: {
        cdId: string;
        cdNm: string;
    };
    ntcTypeNm: string | null;
    ttlNm: string;        // 제목
    cnData: string;       // 내용
    verVl: string | null;
    mainExpsrYn: string;  // 메인 노출 여부 ('Y' / 'N')
    regDt: string;        // 등록일
    expsrBgngDt : string ;
    expsrEndDt :  string ;
    files : string | null;
    inqCnt : number;
    targets : string | null;
    mdfcnDt : string;
    writer :{
        userNm :string;
    }
}

export default function NoticePage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 상태 관리 (검색어 및 그리드 데이터)
    const [keyword, setKeyword] = useState('');
    const [noticeGridData, setNoticeGridData] = useState<NoticeResponse[]>([]); // 그리드 데이터 State
    const [checkedNotices, setCheckedNotices] = useState<NoticeResponse[]>([]); // 체크박스 선택 데이터 State
    const [selectedNotice, setSelectedNotice] = useState<NoticeResponse | null>(null); // 단일 행 클릭 데이터 State

    // 2. 그리드 제어용 Ref 선언
    const noticeGridRef = useRef<RaontecGridHandle>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 3. 💡 실제 API 규격 명칭에 맞게 컬럼 매핑(accessorKey) 수정
    const noticeGridColumns = useMemo<CustomColumnDef<NoticeResponse>[]>(() => [
        {
            header: '글번호',
            accessorKey: 'ntcId',
            meta: { id: 'ntcId', isKey: true } // 고유 Key(PK) 설정
        },
        {
            header: '제목',
            accessorKey: 'ttlNm',

        },
        {
            header: '사단고정',
            accessorKey: 'mainExpsrYn',
            meta: { filterType: "check" }
        },
        // {
        //     header: '첨부파일',
        //     accessorKey: 'files',
        //     enableColumnFilter: false
        // },
        {
            header: '작성자',
            accessorKey: 'writer.userNm' as any,
        },
        {
            header: '수정일시',
            accessorKey: 'regDt',
            enableColumnFilter: false
        },
        {
            header: '조회수',
            accessorKey: 'inqCnt',
            enableColumnFilter: false
        },
        {
            header: '표출범위',
            accessorKey: 'targets',
        },
        {
            header: '표출시작일',
            accessorKey: 'expsrBgngDt',
            enableColumnFilter: false
        },
        {
            header: '표출종료일',
            accessorKey: 'expsrEndDt',
            enableColumnFilter: false
        },
        {
            header: '현재표출여부', //todo 컬럼 추가되면 내용 단순화하기
            accessorKey: 'currentExpsrYn' as any, // 타입 에러 방지용 키 지정 (아무 키나 상관없음)
            enableColumnFilter: false,
            cell: ({ row }) => {
                const { expsrBgngDt, expsrEndDt } = row.original;

                if (!expsrBgngDt || !expsrEndDt) return 'N';

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const startDate = new Date(expsrBgngDt);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(expsrEndDt);
                endDate.setHours(0, 0, 0, 0);

                const isExposing = today >= startDate && today <= endDate;
                return isExposing ? 'Y' : 'N';
            }
        },
    ], []);

    // 4. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'notice', name: '공지사항', path: `/${userRole}/notice` },
        { id: 'policy', name: '약관관리', path: `/${userRole}/policy` },
    ];

    // 5. 공지사항 목록 API 연동 조회 함수
    const fetchNotices = useCallback(async (searchKeyword = '') => {
        try {
           // 실제 프로젝트 연동 방식 예시:
             const result = await getMainNoticeListApi({
                page: 0,
                size: 999,
            });
            setNoticeGridData(result);
            console.log(result);

            // 데이터 갱신 시 기존 선택 상태 초기화
            setSelectedNotice(null);
            noticeGridRef.current?.clearSelectedRow();
            noticeGridRef.current?.clearRowSelection();
        } catch (error) {
            console.error("공지사항 목록 로딩 실패:", error);
        }
    }, []);

    // 페이지 첫 진입 시 리스트 로드
    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    // 6. 그리드 행(Row) 클릭 이벤트 처리
    const onClickNoticeRow = (rowData: any) => {
        if (rowData.rowKey && selectedNotice?.ntcId === rowData.ntcId) {
            setSelectedNotice(null);
            return;
        }
        setSelectedNotice(rowData);
        console.log("선택된 행 데이터 피드백:", rowData);
    };

    const handleDelete = () => {
        if (checkedNotices.length <= 0) {
            alert("삭제할 공지사항 항목들을 왼쪽 체크박스에서 선택해 주세요.");
            return;
        }
        if (window.confirm(`선택된 ${checkedNotices.length}건의 공지사항을 정말 삭제하시겠습니까?`)) {
            const deleteIds = checkedNotices.map(item => item.ntcId);
            console.log("삭제 타겟 ntcIds:", deleteIds);
        }
    };

    const handleSearch = () => {
        fetchNotices(keyword);
    };

    // 등록 버튼 클릭 이벤트 수정
    const handleCreate = () => {
        setIsModalOpen(true); // 모달 열기
    };

    // 💡 모달에서 '저장' 버튼을 최종적으로 눌렀을 때 실행되는 함수
    const handleSaveNotice = async (formData: NoticeAddRequestForm) => {
        try {
            // 통신 시작 전 로더를 띄우거나 버튼 더블클릭 방지 로직을 두면 좋습니다.
            console.log(formData);
            const result = await addNoticeListApi(formData);

            alert("공지사항이 성공적으로 등록되었습니다.");

            setIsModalOpen(false); // 팝업 닫기
            fetchNotices();        // 메인 그리드 목록 새로고침
        } catch (error) {
            console.error("공지사항 등록 실패:", error);
            alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    //메뉴 이동 이력
    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerGuestMenuLog("OPR3100");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);
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
                                    <Link href={item.path}>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 오른쪽 서브 아티클 영역 */}
            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">
                    {/* 제어 버튼 그룹 */}
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        {/*<button onClick={handleUpdate}>수정</button>*/}
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
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>
                </div>

                {/* 데이터 결과 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        {/* 라온텍 그리드 주입 */}
                        <RaontecTanstackGrid
                            ref={noticeGridRef}
                            data={noticeGridData}
                            columns={noticeGridColumns}
                            enableRowSelection={true} // 다중 체크박스 활성화
                            onSelectionChange={(selectedRows: NoticeResponse[]) => setCheckedNotices(selectedRows)}
                            globalCellClickEvent={onClickNoticeRow} // 클릭 하이라이트 및 수정 연동
                            // enablePagination={true}
                            // rowsPerPage={10}
                        />
                    </div>
                </div>
            </div>
            <NoticeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveNotice}
            />
        </div>

    );
}