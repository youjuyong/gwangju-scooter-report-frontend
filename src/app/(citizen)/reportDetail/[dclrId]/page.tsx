"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import "@/css/base_style.css";
import "@/css/style.css";
import {getReportDetail} from "@/services/report/reportApi";

export default function ReportDetail() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {dclrId} = useParams<{ dclrId: string }>();

    useEffect(() => {
        const fetchDetail = async () => {
            if (!dclrId) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await getReportDetail(dclrId);
                if (res.success) {
                    setReport(res.data);
                }
            } catch (error) {
                console.error("상세 내역 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [dclrId]);

    if (isLoading) return <div className="loading_box">로딩 중...</div>;
    if (!report) return <div className="loading_box">내역을 찾을 수 없습니다.</div>;

    const isCompleted = ["DEST04", "DEST08"].includes(report.dclrStts?.cdId);
    const statusClass = isCompleted ? "si2" : "si1";

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="noMenubody noMenubodyLine">
            <header>
                <h1>신고 확인 조치 결과</h1>
                <button type="button" className="back" onClick={handleBack}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="detailBox">
                    <p className={`situation ${statusClass}`}> {/*.si1:처리중 , si2: 처리완료*/}
                        {report.dclrStts?.cdNm || "처리중"} {/*도로명 주소만 나옴*/}
                    </p>
                    <p className="add">{report.dclrAddrTxt}</p>
                    <dl>
                        <dt>신고일시</dt>
                        <dd>{report.regDt}</dd>
                    </dl>
                    <dl>
                        <dt>킥보드ID</dt>
                        <dd>{report.qrcdVl}</dd>
                    </dl>
                    <dl>
                        <dt>위반유형</dt>
                        <dd>{report.vltnType?.cdNm}</dd>
                    </dl>
                    <dl>
                        <dt>상세설명</dt>
                        <dd>{report.dclrCn || "상세 설명이 없습니다."}</dd>
                    </dl>
                    <dl>
                        <dt className="result_photo_title">등록한 사진</dt>
                        <dd className="result_meimg">
                            {report.imgUrls?.map((url: string, index: number) => (
                                <div key={`my-img-${index}`} className={`imgli ${index === 1 ? "lastimgli" : ""}`}>
                                    <div className="imgsize">
                                        <img src={url} alt={`주정차 위반 신고 촬영한 사진${index + 1}`}/>
                                    </div>
                                </div>
                            ))}
                        </dd>
                    </dl>
                </div>

                <div className="detailBox_re">
                    {/* 처리 완료시에만 노출 */}
                    {isCompleted && (
                        <div className="re_con">
                            <dl>
                                <dt>처리일시</dt>
                                <dd>{report.prcsDt || "-"}</dd>
                            </dl>
                            <dl>
                                <dt className="result_photo_title">업체에서 등록한 사진</dt>
                                <dd className="result_meimg">
                                    {report.prcsImgUrls && report.prcsImgUrls.length > 0 ? (
                                        report.prcsImgUrls.map((url: string, index: number) => (
                                            <div key={`prcs-img-${index}`}
                                                 className={`imgli ${index === 1 ? "lastimgli" : ""}`}>
                                                <div className="imgsize">
                                                    <img src={url} alt={`처리 사진${index + 1}`}/>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div>
                                            등록된 처리 사진이 없습니다.
                                        </div>
                                    )}
                                </dd>
                            </dl>
                        </div>
                    )}

                    <button type="button" className="go_report" onClick={() => router.back()}>
                        확인
                    </button>
                </div>
            </main>
        </div>
    );
}