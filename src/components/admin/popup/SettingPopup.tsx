"use client";

import React, { useState, useEffect } from 'react';
import { useDrag } from "@/hooks/userDrag";

// 팝업 데이터 스펙 인터페이스 정의
export interface SettingData {
    type: 'report' | 'tow' | 'auto'; // 신고 가능 시간 또는 견인 제한 시간 구분용
    startTime: string;
    endTime: string;
    isUsed: string; // "사용" | "사용안함"
}

interface SettingPopupProps {
    isOpen: boolean;
    title: string;
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
    const { position, handleMouseDown, isDragging } = useDrag(isOpen); // 팝업 드래그

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    // 2. 팝업이 열리거나 initialData가 변경될 때 데이터 동기화
    useEffect(() => {
        if (initialData) {
            // tow 일 때는 부모가 넘겨준 단일 숫자(ex: "3")가 startTime에 주입됩니다.
            setStartTime(initialData.startTime || (initialData.type === 'tow' ? "0" : "07:00"));
            setEndTime(initialData.endTime || "17:00");
            setIsUsed(initialData.isUsed || "사용");
        } else {
            setStartTime("07:00");
            setEndTime("17:00");
            setIsUsed("사용");
        }
    }, [initialData, isOpen]);

    // 팝업이 닫혀있으면 렌더링하지 않음
    if (!isOpen) return null;

    // 견인 제한(tow) 타입인지 여부 확인 변수
    const isTowType = initialData?.type === 'tow';

    // 3. 저장 핸들러
    const handleSave = () => {
        const payload: SettingData = {
            type: initialData?.type || 'report',
            startTime,
            endTime: isTowType ? "" : endTime, // 견인일 때는 무의미한 값 초기화
            isUsed: isTowType ? "사용" : isUsed
        };
        onSave(payload);
    };

    return (
        <div className="popupWrap">
            <div className="popupInner">
                <div className="popup popup_seting"
                     style={{
                         transform: `translate(${position.x}px, ${position.y}px)`,
                         transition: isDragging ? 'none' : 'transform 0.1s ease'
                     }}
                >
                    <h3
                        onMouseDown={handleMouseDown}
                        style={{ cursor: 'move', userSelect: 'none' }}
                    >
                        {title || "운영 시간 설정"}
                    </h3>
                    <button className="popupClose" onClick={onClose}>닫기</button>

                    <div className="popupconten">
                        <table>
                            <tbody>
                            <tr>
                                {/* 타입에 따라 라벨 명칭 변경 */}
                                <th>{isTowType ? "이관 시간" : "시작시간"}</th>
                                <td>
                                    {isTowType ? (
                                        <div >
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        // 일반 운영 모드일 때: 기존 HH:mm 시간 피커 표출
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    )}
                                </td>
                            </tr>

                            {/* 일반 운영 설정('report', 'auto')일 때만 종료시간 및 사용여부 행 노출 */}
                            {!isTowType && (
                                <>
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
                                </>
                            )}
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