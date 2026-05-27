"use client";

import React from "react";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void; // 🌟 [추가] 배경을 눌렀을 때(취소) 실행할 함수를 따로 받습니다.
    message?: string;
}

export default function Popup({ isOpen, onClose, onCancel, message = "로그인 후 이용하세요" }: PopupProps) {
    // 팝업이 열려있지 않으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        <div className="popupbox" style={{ display: "block" }}>
            <div className="popupconten">
                <p className="popuptxt" style={{whiteSpace: "pre-line"}}>
                    {message}
                </p>
                <div className="popupbtnset">
                    {/* [확인] 버튼은 그대로 기존 onClose를 실행 (true 리턴용) */}
                    <button type="button" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
            {/* 🌟 [수정] 배경(딤드)을 클릭했을 때는 onCancel이 있으면 그걸 실행하고, 없으면 onClose를 실행합니다. */}
            <div className="popbg" onClick={onCancel || onClose}></div>
        </div>
    );
}