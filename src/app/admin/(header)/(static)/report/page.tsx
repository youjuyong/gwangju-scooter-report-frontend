"use client";

import React, {useEffect, useMemo, useState, useCallback, useRef, useContext} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";
import {AdminReportForm, AdminReportResponse} from "@/types/adminReport";
import api from "@/services/api";
import {getReportListApi} from "@/services/report/adminReportApi";
import ReportDetailPopup from "@/components/admin/popup/ReportDetailPopup";
import ExcelDownload from "@/components/admin/ExcelDownload";
import {ExcelContext} from "@/components/admin/ExcelContext";

interface PmCompany {
    bzentyId: string;
    bzentyNm: string;
}

export default function ReportPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 검색 필터 상태 관리 (기능 컴포넌트화를 위한 state)
    const [startDate, setStartDate] =  useState(new Date().toISOString().split('T')[0]);
    const [pmCompanyList, setPmCompanyList] = useState<PmCompany[]>([]);
    const [statusOptions, setStatusOptions] = useState<any[]>([]);
    const [endDate, setEndDate] =  useState(new Date().toISOString().split('T')[0]);
    const [pmCompany, setPmCompany] = useState('전체');
    const [status, setStatus] = useState('전체');
    const [keyword, setKeyword] = useState('');

    //그리드
    const [reportGridData, setNoticeGridData] = useState<AdminReportResponse[]>([]);
    const reportGridRef = useRef<RaontecGridHandle>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string >('');
    const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null); // 단일 행 클릭 데이터 State

    //엑셀
    const {setGrid, setFileName}: any = useContext(ExcelContext);

    // 2. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'report', name: '신고처리이력', path: `/${userRole}/report` },
        { id: 'personal', name: '개인정보파기이력', path: `/${userRole}/personal` },
        { id: 'statistic', name: '민원처리통계', path: `/${userRole}/statistic01` },
        { id: 'menuStat', name: '메뉴기능활용통계', path: `/${userRole}/statistic_menu01` },
    ];

    useEffect(() => {
        //pm사 조회
        const fetchPmCompanies = async () => {
            try {
                const response = await api.get('/pm/pm-companies');
                const data = response.data;
                setPmCompanyList(data);

            } catch (error) {
                console.error("PM사 목록 로드 실패:", error);
            }
        };
        //처리상태 옵션 조회
        const fetchDestList = async ()=>{
            try{
                const response = await api.get('/code/DEST');
                const data = response.data.data;
                setStatusOptions(data);
            }catch (error){
                console.error("처리상태 리스트 로드 실패:", error);
            }
        };

        fetchDestList();
        fetchPmCompanies();
    }, []);

    //엑셀 다운로드
    useEffect(() => {
        if (reportGridRef.current) {
            setGrid(reportGridRef.current);
            setFileName("신고처리이력");
        }
    }, [reportGridData, setGrid, setFileName]);
    // 이력 데이터 조회
    const fetchData = useCallback(async (searchParams: AdminReportForm) => {
        try {
            const result = await getReportListApi(searchParams);
            setNoticeGridData(result);

            setSelectedReport(null);
            reportGridRef.current?.clearSelectedRow();
            reportGridRef.current?.clearRowSelection();
        } catch (error) {
            console.error(error);
        }
    }, []);

    const reportGridColumns = useMemo<CustomColumnDef<AdminReportResponse>[]>(() => [
        {
            header : '이력ID',
            accessorKey : 'prcsHstryId',
            meta: { id: 'prcsHstryId', isKey: true } // 고유 Key(PK) 설정
        }
        ,
        {
            header: '신고일시',
            accessorKey: 'dclDt',
            meta: { filterType: "check" }

        },
        {
            header: '신고ID',
            accessorKey: 'dclrId',
        },
        {
            header: 'PM사',
            accessorKey: 'bzentyNm',
            meta: { filterType: "check" }
        },
        {
            header: '킥보드ID',
            accessorKey: 'qrVal',
        },
        {
            header: '주소',
            accessorKey: 'dclrAddrTxt',
        },
        {
            header: '위반유형',
            accessorKey: 'vltnTypeNm',
            meta: { filterType: "check" }
        },
        {
            header: '신고자ID(*마스킹)',
            accessorKey: 'dclrUserId',
            enableColumnFilter: false
        },
        {
            header: '수거자',
            accessorKey: 'prcrId',
        },
        {
            header: '처리상태',
            accessorKey: 'prcsStpNm' , // 타입 에러 방지용 키 지정 (아무 키나 상관없음)
            meta: { filterType: "check" }
        },
    ], []);

    const handleSearch = () => {
        const requestData: AdminReportForm = {
            startDate: startDate,
            endDate: endDate,
            bzentyId: pmCompany === '전체' ? null : pmCompany,    // pmCompany 값을 bzentyId로 변경
            dclrSttsCd: status === '전체' ? null : status,     // status 값을 dclrSttsCd로 변경
            keyword: keyword,
        };

        fetchData(requestData);
    };

    // 엑셀 저장 버튼 이벤트 핸들러
    const handleExcelDownload = () => {
        console.log('엑셀 다운로드 실행');
    };

    const onClickReportRow = (rowData: any) => {
        if (rowData.rowKey && selectedReport?.bzentyId === rowData.bzentyId) {
      //      setSelectedNotice(null);
            return;
        }
        console.log(rowData);
            setSelectedReportId(rowData.bzentyId);
            setSelectedReport(rowData);
            setIsDetailOpen(true);
        console.log("선택된 행 데이터 피드백:", rowData);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="wrap report_wrap">
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소가 설정된 메뉴의 path와 완전히 일치하면 'click' 클래스 부여
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

            {/* 오른쪽 서브 아티클 (검색 및 그리드) 영역 */}
            <div className="subarticle">
                {/* 검색영역 */}
                <div className="searchBox">
                    <div className="search_left">
                        <dl className="dlfirst">
                            <dt>기간</dt>
                            <dd>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                ~
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </dd>
                        </dl>
                        <dl className="dlnth2">
                            <dt>PM사</dt>
                            <dd>
                                <select
                                    className="pmsel"
                                    value={pmCompany}
                                    onChange={(e) => setPmCompany(e.target.value)}
                                >
                                    <option value="전체">전체</option>
                                    {pmCompanyList.length === 0 ? (
                                        <option value="">등록된 PM사 없음</option>
                                    ) : (
                                        pmCompanyList.map((company) => (
                                            <option key={company.bzentyId} value={company.bzentyId}>
                                                {company.bzentyNm}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </dd>
                            <dt>처리상태</dt>
                            <dd>
                                <select
                                    className="sisel"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="전체">전체</option>
                                    {statusOptions.map((item) => (
                                        // 사용자에게는 cdNm(신고승인데기 등)을 보여주고, 진짜 값은 cdId(DEST01 등)로 관리
                                        <option key={item.cdId} value={item.cdId}>
                                            {item.cdNm}
                                        </option>
                                    ))}
                                </select>
                            </dd>
                        </dl>
                        <dl className="dlnth3">
                            <dt>검색어</dt>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="검색어 입력"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>
                    <ExcelDownload></ExcelDownload>
                </div>

                {/* 데이터 결과 영역 */}
                <div className="infoContent">
                    <div className="gridbox">
                        {/*<div>그리드(그리드내부스크롤, 창 사이즈에 따라 실시간으로 사이즈 변하게)</div>*/}
                        <RaontecTanstackGrid
                            ref={reportGridRef}
                            data={reportGridData}
                            columns={reportGridColumns}
                            globalCellClickEvent={onClickReportRow} // 클릭 하이라이트 및 수정 연동
                            // enablePagination={true}
                  //          rowsPerPage={10}
                          //  globalCellDbClickEvent={onClickReportRow}
                        />
                    </div>
                </div>
            </div>
            {isDetailOpen && selectedReport && (
                <ReportDetailPopup
                    data={selectedReport}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedReportId('');
                        setSelectedReport(null);
                    }}

                    isOpen={isDetailOpen}
                    bzentyId={selectedReportId}
                    onRefreshList={()=> fetchData({
                        startDate: startDate,
                        endDate: endDate,
                        bzentyId: pmCompany,    // pmCompany 값을 bzentyId로 변경
                        dclrSttsCd: status === '전체' ? null : status,     // status 값을 dclrSttsCd로 변경
                        keyword: keyword,
                    })}
                />
            )}
        </div>
    );
}