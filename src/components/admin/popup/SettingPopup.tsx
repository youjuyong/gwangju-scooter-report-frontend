"use client";

import React, { useState, useEffect } from 'react';

// 팝업 데이터 스펙 인터페이스 정의
export interface SettingData {
    type: 'report' | 'tow'; // 신고 가능 시간 또는 견인 제한 시간 구분용
    startTime: string;
    endTime: string;
    isUsed: string; // "사용" | "사용안함"
}

interface SettingPopupProps {
    isOpen: boolean;
    title: string; // 팝업 제목 (ex: "신고 가능 시간" 또는 "견인 제한 시간")
    initialData: SettingData | null;
    onClose: () => void;
    onSave: (data: SettingData) => void;
}

export default function SettingPopup({
                                             isOpen,
                                             title,
                                             initialData,
                                             onClose,
                                             onSave
                                         }: SettingPopupProps) {

    // 1. 내부 폼 상태 관리
    const [startTime, setStartTime] = useState("07:00");
    const [endTime, setEndTime] = useState("17:00");
    const [isUsed, setIsUsed] = useState("사용");
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
    }, [isOpen, onClose]); // 의존성 배열에 isOpen과 onClose 바인딩


    // 2. 팝업이 열리거나 initialData가 변경될 때 데이터 동기화
    useEffect(() => {
        if (initialData) {
            setStartTime(initialData.startTime || "07:00");
            setEndTime(initialData.endTime || "17:00");
            setIsUsed(initialData.isUsed || "사용");
        } else {
            // 초기 데이터가 없을 시 기본값 세팅
            setStartTime("07:00");
            setEndTime("17:00");
            setIsUsed("사용");
        }
    }, [initialData, isOpen]);

    // 팝업이 닫혀있으면 렌더링하지 않음
    if (!isOpen) return null;

    // 3. 저장 핸들러
    const handleSave = () => {
        const payload: SettingData = {
            type: initialData?.type || 'report',
            startTime,
            endTime,
            isUsed
        };
        onSave(payload);
    };

    return (
        <div className="popupWrap">
            <div className="popupInner">
                <div className="popup popup_seting">
                    <h3>{title || "신고 가능 시간"}</h3>
                    <button className="popupClose" onClick={onClose}>닫기</button>

                    <div className="popupconten">
                        <table>
                            <tbody>
                            <tr>
                                <th>시작시간</th>
                                <td>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>종료시간</th>
                                <td>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>사용여부</th>
                                <td>
                                    <select
                                        value={isUsed}
                                        onChange={(e) => setIsUsed(e.target.value)}
                                    >
                                        <option value="사용">사용</option>
                                        <option value="사용안함">사용안함</option>
                                    </select>
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        {/* 하단 제어 버튼 블록 */}
                        <div className="btnSet">
                            <button onClick={onClose}>취소</button>
                            <button className="red" onClick={handleSave}>저장</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}