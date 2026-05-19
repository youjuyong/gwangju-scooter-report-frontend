"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Scanner} from "@yudiel/react-qr-scanner";
import {BusinessInfo} from "@/types/report";
import {getBusinessList, getDeviceValid} from "@/services/report/reportApi";
import CustomPopup from "@/components/citizen/popup/CustomPopup";

interface QRProps {
    formData: {
        deviceId: string;
        brand: string;
        qrValue: string;
        brandId: string;
    };
    onUpdate: (data: any) => void;
    onComplete: () => void;
}

export default function ReportCitizenQRCode({formData, onUpdate, onComplete}: QRProps) {
    const router = useRouter();
    const [isCamera, setIsCamera] = useState<boolean>(true);
    const [businessList, setBusinessList] = useState<BusinessInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isValid = formData.brand.trim() !== "" && formData.deviceId.trim() !== "";
    const [isValidated, setIsValidated] = useState<boolean>(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                setIsLoading(true);
                const res = await getBusinessList('BZTY01');
                setBusinessList(res);
            } catch (e) {
                console.error('err');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        setIsValidated(false);
    }, [formData.brand, formData.brandId, formData.deviceId, formData.qrValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        if (name === "brand") {
            const selectedBiz = businessList.find(b => b.bzentyId === value);

            onUpdate({
                brand: selectedBiz ? selectedBiz.bzentyNm : "",
                brandId: value
            });
        } else {
            onUpdate({[name]: value});
        }
    };

    const handleScan = (result: any) => {
        const qrValue = result?.[0]?.rawValue;

        if (!qrValue) return;
        let isMatched = false;
        setIsValidated(false);

        for (const business of businessList) {
            try {
                if (!business.qrcdIdExtrRule) continue;

                const regex = new RegExp(business.qrcdIdExtrRule);
                const match = qrValue.match(regex);

                if (match) {
                    let extractedId = match[1] || match[0];

                    if (business.bzentyNm.toLowerCase().includes("gbike")) {
                        extractedId = extractedId.slice(-6);
                    }

                    onUpdate({
                        brand: business.bzentyNm,
                        brandId: business.bzentyId,
                        deviceId: extractedId,
                        qrValue: qrValue,
                    });
                    isMatched = true;
                    return;
                }
            } catch (err) {
                console.error("정규식 파싱 에러:", err);
            }
        }
        if (!isMatched) {
            setMessage("존재하지 않거나 유효하지 않은 기기 정보입니다.");
            setIsPopupOpen(true);
            onUpdate({
                brand: "",
                brandId: "",
                deviceId: "",
                qrValue: ""
            });
        }

    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isValidated) {
            onComplete();
            return;
        }

        const isSuccess = await checkValidated();

        if (isSuccess && isValid) {
            onComplete();
        }
    };

    const checkValidated = async () => {
        if (!formData.brandId || !formData.deviceId) {
            setMessage("존재하지 않거나 유효하지 않은 기기 정보입니다.");
            setIsPopupOpen(true);
            return false;
        }
        const selectedBiz = businessList.find(b => b.bzentyId === formData.brandId);
        if (!selectedBiz) return false;
        try {
            const res = await getDeviceValid(selectedBiz.bzentyId, formData.deviceId);

            if (res.success) {
                setIsValidated(true);
                return true;
            } else {
                setMessage("존재하지 않거나 유효하지 않은 기기 정보입니다.");
                setIsPopupOpen(true);
                setIsValidated(false);
                return false;
            }
        } catch (error: any) {
            setIsValidated(false);
            const errMessage = error?.response?.data?.resultMsg;
            const msg = errMessage || "해당 업체에 등록되지 않았거나 유효하지 않은 킥보드입니다.";
            setMessage(msg);
            setIsPopupOpen(true); // 1. 여기서 팝업을 켬
            console.error("유효성 검사 중 에러:", error);
            return false;
        }
    };

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>전동 킥보드 QR 스티커 촬영</h1>
                <button type="button" className="back" onClick={() => router.back()}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="min">
                    <div className="QRcamera">
                        {!isCamera ? (
                            <div className="camera_none" aria-live="assertive">
                                미디어 장치를 감지할 수 없습니다.
                            </div>
                        ) : (
                            <div className="camera_on">
                                <div className="camera_bg"></div>
                                <p className="ex">
                                    QR코드를<br/>사각 테두리 안에 맞춰 스캔해 주세요.
                                </p>
                                <div className="camera_box" aria-label="QR코드 스캔 영역">
                                    <Scanner
                                        onScan={handleScan}
                                        onError={() => setIsCamera(false)}
                                        constraints={{facingMode: "environment"}}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="QRconten">
                        <p className="qrinfo">
                            <img src="/assets/style/images/info.png" alt="정보 아이콘"/>
                            QR코드가 안될 경우 킥보드 정보를 입력해 주세요.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <fieldset>
                                <legend className="visually-hidden">QR코드 정보</legend>
                                <ul className="inputList">
                                    <li>
                                        <label htmlFor="kickboard">킥보드사</label>
                                        <select
                                            id="kickboard"
                                            name="brand"
                                            value={formData.brandId || ""}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="" disabled>
                                                {isLoading ? "로딩 중..." : "선택"}
                                            </option>
                                            {businessList?.map((item) => (
                                                <option key={item.bzentyId} value={item.bzentyId}>
                                                    {item.bzentyNm}
                                                </option>
                                            ))}
                                        </select>
                                    </li>
                                    <li>
                                        <label htmlFor="kickboard_id">킥보드 ID</label>
                                        <input
                                            type="text"
                                            id="kickboard_id"
                                            name="deviceId"
                                            placeholder="QR코드 하단 문자열을 입력하세요"
                                            value={formData.deviceId}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </li>
                                </ul>
                            </fieldset>
                            <button type="submit" className="go_report">
                                다음 단계 (신고서 작성)
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <CustomPopup
                msg={message}
                showPopup={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
            />
        </div>
    );
}