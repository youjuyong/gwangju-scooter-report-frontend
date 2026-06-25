"use client";

import React, {useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {toast} from "react-hot-toast";
import {useAuthStore} from "@/store/authStore";
import imageCompression from "browser-image-compression";
import LoadingOverlay from "@/components/LoadingOverlay";
import PhotoPopup from "@/components/popup/PhotoPopup";
import {useAlert} from "@/components/popup/PopupProvider";
import {getTowDclrCollect, getTowDclrComplete ,getReportDetail} from "@/services/report/reportApi_tow";

export default function ReportDetail() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {dclrId} = useParams<{ dclrId: string }>();
    const [reason, setReason] = useState("");
    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        firstImg: "",
        secondImg: "",
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        firstImg: null,
        secondImg: null
    })
    const showAlert = useAlert();
    //상태확인용
    const towUserInfo = useAuthStore((state) => state.tow.userInfo);
    const currentUserName = towUserInfo?.id;
    const status = report?.dclrStts.cdId;
    const isProcessorMe = currentUserName && currentUserName === report?.prcrHis?.prcr?.userId;

    const isEditableMode = status === "DEST07" || (status === "DEST08" && isProcessorMe);
    const isReadOnlyMode = status === "DEST09" || (status === "DEST08" && !isProcessorMe);
    //  팝업 관련 상태 추가
    const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
    const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

    // Input 참조를 위한 Ref 추가
    const albumInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // ... (fetchDetail, handleBack, handleCollect, handleComplete 등 기존 로직 유지)

    // 팝업 열기 함수
    const handlePhotoClick = (id: string) => {
        setActivePhotoId(id);
        setIsPhotoPopupOpen(true);
    };

    // 앨범/촬영 버튼 클릭 시 실제 input 실행
    const triggerAlbum = () => {
        setIsPhotoPopupOpen(false);
        albumInputRef.current?.click();
    };

    const triggerCamera = () => {
        setIsPhotoPopupOpen(false);
        cameraInputRef.current?.click();
    };

    const handleFileChangeCustom = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files; // 사용자가 선택한 파일들 (배열 형태)

        if (selectedFiles && selectedFiles.length > 0) {
            //  1. 앨범에서 1장만 선택한 경우 -> 클릭한 칸(activePhotoId)에 정확히 매핑
            if (selectedFiles.length === 1 && activePhotoId) {
                await processFile(activePhotoId, selectedFiles[0]);
            }
            //  2. 앨범에서 2장 이상을 동시에 선택한 경우 -> 앞의 2장을 순서대로 자동 배치
            else if (selectedFiles.length >= 2) {
                await processFile("firstImg", selectedFiles[0]);
                await processFile("secondImg", selectedFiles[1]);
            }

            // 동일 파일 재선택 가능하도록 input 초기화
            e.target.value = "";
        }
    };
    const processFile = async (id: string, file: File) => {
        // 1. 최소 용량 체크
        const MIN_SIZE = 10 * 1024;
        if (file.size < MIN_SIZE) {
            showAlert(`${id === "firstImg" ? "첫 번째" : "두 번째"} 이미지 용량이 너무 작습니다. (10KB 이상 필요)`);
            return;
        }
        // 2. 이미지 압축 및 회전 방지
        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.8,
        };

        let processedFile = file;
        try {
            const compressedFile = await imageCompression(file, options);
            processedFile = new File([compressedFile], file.name, { type: file.type });
        } catch (error) {
            console.error("이미지 처리 실패:", error);
        }

        // 3. 브라우저용 미리보기 URL 생성 (함수형 업데이트로 State 버그 방지)
        const previewUrl = URL.createObjectURL(processedFile);

        setPreviews(prev => {
            if (prev[id]) URL.revokeObjectURL(prev[id]); // 기존 메모리 해제
            return { ...prev, [id]: previewUrl };
        });

        setFiles(prev => ({ ...prev, [id]: processedFile }));
    };

    const fetchDetail = async () => {
        if (!dclrId) {
            setIsLoading(false);
            return;
        }
        try {
            const res = await getReportDetail(dclrId);
            if (res.success && res.data) {
                const targetCdId = res.data.dclrStts?.cdId;
                const validStatuses = ["DEST07", "DEST08", "DEST09"];

                if (!targetCdId || !validStatuses.includes(targetCdId)) {
                    window.location.reload(); // 즉시 새로고침
                    return; // 아래 setReport를 실행하지 않고 종료
                }
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
            case "DEST07": return "si3"; // 신고승인대기 (미배정)
            case "DEST08": return "si1"; // 처리중
            case "DEST09": return "si2"; // 처리완료
            default: return "si3";
        }
    };
    const getStatusText = (cdId: string) => {
        switch (cdId) {
            case "DEST07": return "견인요청";
            case "DEST08": return "처리중";
            case "DEST09": return "처리완료";
            default: return "알 수 없음"; // 예외 처리
        }
    };
    const getMainText = (cdId: string) => {
        switch (cdId) {
            case "DEST07": return "킥보드 회수 등록";
            case "DEST08": return "킥보드 회수 상세정보";
            case "DEST09": return "킥보드 회수 상세정보";
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
        if (!await showAlert("회수진행 처리를 하시겠습니까?")) return;
        try {
            await getTowDclrCollect(dclrId);
            toast.success("회수진행 처리가 완료되었습니다.");
            fetchDetail();
        } catch (error) {
            console.error("회수진행 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        }
    };

    // 완료 처리 함수
    const handleComplete = async (dclrId: string) => {
        toast.dismiss();
        // DOM 대신 상태(state)에 저장된 파일 객체를 바로 가져옵니다.
        const file1 = files.firstImg;
        const file2 = files.secondImg;

        if (!file1 && !file2 && !reason.trim()) {
            toast.error("현장 사진을 최소 1장 등록하거나 사유를 입력해 주세요.");
            return;
        }

        if (!await showAlert("회수완료 처리를 하시겠습니까?")) return;

        setIsLoading(true);

        // 1. FormData 객체 생성
        const formData = new FormData();



        // 2. dclrId 텍스트 데이터 추가
        formData.append("dclrId", dclrId);
        formData.append("prcsRsn", reason);

        // 3. dclrImages 파일 데이터 추가
        if (file1) formData.append("dclrImages", file1);
        if (file2) formData.append("dclrImages", file2);

        try {
            // 4. API 호출
            await getTowDclrComplete( formData);

            toast.success("회수완료 처리가 완료되었습니다.");
            fetchDetail(); // 성공 후 상세 화면 갱신
        } catch (error : any) {
            console.error("회수완료 실패:", error);
            toast.error("처리 중 오류가 발생했습니다.");
            if (error.response && error.response.data && error.response.data.resultMsg) {
                await showAlert(error.response.data.resultMsg);
                window.location.reload();
            } else {
                toast.error("처리 중 오류가 발생했습니다.");
            }
        }
    };

    const handleRemoveImage = (id: string) => {
        if (previews[id]) URL.revokeObjectURL(previews[id]);
        setPreviews(prev => ({...prev, [id]: ""}));
        setFiles(prev => ({...prev, [id]: null}));
    };

    return (
        <div className="noMenubody noMenubodyLine">
            {isLoading && (
                <LoadingOverlay
                    message={status === "DEST07" || status === "DEST08" ? "처리 결과를 저장 중입니다..." : "데이터를 로딩 중입니다..."}
                />
            )}

            <PhotoPopup
                isOpen={isPhotoPopupOpen}
                onClose={() => setIsPhotoPopupOpen(false)}
                onAlbumClick={triggerAlbum}
                onCameraClick={triggerCamera}
            />

            {/*  숨겨진 실제 Input들 (앨범용 / 카메라용) */}
            <input
                type="file"
                ref={albumInputRef}
                style={{ display: "none" }}
                accept="image/*"
                multiple={true} // 앨범 다중 선택
                onChange={handleFileChangeCustom}
            />
            <input
                type="file"
                ref={cameraInputRef}
                style={{ display: "none" }}
                accept="image/*"
                capture="environment" // 직접 촬영 강제
                onChange={handleFileChangeCustom}
            />
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
                                                                <div
                                                                    className="camerain"
                                                                    onClick={() => handlePhotoClick(id)}
                                                                    style={{cursor: 'pointer'}}
                                                                >
                                                                    {index === 0 ? "첫 번째 사진" : "두 번째 사진"}
                                                                </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="reasonBox">
                                        <label htmlFor="reason">사유</label>
                                        <input
                                            type="text"
                                            id="reason"
                                            name="reason"
                                            placeholder="사유를 입력하세요"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
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
                                        <input
                                            type="text"
                                            id="reason"
                                            name="reason"
                                            value={report?.prcrHis.prcsRsn || "등록된 사유가 없습니다."}
                                            readOnly={true}
                                        />
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
                                    {status === "DEST07" && (
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