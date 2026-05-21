"use client";

import React from "react";

interface LoginPopupProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string; // 문구도 필요시 변경 가능하도록 옵션 추가
}

export default function Popup({ isOpen, onClose, message = "로그인 후 이용하세요" }: LoginPopupProps) {
    // 팝업이 열려있지 않으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        <div className="popupbox" style={{ display: "block" }}>
            <div className="popupconten">
                <p className="popuptxt">{message}</p>
                <div className="popupbtnset">
                    <button type="button" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
            <div className="popbg" onClick={onClose}></div> {/* 배경 클릭 시에도 닫히도록 구성 */}
        </div>
    );
}