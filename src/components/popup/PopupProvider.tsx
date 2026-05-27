"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Popup from "@/components/popup/Popup";

interface PopupContextType {
    showAlert: (message: string) => Promise<boolean>; // 🌟 void에서 Promise<boolean>으로 변경!
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

// 사용자가 확인을 눌렀는지, 배경을 눌렀는지 확인해 줄 비밀 대기조 변수
let resolvePromise: (value: boolean) => void;

export function PopupProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");

    // 🌟 호출하면 사용자가 액션을 취할 때까지 코드 실행을 멈추고 기다리는 함수
    const showAlert = (msg: string): Promise<boolean> => {
        setMessage(msg);
        setIsOpen(true);

        // 자바스크립트에게 "내가 버튼 누르기 전까지 리턴하지 말고 기다려!"라고 선언하는 부분
        return new Promise((resolve) => {
            resolvePromise = resolve;
        });
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).showAlert = showAlert; // axios나 외부 js에서도 쓸 수 있게 전역 등록
        }
    }, []);

    // [확인] 버튼 클릭 시 -> true를 돌려줌
    const handleClose = () => {
        setIsOpen(false);
        setMessage("");
        if (resolvePromise) resolvePromise(true); // 🌟 true 리턴!
    };

    // [배경] 클릭 시 -> false를 돌려줌 (취소 역할)
    const handleCancel = () => {
        setIsOpen(false);
        setMessage("");
        if (resolvePromise) resolvePromise(false); // 🌟 false 리턴!
    };

    return (
        <PopupContext.Provider value={{ showAlert }}>
            {children}
            {/* 배경을 누르면 취소(false)로 처리하기 위해 onCancel에 handleCancel 연결 */}
            <Popup isOpen={isOpen} onClose={handleClose} onCancel={handleCancel} message={message} />
        </PopupContext.Provider>
    );
}

export function useAlert() {
    return useContext(PopupContext)!.showAlert;
}