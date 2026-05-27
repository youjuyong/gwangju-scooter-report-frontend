"use client";

import React, {useEffect, useState} from "react";
import {getReportList} from "@/services/report/reportApi";
import {useRouter} from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function ReportListPage() {
    const [reportList, setReportList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await getReportList();
                if (res.success) {
                    setReportList(res.data);
                }
            } catch (error) {
                console.error("목록 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
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
                        const isCompleted = ['DEST04', 'DEST08'].includes(item.dclrStts?.cdId);
                        const statusClass = isCompleted ? 'si2' : 'si1';
                        const firstImage = (item.imgUrls && item.imgUrls.length > 0 && item.imgUrls[0].startsWith("data:image"))
                            ? item.imgUrls[0]
                            : "/images/camera.png";

                        return (
                            <li key={item.dclrId} onClick={() => getDetail(item.dclrId)}>
                                <a>

                                    <p className={`situation ${statusClass}`}>
                                        {isCompleted ? "처리완료" : "처리중"}
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
                                                <dd className="blue">{item.prcsDt || "-"}</dd>
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