"use client";

import Cookies from "js-cookie";
import React, {useEffect, useState} from "react";
import {getReportList} from "@/services/report/reportApi";
import {useRouter} from "next/navigation";
import {registerGuestMenuLog} from "@/services/common/commonApi";
import LoadingOverlay from "@/components/LoadingOverlay";

const pmtoken = Cookies.get("reporterAccessToken");

export default function ReportListPage() {
    const [reportList, setReportList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await getReportList(pmtoken);
                if (res.success) {
                    setReportList(res.data);
                }
            } catch (error) {
                console.error("목록 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        const recordMenuLog = async () => {
            try {
                await registerGuestMenuLog("CIT3000");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
        fetchList();
    }, []);

    const getDetail = (id: string) => {
        router.push(`/reportDetail/${id}`);
    };

    return (
        <article className="subBoard">
            <h2>신고확인</h2>
            <ul className="listBody">
                {isLoading ? (
                    <LoadingOverlay
                        message={"데이터를 로딩중입니다.."}
                    />
                ) : reportList.length === 0 ? (
                    <p className="none renone">신고 내역이 없습니다.</p>
                ) : (
                    reportList.map((item) => {
                        const statusCode = item.dclrStts?.cdId;
                        const isCompleted = ['DEST04', 'DEST05', 'DEST09', 'DEST10'].includes(statusCode);
                        const statusClass = isCompleted ? 'si2' : 'si1';
                        const firstImage = (item.imgUrls && item.imgUrls.length > 0 && item.imgUrls[0].startsWith("data:image"))
                            ? item.imgUrls[0]
                            : "/images/camera.png";

                        let statusText = "처리중";
                        if (statusCode === 'DEST10') {
                            statusText = "자동취소";
                        } else if (statusCode === 'DEST05') {
                            statusText = "취소";
                        } else if (isCompleted) {
                            statusText = "처리완료";
                        }

                        return (
                            <li key={item.dclrId} onClick={() => getDetail(item.dclrId)}>
                                <a>

                                    <p className={`situation ${statusClass}`}>
                                        {statusText}
                                    </p>
                                    <p className="add">{item.dclrAddrTxt}</p>

                                    <div className="listconten">
                                        <div className="leftbox">
                                            <dl>
                                                <dt>신고일시</dt>
                                                <dd>{item.regDt}</dd>
                                            </dl>
                                            <dl>
                                                <dt>킥보드ID</dt>
                                                <dd>{item.qrcdVl}</dd>
                                            </dl>
                                            <dl>
                                                <dt>위반유형</dt>
                                                <dd>{item.vltnType?.cdNm}</dd>
                                            </dl>
                                            <dl>
                                                <dt>상세설명</dt>
                                                <dd>{item.dclrCn}</dd>
                                            </dl>
                                            <dl>
                                                <dt>처리일시</dt>
                                                <dd className="blue">{item.prcrHis?.prcsDt || "-"}</dd>
                                            </dl>
                                        </div>

                                        <img
                                            src={firstImage}
                                            className="list_img"
                                            alt="신고된이미지"
                                        />
                                    </div>
                                </a>
                            </li>
                        );
                    })
                )}
            </ul>
        </article>
    );
}