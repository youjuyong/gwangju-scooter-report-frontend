"use client";

import React, {createContext, useContext, useEffect, useState} from "react";
import Popup from "@/components/popup/Popup"; // 본인의 Popup 컴포넌트 경로

interface PopupContextType {
    showAlert: (message: string) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");

    const showAlert = (msg: string) => {
        setMessage(msg);
        setIsOpen(true);
    };
    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).apiAlert = showAlert;
        }
    }, []);

    // 🌟 이 부분을 아래와 같이 수정합니다!
    const handleClose = () => {
        setIsOpen(false);
        setMessage("");

        // 🌟 [추가] 팝업이 닫힐 때(확인 클릭 시) 예약된 함수가 있으면 실행하고 지웁니다.
        if (typeof window !== "undefined" && (window as any).onPopupConfirm) {
            (window as any).onPopupConfirm();
            (window as any).onPopupConfirm = null; // 사용 후 초기화
        }
    };

    return (
        <PopupContext.Provider value={{ showAlert }}>
            {children}
            {/* 최상단에 딱 하나만 렌더링되어 대기하는 팝업 */}
            <Popup isOpen={isOpen} onClose={handleClose} message={message} />
        </PopupContext.Provider>
    );
}

// 💡 다른 컴포넌트에서 쉽게 꺼내 쓰기 위한 훅(Hook)
export function useAlert() {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error("useAlert hook은 PopupProvider 안에서만 사용할 수 있습니다.");
    }
    return context.showAlert;
}