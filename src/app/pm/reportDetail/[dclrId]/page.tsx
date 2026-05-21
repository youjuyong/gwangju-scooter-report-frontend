"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {getPmDclrCollect, getPmDclrComplete, getReportDetail} from "@/services/report/reportApi";
import {toast} from "react-hot-toast";
import {useAuthStore} from "@/store/authStore";
import imageCompression from "browser-image-compression";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function ReportDetail() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {dclrId} = useParams<{ dclrId: string }>();
    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        firstImg: "",
        secondImg: "",
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        firstImg: null,
        secondImg: null
    })
    //상태확인용
    const pmUserInfo = useAuthStore((state) => state.pm.userInfo);
    const currentUserName = pmUserInfo?.id;
    const status = report?.dclrStts.cdId;
    const isProcessorMe = currentUserName && currentUserName === report?.prcrHis?.prcr?.userId;
    const isEditableMode = status === "DEST02" || (status === "DEST03" && isProcessorMe);
    const isReadOnlyMode = status === "DEST04" || (status === "DEST03" && !isProcessorMe);

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


    if (isLoading && !report) {
        return <LoadingOverlay message="상세 내역을 불러오는 중입니다..." />;
    }
    if (!report) {
        return <p className="none renone">신고 내역이 없습니다.</p>;
    }

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
    // 회수진행 처리 함수
    const handleCollect = async (dclrId: string) => {
        if (!confirm("회수진행 처리를 하시겠습니까?")) return;
        try {
            await getPmDclrCollect(dclrId);
            toast.success("회수진행 처리가 완료되었습니다.");
            fetchDetail();
        } catch (error) {
            console.error("회수진행 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };

    // 완료 처리 함수
    const handleComplete = async (dclrId: string) => {
        // ⭐ DOM 대신 상태(state)에 저장된 파일 객체를 바로 가져옵니다.
        const file1 = files.firstImg;
        const file2 = files.secondImg;

        if (!file1 && !file2) {
            toast.error("최소 1장 이상의 현장 사진을 등록해 주세요.");
            return;
        }

        if (!confirm("회수완료 처리를 하시겠습니까?")) return;

        setIsLoading(true);

        // 1. FormData 객체 생성
        const formData = new FormData();

        // 2. dclrId 텍스트 데이터 추가
        formData.append("dclrId", dclrId);

        // 3. dclrImages 파일 데이터 추가
        if (file1) formData.append("dclrImages", file1);
        if (file2) formData.append("dclrImages", file2);

        try {
            // 4. API 호출
            await getPmDclrComplete( formData);

            toast.success("회수완료 처리가 완료되었습니다.");
            fetchDetail(); // 성공 후 상세 화면 갱신
        } catch (error) {
            console.error("회수완료 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };

    const handleRemoveImage = (id: string) => {
        if (previews[id]) URL.revokeObjectURL(previews[id]);
        setPreviews(prev => ({...prev, [id]: ""}));
        setFiles(prev => ({...prev, [id]: null}));
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            let file = selectedFiles[0];

            // 파일 최소 크기 10KB 체크
            const MIN_SIZE = 10 * 1024;
            if (file.size < MIN_SIZE) {
                alert("이미지 용량이 너무 작습니다. 10KB 이상의 사진을 등록해주세요");
                e.target.value = "";
                return;
            }

            // 🚀 browser-image-compression을 이용한 회전 방지 및 압축 옵션
            const options = {
                maxSizeMB: 10,          // 최대 파일 용량 2MB로 제한 (원하는 대로 조절 가능)
                maxWidthOrHeight: 1920, // 최대 해상도 제한
                useWebWorker: true,
                initialQuality: 0.8,   // 화질 유지 비율
            };

            try {
                // 이 과정에서 EXIF Orientation을 체크해 이미지를 올바른 방향으로 회전시켜 줍니다.
                const compressedFile = await imageCompression(file, options);

                // 기존 file 객체 대신 회전 정렬 및 압축이 완료된 파일로 대체
                file = new File([compressedFile], file.name, { type: file.type });
            } catch (error) {
                console.error("이미지 처리 실패:", error);
            }

            // 기존 프리뷰/파일 등록 로직 진행
            if (previews[id]) URL.revokeObjectURL(previews[id]);

            const previewUrl = URL.createObjectURL(file);

            setPreviews(prev => ({ ...prev, [id]: previewUrl }));
            setFiles(prev => ({ ...prev, [id]: file }));
        }
    };

    return (
        <div className="noMenubody noMenubodyLine">
            {isLoading && (
                <LoadingOverlay
                    message={status === "DEST02" || status === "DEST03" ? "처리 결과를 저장 중입니다..." : "데이터를 로딩 중입니다..."}
                />
            )}
            <header>
                <h1>{getMainText(report.dclrStts?.cdId)}</h1>
                <button type="button" className="back" onClick={handleBack}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="detailBox">
                    <p className={`situation ${statusClass}`}> {/*.si1:처리중 , si2: 처리완료*/}
                        {getStatusText(report.dclrStts?.cdId)} {/*도로명 주소만 나옴*/}
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
                    {status && (
                        <div className="re_con">
                            {isEditableMode && (
                                <>
                                    <dl>
                                        <dt>처리자</dt>
                                        {/* DEST02일 땐 배정이 안 되었으니 배정 전 표기, 내 작업일 땐 이름 출력 */}
                                        <dd>{report.prcrHis?.prcr?.userNm || "배정 전"}</dd>
                                    </dl>
                                    <span className="listtitle" id="photo-label">사진등록</span>
                                    <div className="pic-list" role="group" aria-labelledby="photo-label"
                                         aria-describedby="photo-help">
                                        <ul>
                                            {["firstImg", "secondImg"].map((id, index) => (
                                                <li key={id}>
                                                    <div className="imgsize">
                                                        {previews[id] ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="pic-del"
                                                                    onClick={() => handleRemoveImage(id)}
                                                                >
                                                                    삭제
                                                                </button>
                                                                <img src={previews[id]} alt={`신고 사진 ${index + 1}`}/>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    id={id}
                                                                    className="visually-hidden"
                                                                    accept="image/*"
                                                                    capture="environment"
                                                                    onChange={handleFileChange}
                                                                />
                                                                <label htmlFor={id} className="camerain">
                                                                    {index === 0 ? "첫 번째 촬영" : "두 번째 촬영"}
                                                                </label>
                                                            </>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="reasonBox">
                                        <label htmlFor="reason">사유</label>
                                        <input type="text" id="reason" name="reason" placeholder="사유를 입력하세요" />
                                    </div>

                                </>
                            )}

                            {/* ==========================================
                        CASE B. 읽기 전용 이미지 표출 모드
                        (DEST04 전체 / DEST03 + 타인 작업)
                       ========================================== */}
                            {isReadOnlyMode && (
                                <>
                                    <dl>
                                        <dt>처리자</dt>
                                        <dd>{report.prcrHis?.prcr?.userNm || "-"}</dd>
                                    </dl>
                                    <dl>
                                        <dt>처리일시</dt>
                                        <dd>{report.prcrHis?.prcsDt || "-"}</dd>
                                    </dl>
                                    <div className="pic-list">
                                        <div className="result_meimg">
                                            {/* 1. 첫 번째 사진 칸 */}
                                            <div className="imgli">
                                                <div className="imgsize">
                                                    {report.completeImgUrls && report.completeImgUrls[0] ? (
                                                        <img src={report.completeImgUrls[0]} alt="업체 처리 완료 사진1"/>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* 2. 두 번째 사진 칸 */}
                                            <div className="imgli lastimgli">
                                                <div className="imgsize">
                                                    {report.completeImgUrls && report.completeImgUrls[1] ? (
                                                        <img src={report.completeImgUrls[1]} alt="업체 처리 완료 사진2"/>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="reasonBox">
                                        <label htmlFor="reason">사유</label>
                                        <input type="text" id="reason" name="reason" value = {"test"} readOnly={true} />
                                    </div>


                                </>
                            )}
                        </div>
                    )}


                    {/* ==========================================
                CASE C. 하단 버튼 영역 분기 제어
               ========================================== */}
                    <div className="listbtnset">
                        {(() => {
                            // 편집 모드(내 작업 혹은 미배정)일 때만 '완료처리' 노출
                            if (isEditableMode) {
                                return (
                                    <>
                                    <button
                                        type="button"
                                        className="btn_complete"
                                        onClick={() => handleComplete(report.dclrId)}
                                    >
                                        완료처리
                                    </button>
                                    {status === "DEST02" && (
                                        <button
                                            type="button"
                                            className="btn_acc"
                                            onClick={() => handleCollect(report.dclrId)}
                                        >
                                            회수진행
                                        </button>
                                    )}
                                    </>
                                );
                            }

                            // 읽기 전용 모드(DEST04이거나 남이 처리 중인 DEST03)일 때는 '확인' 노출
                            if (isReadOnlyMode) {
                                return (
                                    <button
                                        type="button"
                                        className="btn_ok"
                                        onClick={() => router.back()}
                                    >
                                        확인
                                    </button>
                                );
                            }

                            // 기본값 방어 코드
                            return (
                                <button type="button" className="btn_ok" onClick={() => router.back()}>
                                    확인
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </main>
        </div>
    );
}