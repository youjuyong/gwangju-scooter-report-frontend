"use client";

import React, {useEffect, useState} from "react";
import "../../../assets/style/css/base_style.css";
import "../../../assets/style/css/style.css";
import {handleApiError} from "@/hooks/errorHandler";
import {getCodeType} from "@/services/common/commonApi";
import {registerReport} from "@/services/report/reportApi";
import imageCompression from "browser-image-compression";
import {useAlert} from "@/components/popup/PopupProvider";
import {toast} from "react-hot-toast";

interface QRProps {
    formData: {
        deviceId: string;
        brandId: string;
        brand: string;
        qrValue: string;
        location: string;
        lat: number;
        lng: number;
        zoneId: string;
        detail: string;
        typeCode: string;
        agreeChk: boolean;
        firstImgFile: File | null;
        secondImgFile: File | null;
        firstImgPreview: string;
        secondImgPreview: string;
    };
    onNext: (data: any) => void;
    onBack: () => void;
    onSuccess: () => void;
}

export default function ReportCitizen({formData, onNext, onBack, onSuccess}: QRProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [violationTypes, setViolationTypes] = useState<any[]>([]);
    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        firstImg: formData.firstImgPreview || "",
        secondImg: formData.secondImgPreview || "",
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        firstImg: formData.firstImgFile || null,
        secondImg: formData.secondImgFile || null,
    })
    const showAlert = useAlert();
    const [fData, setFData] = useState({
        location: formData.location || "",
        lat: formData.lat || 0,
        lng: formData.lng || 0,
        typeCode: formData.typeCode || "",
        detail: formData.detail || "",
        deviceId: formData.deviceId || "",
        agreeChk: formData.agreeChk || false,
        zoneId: formData.zoneId || "",
    });

    useEffect(() => {
        setFData(prev => ({
            ...prev,
            location: formData.location || "",
            lat: formData.lat || 0,
            lng: formData.lng || 0,
            zoneId: formData.zoneId || "",
            deviceId: formData.deviceId || "",
            typeCode: prev.typeCode || formData.typeCode || "",
            detail: prev.detail || formData.detail || "",
            agreeChk: prev.agreeChk || formData.agreeChk || false,
        }));

        setPreviews({
            firstImg: formData.firstImgPreview || "",
            secondImg: formData.secondImgPreview || "",
        });
        setFiles({
            firstImg: formData.firstImgFile || null,
            secondImg: formData.secondImgFile || null,
        });
    }, [
        formData.location,
        formData.lat,
        formData.lng,
        formData.zoneId,
        formData.firstImgPreview,
        formData.secondImgPreview,
        formData.typeCode,
        formData.detail,
        formData.agreeChk
    ]);

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const res = await getCodeType("VLTN");
                setViolationTypes(res.data);
            } catch (error) {
                console.error("위반 유형 로드 실패:", error);
            }
        };

        fetchCodes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFData({...fData, [name]: val});
    };

    const getUpdatedFormData = () => {
        return {
            ...formData,
            location: fData.location,
            lat: fData.lat,
            lng: fData.lng,
            typeCode: fData.typeCode,
            detail: fData.detail,
            agreeChk: fData.agreeChk,
            zoneId: fData.zoneId,
            firstImgFile: files.firstImg,
            secondImgFile: files.secondImg,
            firstImgPreview: previews.firstImg,
            secondImgPreview: previews.secondImg
        };
    };

    const openMap = () => {
        onNext({
            ...getUpdatedFormData(),
            targetStep: "MAP"
        });
    };

    const openTerms = () => {
        onNext({
            ...getUpdatedFormData(),
            targetStep: "AGREE"
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const {id, files: selectedFiles} = e.target;
        if (selectedFiles && selectedFiles[0]) {
            let file = selectedFiles[0];

            // 파일 최소 크기 10KB 설정
            const MIN_SIZE = 10 * 1024;
            if (file.size < MIN_SIZE) {
                showAlert("이미지 용량이 너무 작습니다. 10KB 이상의 사진을 등록해주세요");

                e.target.value = "";
                return;
            }

            const options = {
                maxSizeMB: 10,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8,
            };

            try {
                const compressedFile = await imageCompression(file, options);

                file = new File([compressedFile], file.name, {type: file.type});
            } catch (error) {
                console.error("이미지 처리 실패:", error);
            }

            if (previews[id]) URL.revokeObjectURL(previews[id]);

            const previewUrl = URL.createObjectURL(file);

            setPreviews(prev => ({...prev, [id]: previewUrl}));
            setFiles(prev => ({...prev, [id]: file}));

            if (id === "firstImg") {
                formData.firstImgFile = file;
                formData.firstImgPreview = previewUrl;
            } else {
                formData.secondImgFile = file;
                formData.secondImgPreview = previewUrl;
            }
        }
    };

    const handleRemoveImage = (id: string) => {
        if (previews[id]) URL.revokeObjectURL(previews[id]);
        setPreviews(prev => ({...prev, [id]: ""}));
        setFiles(prev => ({...prev, [id]: null}));

        if (id === "firstImg") {
            formData.firstImgFile = null;
            formData.firstImgPreview = "";
        } else {
            formData.secondImgFile = null;
            formData.secondImgPreview = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fData.location || !fData.typeCode || !fData.agreeChk || !fData.zoneId) {
            showAlert("모든 필수 항목을 입력하고 동의해 주세요.");
            return;
        }

        if (!files.firstImg || !files.secondImg) {
            showAlert("사진을 두장 등록해 주세요.");
            return;
        }

        try {
            setIsLoading(true);
            const formDataPayload = new FormData();

            formDataPayload.append("bzenty.bzentyId", formData.brandId);
            formDataPayload.append("qrcdVl", formData.deviceId);
            formDataPayload.append("latVl", fData.lat.toString());
            formDataPayload.append("lotVl", fData.lng.toString());
            formDataPayload.append("dclrAddrTxt", fData.location);
            formDataPayload.append("dclrCn", fData.detail);
            formDataPayload.append("vltnTypeCd.cdId", fData.typeCode);
            formDataPayload.append("zoneId", fData.zoneId);

            if (files.firstImg) formDataPayload.append("dclrImages", files.firstImg);
            if (files.secondImg) formDataPayload.append("dclrImages", files.secondImg);

            const res = await registerReport(formDataPayload);

            if (res.success) {
                toast.success("신고가 정상적으로 접수되었습니다.");
                onSuccess();
            } else {
                showAlert(res.message || "신고 등록에 실패했습니다.");
            }
        } catch (error: any) {
            console.error("신고 전송 에러:", error);
            handleApiError(error, error.response?.data.resultMsg);
        } finally {
            // 3. 성공하든 실패하든 로딩 종료
            setIsLoading(false);
        }
    };

    return (
        <div className={`wrap noMenubody`}>
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 검정
                    backdropFilter: 'blur(5px)',          // 배경 흐리게
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                }}>
                    {/* 빙글빙글 스피너 */}
                    <div className="loading-spinner"/>
                    <p style={{color: '#fff', marginTop: '15px', fontWeight: 'bold'}}>
                        신고를 접수 중입니다...
                    </p>

                    <style>{`
                    .loading-spinner {
                        width: 50px;
                        height: 50px;
                        border: 5px solid rgba(255, 255, 255, 0.3);
                        border-top: 5px solid #ffffff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                </div>
            )}
            <header>
                <h1>킥보드 방치 신고</h1>
                <button type="button" className="back" onClick={onBack}>뒤로 가기</button>
            </header>

            <main className="sub_article sub_article_padding">
                <p className="subInfo">정보를 확인 하신 후<br/>사진을 등록해 주세요.</p>

                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend className="visually-hidden">신고 정보를 입력해주세요.</legend>
                        <ul className="inputList">
                            <li>
                                <label htmlFor="location">신고위치</label>
                                <input
                                    type="text"
                                    className="input_location"
                                    id="location"
                                    name="location"
                                    value={fData.location}
                                    onChange={handleChange}
                                    required
                                    placeholder="선택한 위치의 주소가 표시됩니다."
                                />
                                <a
                                    href="#"
                                    className="btn_location"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openMap();
                                    }}>
                                    위치확인
                                </a>
                            </li>

                            <li>
                                <label htmlFor="type">위반유형</label>
                                <select id="type" name="typeCode" value={fData.typeCode} onChange={handleChange}
                                        required>
                                    <option value="" disabled>
                                        유형을 선택해 주세요
                                    </option>
                                    {violationTypes?.map((item) => (
                                        <option key={item.cdId} value={item.cdId}>
                                            {item.cdNm}
                                        </option>
                                    ))}
                                </select>
                            </li>

                            <li>
                                <label htmlFor="detail">상세설명</label>
                                <input
                                    type="text"
                                    id="detail"
                                    name="detail"
                                    value={fData.detail}
                                    onChange={handleChange}
                                    placeholder="위치를 상세하게 설명해 주세요."
                                    required
                                />
                            </li>

                            <li>
                                <span className="listtitle" id="photo-label">사진등록</span>
                                <div className="pic-list" role="group" aria-labelledby="photo-label">
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
                                <div className="reportinfo">
                                    <p>현장 사진을 촬영해 주세요</p>
                                    <p>3m 떨어진 위치에서 킥보드전체가 보이도록 촬영해 주세요.</p>
                                </div>
                            </li>

                            <li className="lastli">
                                <input
                                    type="checkbox"
                                    id="agreeChk"
                                    name="agreeChk"
                                    className="agreech"
                                    checked={fData.agreeChk}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="agreeChk">개인정보 활용에 동의합니다</label>
                                <a
                                    href="#"
                                    className="btn-send"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openTerms();
                                    }}
                                >
                                    개인정보 처리방침
                                </a>
                            </li>
                        </ul>

                        <button type="submit" className="go_report">신고 하기</button>
                    </fieldset>
                </form>
            </main>
        </div>
    );
}