"use client";

import React, {useEffect, useState} from "react";
import "@/css/base_style.css";
import "@/css/style.css";
import ReportLocation from "@/components/citizen/report/ReportLocation";
import {getCodeType} from "@/services/common/commonApi";
import {registerReport} from "@/services/report/reportApi";

interface QRProps {
    formData: {
        deviceId: string;
        brandId: string;
        qrValue: string;
    };
    onNext: (data: any) => void;
    onBack: () => void;
    onSuccess: () => void;
}

export default function ReportCitizen({formData, onNext, onBack, onSuccess}: QRProps) {
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [violationTypes, setViolationTypes] = useState<any[]>([]);
    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        firstImg: "",
        secondImg: "",
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        firstImg: null,
        secondImg: null
    })

    const [fData, setFData] = useState({
        location: "",
        lat: 0,
        lng: 0,
        typeCode: "",
        detail: "",
        deviceId: "",
        agreeChk: false,
        zoneId: "",
    });

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

        return () => {
            Object.values(previews).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFData({...fData, [name]: val});
    };

    const openMap = () => {
        setIsMapOpen(true);
    };

    const handleLocation = (data: { address: string; lat: number; lng: number, zoneId: string }) => {
        if (data.address) {
            setFData(prev => ({
                ...prev,
                location: data.address,
                lat: data.lat,
                lng: data.lng,
                zoneId: data.zoneId,
            }));
        }
        setIsMapOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {id, files: selectedFiles} = e.target;
        if (selectedFiles && selectedFiles[0]) {
            const file = selectedFiles[0];

            if (previews[id]) URL.revokeObjectURL(previews[id]);

            const previewUrl = URL.createObjectURL(file);

            setPreviews(prev => ({...prev, [id]: previewUrl}));
            setFiles(prev => ({...prev, [id]: file}));
        }
    };

    const handleRemoveImage = (id: string) => {
        if (previews[id]) URL.revokeObjectURL(previews[id]);
        setPreviews(prev => ({...prev, [id]: ""}));
        setFiles(prev => ({...prev, [id]: null}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fData.location || !fData.typeCode || !fData.agreeChk || !fData.zoneId) {
            alert("모든 필수 항목을 입력하고 동의해 주세요.");
            return;
        }

        if (!files.firstImg || !files.secondImg) {
            alert("사진을 두장 등록해 주세요.");
            return;
        }

        try {
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
                alert("신고가 정상적으로 접수되었습니다.");
                onSuccess();
            } else {
                alert(res.message || "신고 등록에 실패했습니다.");
            }
        } catch (error) {
            console.error("신고 전송 에러:", error);
            alert("서버 통신 중 오류가 발생했습니다.");
        }
    };

    if (isMapOpen) {
        return <ReportLocation onSelect={handleLocation} onBack={() => setIsMapOpen(false)}/>;
    }

    return (
        <div className={`wrap noMenubody`}>
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
                                <a href="#" className="btn-send">개인정보 처리방침</a>
                            </li>
                        </ul>

                        <button type="submit" className="go_report">신고 하기</button>
                    </fieldset>
                </form>
            </main>
        </div>
    );
}