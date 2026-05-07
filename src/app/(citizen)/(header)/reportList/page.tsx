"use client";

import {useEffect, useState} from "react";
import {getReportList} from "@/services/report/reportApi";
import Link from "next/link";

export default function ReportListPage() {
    const [reportList, setReportList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    if (isLoading) return <div className="loading_box">로딩 중...</div>;

    return (
        <article className="subBoard">
            <h2>신고확인</h2>
            <ul className="listBody">
                {reportList.map((item) => {
                    const isCompleted = ['DEST04', 'DEST08'].includes(item.dclrStts?.cdId);
                    const statusClass = isCompleted ? 'si2' : 'si1';

                    return (
                        <li key={item.dclrId}>
                            {/*<Link href={`/reportList/${item.dclrId}`}>*/}
                            <Link href={`/reportList`}>
                                <p className={`situation ${statusClass}`}>
                                    {item.dclrStts?.cdNm}
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

                                    <div className="img_area">
                                        {item.imgUrls && item.imgUrls[0] && item.imgUrls[0] !== "data:image/jpeg;base64," ? (
                                            <img
                                                src={item.imgUrls[0]}
                                                className="list_img"
                                                alt="신고 이미지"
                                            />
                                        ) : (
                                            <div className="img">
                                                <img src="/images/camera.png" alt="광주시 킥보드 주정차 위반신고"
                                                     className="list_img"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}