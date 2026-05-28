// src/components/ReportBoardList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { pmDcleReportRequestForm, pmDcleReportResponse, staffsResponse } from "@/types/report";
import { getTowDclrCollect, getTowDclrListApi, getStaffsList } from "@/services/report/reportApi_tow";
import {useAuthStore} from "@/store/authStore";
import LoadingOverlay from "@/components/LoadingOverlay";
import {useAlert} from "@/components/popup/PopupProvider";

interface ReportBoardListProps {
    prefix: "/pm" | "/tow" | ""; // 이동할 상세 페이지의 URL Prefix
    token: string | undefined;   // 쿠키나 세션에서 가져온 인증 토큰
    title?: string;              // 페이지 제목 (기본값: 회수관리)
}

export default function ReportList({
                                       prefix,
                                       token,
                                       title = "회수관리"
                                   }: ReportBoardListProps) {
    const router = useRouter();

    // 1. 상태 관리 (필터 및 데이터)
    const [reports, setReports] = useState<pmDcleReportResponse[]>([]);
    const [searchDate, setSearchDate] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // dclrSttsCd
    const [workerFilter, setWorkerFilter] = useState(""); // prcsUserId
    const [loading, setLoading] = useState(false);
    const [staffs, setStaffs] = useState<staffsResponse[]>([]); // 처리자 목록

    const towUserInfo = useAuthStore((state) => state.tow.userInfo);
    const currentUserName = towUserInfo?.id; // 로그인한 유저의 name
    const showAlert = useAlert();
    // 2. 데이터 페칭 함수
    const fetchReports = async () => {
        setLoading(true);
        try {
            let extractedMonth = "";
            if (searchDate) {
                const dateParts = searchDate.split("-");
                extractedMonth = `${dateParts[0]}-${dateParts[1]}`;
            }
            const requestParams: pmDcleReportRequestForm = {
                searchMonth: extractedMonth,
                searchDate: searchDate,
                prcsUserId: workerFilter,
                dclrSttsCd: statusFilter
            };
           const data = await getTowDclrListApi(requestParams, token);
           setReports(data || []);
        } catch (error) {
            console.error(`${title} 데이터 로드 실패:`, error);
            toast.error("리스트를 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 3. 처리자 목록 가져오기
    const fetchStaffs = async () => {
        try {
            const data = await getStaffsList();
            setStaffs(data || []);
        } catch (error) {
            console.error("처리자 목록 로드 실패:", error);
        }
    };

    // 4. 초기 로드
    useEffect(() => {
        fetchStaffs();
        fetchReports();
    }, []);

    // 5. 상태별 CSS 클래스 및 텍스트 매핑
    const getStatusStyle = (cdId: string) => {
        switch (cdId) {
            case "DEST07": return "si3"; // 미배정
            case "DEST08": return "si1"; // 처리중
            case "DEST09": return "si2"; // 처리완료
            default: return "si3";
        }
    };

    const getStatusText = (cdId: string) => {
        switch (cdId) {
            case "DEST07": return "견인요청";
            case "DEST08": return "견인접수";
            case "DEST09": return "견인완료";
            default: return "알 수 없음";
        }
    };

    // 상세 페이지 이동
    const goDetail = (item: pmDcleReportResponse) => {
        router.push(`${prefix}/reportDetail/${item.dclrId}`);
    };

    // 회수진행 처리 함수
    const handleCollect = async (dclrId: string) => {
        if (!await showAlert("회수진행 처리를 하시겠습니까?")) return;
        try {
            await getTowDclrCollect(dclrId);
            toast.success("회수진행 처리가 완료되었습니다.");
            fetchReports();
        } catch (error) {
            console.error("회수진행 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };

    // 회수완료 처리 함수
    const handleComplete = async (dclrId: string) => {
        router.push(`${prefix}/reportDetail/${dclrId}`);
    };

    return (
        <article className="subBoard">
            <h2>{title}</h2>

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
                            <option value="DEST07">견인요청</option>
                            <option value="DEST08">견인접수</option>
                        </select>
                    </dd>
                    <dt>처리자</dt>
                    <dd>
                        <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
                            <option value="">전체</option>
                            {staffs.map((staff) => (
                                <option key={staff.userId} value={staff.userId}>
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
                    <LoadingOverlay
                        message={"데이터를 로딩 중입니다..."}
                    />
                ) : reports.length === 0 ? (
                    <p className="none renone">신고 내역이 없습니다.</p>
                ) : (
                    reports.map((item) => (
                        <li key={item.dclrId}>
                            <div className="list_item_card" onClick={() => goDetail(item)} style={{cursor: 'pointer'}}>
                                <p className={`situation ${getStatusStyle(item.dclrStts.cdId)}`}>
                                    {getStatusText(item.dclrStts.cdId)}
                                </p>
                                <button
                                    className="mapgo"
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        const locationData = {
                                            lat: item.latVl,
                                            lng: item.lotVl,
                                            dclrId: item.dclrId
                                        };
                                        sessionStorage.setItem("selected_kickboard_loc", JSON.stringify(locationData));

                                        router.push(prefix || "/");
                                    }}
                                >
                                    지도보기
                                </button>
                                <p className="add">{item.dclrAddrTxt}</p>
                                <div className="listconten">
                                    <div className="leftbox">
                                        <dl>
                                            <dt>신고일시</dt>
                                            <dd>{item.regDt.substring(0, 16)}</dd>
                                        </dl>
                                        <dl>
                                            <dt>킥보드ID</dt>
                                            <dd>{item.qrcdVl}</dd>
                                        </dl>
                                        <dl>
                                            <dt>위반유형</dt>
                                            <dd>{item.vltnType.cdNm}</dd>
                                        </dl>
                                        <dl>
                                            <dt>상세설명</dt>
                                            <dd>{item.dclrCn}</dd>
                                        </dl>
                                        <dl>
                                            <dt>처리자</dt>
                                            <dd>{item.prcrHis?.prcr?.userNm || "-"}</dd>
                                        </dl>
                                        <dl>
                                            <dt>처리일시</dt>
                                            <dd className="blue">{item.prcrHis?.prcsDt || "-"}</dd>
                                        </dl>
                                    </div>
                                    <img
                                        src={item.imgUrls?.[0] || "/images/main_all_img.png"}
                                        className="list_img"
                                        alt="신고이미지"
                                    />
                                </div>

                                <div className="listbtnset" onClick={(e) => e.stopPropagation()}>
                                    {item.dclrStts?.cdId === "DEST08" && currentUserName && currentUserName === item.prcrHis?.prcr?.userId && (
                                        <button className="btn_complete" onClick={() => handleComplete(item.dclrId)}>
                                            완료처리
                                        </button>
                                    )}
                                    {item.dclrStts.cdId === "DEST07" && (
                                        <>
                                            <button className="btn_complete"
                                                    onClick={() => handleComplete(item.dclrId)}>
                                                완료처리
                                            </button>
                                            <button className="btn_acc" onClick={() => handleCollect(item.dclrId)}>
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
    );
}