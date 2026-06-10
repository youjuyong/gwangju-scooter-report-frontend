"use client";

import React, { useState, useEffect } from 'react';

interface PmCompanyPopupProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        bzentyId?: string;
        bzentyNm: string;
        logoUrl?: string;
        markImgBase64?: string;
        qrcdUrlForm?: string;
        qrcdIdExtrRule?: string;
    } | null;
    onSave: (formData: FormData) => Promise<void>;
}

export default function PmPopup({ isOpen, onClose, initialData, onSave }: PmCompanyPopupProps) {
    const [isLoading, setIsLoading] = useState(false);

    // 폼 상태 관리
    const [companyName, setCompanyName] = useState('');
    const [qrcdUrlForm, setQrcdUrlForm] = useState('');
    const [qrcdIdExtrRule, setQrcdIdExtrRule] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setCompanyName(initialData.bzentyNm || '');
                setQrcdUrlForm(initialData.qrcdUrlForm || '');
                setQrcdIdExtrRule(initialData.qrcdIdExtrRule || '');

                if (initialData.markImgBase64) {
                    let cleanBase64 = initialData.markImgBase64;
                    cleanBase64 = cleanBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                    cleanBase64 = cleanBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

                    // 정제된 순수 바이너리 텍스트 앞에 단일 표준 프리뷰 접두사 매핑
                    setPreviewUrl(`data:image/jpeg;base64,${cleanBase64}`);
                } else {
                    setPreviewUrl(initialData.logoUrl || null);
                }
            } else {
                setCompanyName('');
                setQrcdUrlForm('');
                setQrcdIdExtrRule('');
                setPreviewUrl(null);
            }
            setLogoFile(null);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 팝업이 열려있고 ESC 키(Escape)를 누른 경우
            if (isOpen && e.key === 'Escape') {
                onClose();
            }
        };
        // 팝업이 열려있을 때만 전역 윈도우에 이벤트 등록
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        // 컴포넌트가 닫히거나 언마운트될 때 메모리 누수 방지를 위해 이벤트 제거
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleConfirmSave = async () => {
        if (!companyName.trim()) {
            alert("업체명을 입력해주세요.");
            return;
        }

        try {
            setIsLoading(true);

            // 💡 백엔드가 요구하는 정확한 Key 스펙으로 FormData 빌드
            const formData = new FormData();

            // initialData에 bzentyId가 있으면 '수정 모드'이므로 포함시킴
            if (initialData?.bzentyId) {
                formData.append('bzentyId', initialData.bzentyId);
            }

            formData.append('bzentyNm', companyName.trim());
            formData.append('qrcdUrlForm', qrcdUrlForm.trim());
            formData.append('qrcdIdExtrRule', qrcdIdExtrRule.trim());

            // 새로 선택한 이미지 파일이 있으면 백엔드 스펙인 'markImage'로 append
            if (logoFile) {
                formData.append('markImage', logoFile);
            }

            // 부모(`PmPage`)의 handleSavePmCompany 함수로 배달
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("PM업체 저장 실패:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="popupWrap" style={{ display: 'block' }}>
            <div className="popupInner">
                <div className="popup popup_pm">
                    {/* initialData 유무에 따라 타이틀 텍스트 동적 분기 */}
                    <h3>PM업체 {initialData ? "수정하기" : "등록하기"}</h3>
                    <button className="popupClose" onClick={onClose} disabled={isLoading}>닫기</button>
                    <div className="popupconten">
                        <table>
                            <tbody>
                            <tr>
                                <th>로고</th>
                                <td>
                                    <div className="logoimg">
                                        <div className="imgbox" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="로고 미리보기" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                "이미지 들어갈 곳"
                                            )}
                                        </div>
                                        <div className="imginput">
                                            <p>최적사이즈: 50px X 50px</p>
                                            <input type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th>업체명</th>
                                <td>
                                    <input type="text" placeholder="업체명을 입력하세요" value={companyName}
                                           onChange={(e) => setCompanyName(e.target.value)}
                                           disabled={isLoading} />
                                </td>
                            </tr>
                            <tr>
                                <th>QR코드 URL 포맷</th>
                                <td>
                                    <input type="text" placeholder="예: https://example.com/qr?id={id}"
                                           value={qrcdUrlForm} onChange={(e) => setQrcdUrlForm(e.target.value)}
                                           disabled={isLoading} />
                                </td>
                            </tr>
                            <tr>
                                <th>QR ID 추출 규칙</th>
                                <td>
                                    <input type="text" placeholder="추출 규칙 기술" value={qrcdIdExtrRule}
                                           onChange={(e) => setQrcdIdExtrRule(e.target.value)}
                                           disabled={isLoading} />
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        <div className="btnSet">
                            <button onClick={onClose} disabled={isLoading}>취소</button>
                            <button className="red" onClick={handleConfirmSave} disabled={isLoading}>
                                {isLoading ? "저장 중..." : "저장"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}