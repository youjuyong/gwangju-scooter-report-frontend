"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {getPmDclrCollect, getPmDclrComplete, getReportDetail} from "@/services/report/reportApi";
import {toast} from "react-hot-toast";

export default function ReportDetail() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {dclrId} = useParams<{ dclrId: string }>();

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
    useEffect(() => {

        fetchDetail();
    }, [dclrId]);

    if (isLoading) return <div className="loading_box">로딩 중...</div>;
    if (!report) return <div className="loading_box">내역을 찾을 수 없습니다.</div>;

    const getStatusStyle = (cdId: string) => {
        switch (cdId) {
            case "DEST02": return "si3"; // 신고승인대기 (미배정)
            case "DEST03": return "si1"; // 처리중
            case "DEST04": return "si2"; // 처리완료
            default: return "si3";
        }
    };
    console.log(report);
    const getStatusText = (cdId: string) => {
        switch (cdId) {
            case "DEST02": return "미배정";
            case "DEST03": return "처리중";
            case "DEST04": return "처리완료";
            default: return "알 수 없음"; // 예외 처리
        }
    };
    const getMainText = (cdId: string) => {
        switch (cdId) {
            case "DEST02": return "킥보드 회수 등록";
            case "DEST03": return "킥보드 회수 상세정보";
            case "DEST04": return "킥보드 회수 상세정보";
            default: return "알 수 없음"; // 예외 처리
        }
    };

// 2. 클래스 결정 (해당 코드가 없으면 기본값 설정)
    const statusClass = getStatusStyle(report.dclrStts?.cdId) || "si1";

    const handleBack = () => {
        router.back();
    };

    const handleCollect = async (dclrId: string) => {
        if (!confirm("회수진행 처리를 하시겠습니까?")) return;

        try {
            await getPmDclrCollect(dclrId); // API 호출
            toast.success("회수진행 처리가 완료되었습니다.");
            fetchDetail(); // 🚀 성공 후 리스트 다시 불러오기
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
            fetchDetail(); // 🚀 성공 후 리스트 다시 불러오기
        } catch (error) {
            console.error("회수완료 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };
    return (
        <div className="noMenubody noMenubodyLine">
            <header>
                <h1>{getMainText(report.dclrStts?.cdId)}</h1>
                <button type="button" className="back" onClick={handleBack}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="detailBox">
                    <p className={`situation ${statusClass}`}> {/*.si1:처리중 , si2: 처리완료*/}
                        { getStatusText(report.dclrStts?.cdId)} {/*도로명 주소만 나옴*/}
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
                    {report.dclrStts?.cdId && (
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

                    <div className="btn_area">
                        {(() => {
                            const status = report.dclrStts?.cdId;

                            switch (status) {
                                case "DEST02": // 미배정 -> 회수진행 API 호출
                                    return (
                                        <button
                                            type="button"
                                            className="btn_ok"
                                            onClick={() => handleCollect(report.dclrId)}
                                        >
                                            회수진행
                                        </button>
                                    );
                                case "DEST03": // 처리중 -> 회수완료 API 호출
                                    return (
                                        <button
                                            type="button"
                                            className="btn_ok"
                                            onClick={() => handleComplete(report.dclrId)}
                                        >
                                            회수완료
                                        </button>
                                    );
                                case "DEST04": // 처리완료 -> 뒤로가기
                                    return (
                                        <button
                                            type="button"
                                            className="btn_ok"
                                            onClick={() => router.back()}
                                        >
                                            확인
                                        </button>
                                    );
                                default:
                                    return (
                                        <button
                                            type="button"
                                            className="btn_ok"
                                            onClick={() => router.back()}
                                        >
                                            닫기
                                        </button>
                                    );
                            }
                        })()}
                    </div>
                </div>
            </main>
        </div>
    );
}