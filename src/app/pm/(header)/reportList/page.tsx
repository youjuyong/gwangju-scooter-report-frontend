"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import {pmDcleReportRequestForm, pmDcleReportResponse, staffsResponse} from "@/types/report";
import {getPmDclrCollect, getPmDclrComplete, getPmDclrListApi, getStaffsList} from "@/services/report/reportApi";

export default function ReportList() {
    const router = useRouter();

    // 1. 상태 관리 (필터 및 데이터)
    const [reports, setReports] = useState<pmDcleReportResponse[]>([]);
    const [searchDate, setSearchDate] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // dclrSttsCd
    const [workerFilter, setWorkerFilter] = useState(""); // prcsUserId
    const [loading, setLoading] = useState(false);
    const [staffs, setStaffs] = useState<staffsResponse[]>([]); // 처리자 목록 상태 추가
    // 2. 데이터 페칭 함수
    const fetchReports = async () => {
        setLoading(true);
        try {
            let extractedMonth = "";
            if (searchDate) {
                const dateParts = searchDate.split("-"); // ['2026', '05', '12']
                extractedMonth = `${dateParts[0]}-${dateParts[1]}`; // "2026-05"
            }
            const requestParams: pmDcleReportRequestForm = {
                searchMonth: extractedMonth, // 필요 시 추가
                searchDate: searchDate,
                prcsUserId: workerFilter,
                dclrSttsCd: statusFilter
            };
            console.log(requestParams);
            const data = await getPmDclrListApi(requestParams);
            console.log(data);
            setReports(data || []);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            toast.error("리스트를 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };
    // 2. 처리자 목록 가져오기
    const fetchStaffs = async () => {
        try {
            const data = await getStaffsList();
            console.log(data);
            setStaffs(data || []);
        } catch (error) {
            console.error("처리자 목록 로드 실패:", error);
        }
    };

    // 4. 초기 로드 (리스트 + 처리자 목록)
    useEffect(() => {
        fetchStaffs(); // 컴포넌트 마운트 시 처리자 목록 먼저 가져옴
        fetchReports();
    }, []);

    // 4. 상태별 CSS 클래스 매핑
    const getStatusStyle = (cdId: string) => {
        switch (cdId) {
            case "DEST02": return "si3"; // 신고승인대기 (미배정)
            case "DEST03": return "si1"; // 처리중
            case "DEST04": return "si2"; // 처리완료
            default: return "si3";
        }
    };
    const getStatusText = (cdId: string) => {
        switch (cdId) {
            case "DEST02": return "미배정";
            case "DEST03": return "처리중";
            case "DEST04": return "처리완료";
            default: return "알 수 없음"; // 예외 처리
        }
    };

    const goDetail = (item: pmDcleReportResponse) => {
        const path = item.dclrStts.cdId === "DEST04" ? "detail_2" : "detail";
        router.push(`/pm/reportList/${path}?id=${item.dclrId}`);
    };
    // 회수진행 처리 함수
    const handleCollect = async (dclrId: string) => {
        if (!confirm("회수진행 처리를 하시겠습니까?")) return;

        try {
            await getPmDclrCollect(dclrId); // API 호출
            toast.success("회수진행 처리가 완료되었습니다.");
            fetchReports(); // 🚀 성공 후 리스트 다시 불러오기
        } catch (error) {
            console.error("회수진행 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };
    // 회수진행 처리 함수
    const handleComplete = async (dclrId: string) => {
        if (!confirm("회수완료 처리를 하시겠습니까?")) return;

        try {
            await getPmDclrComplete(dclrId); // API 호출
            toast.success("회수완료 처리가 완료되었습니다.");
            fetchReports(); // 🚀 성공 후 리스트 다시 불러오기
        } catch (error) {
            console.error("회수완료 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };

    return (
       <>
            <article className="subBoard">
                <h2>회수관리</h2>

                <div className="dateselet">
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                </div>

                <div className="searchBox">
                    <dl>
                        <dt>처리상태</dt>
                        <dd>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="">전체</option>
                                {/* value를 빈값으로 두어 fetch 시 조건 분기 */}
                                <option value="DEST02">미배정</option>
                                <option value="DEST03">처리중</option>
                            </select>
                        </dd>
                        <dt>처리자</dt>
                        <dd>
                            {/* 🚀 동적 처리자 셀렉트박스 */}
                            <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
                                <option value="">전체</option>
                                {staffs.map((staff) => (
                                    <option key={staff.userId} value={staff.userId}>
                                        {/* staff.deptNm이 객체이므로 그 안의 deptNm 문자열을 꺼내야 함 */}
                                        {staff.userNm} ({staff.deptNm?.deptNm || "부서없음"})
                                    </option>
                                ))}
                            </select>
                        </dd>
                    </dl>
                    <button className="btn_search" onClick={fetchReports}>검색</button>
                </div>

                <div className="searchResult">
                    결과<span>{reports.length}</span>건
                </div>

                <ul className="listBody">
                    {loading ? (
                        <li style={{ textAlign: "center", padding: "20px" }}>로딩 중...</li>
                    ) : reports.length === 0 ? (
                        <li style={{ textAlign: "center", padding: "20px" }}>데이터가 없습니다.</li>
                    ) : (
                        reports.map((item) => (
                            <li key={item.dclrId}>
                                <div className="list_item_card" onClick={() => goDetail(item)} style={{ cursor: 'pointer' }}>
                                    <p className={`situation ${getStatusStyle(item.dclrStts.cdId)}`}>
                                        {getStatusText(item.dclrStts.cdId)}
                                    </p>
                                    <p className="add">{item.dclrAddrTxt}</p>
                                    <div className="listconten">
                                        <div className="leftbox">
                                            <dl><dt>신고일시</dt><dd>{item.regDt.substring(0, 16)}</dd></dl>
                                            <dl><dt>킥보드ID</dt><dd>{item.qrcdVl}</dd></dl>
                                            <dl><dt>위반유형</dt><dd>{item.vltnType.cdNm}</dd></dl>
                                            <dl><dt>상세설명</dt><dd>{item.dclrCn}</dd></dl>
                                            <dl><dt>처리자</dt><dd>{item.prcr?.userNm || "-"}</dd></dl>
                                            <dl><dt>처리일시</dt><dd className="blue">{item.prcr?.prcDt || "-"}</dd></dl>
                                        </div>
                                        <img
                                            src={item.imgUrls?.[0] || "/images/main_all_img.png"}
                                            className="list_img"
                                            alt="신고이미지"
                                        />
                                    </div>

                                    <div className="listbtnset" onClick={(e) => e.stopPropagation()}>
                                        {item.dclrStts.cdId === "DEST03" && (
                                            <button className="btn_complete"
                                                    onClick={() => handleComplete(item.dclrId)}>완료처리
                                            </button>
                                        )}
                                        {item.dclrStts.cdId === "DEST02" && (
                                            <>
                                            <button className="btn_complete"
                                                        onClick={() => handleComplete(item.dclrId)}>완료처리
                                                </button>
                                                <button
                                                    className="btn_acc"
                                                    onClick={() => handleCollect(item.dclrId)}>
                                                    회수진행
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </article>
       </>
    );
}