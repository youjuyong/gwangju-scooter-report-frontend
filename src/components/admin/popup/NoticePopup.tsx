"use client";

import React, { useState } from 'react';
import {NoticeAddRequestForm} from "@/types/notice";

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => void;
}

export default function NoticeModal({ isOpen, onClose, onSave }: NoticeModalProps) {

    // 폼 상태 관리
    const [title, setTitle] = useState('');
    const [targets, setTargets] = useState({ user: true, pm: true, tow: true });
    const [isFixed, setIsFixed] = useState(false);
    const [displayYn, setDisplayYn] = useState('Y');
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        // 1월은 0부터 시작하므로 +1을 해주고, 한 자리 수일 경우 앞에 0을 붙여줍니다.
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`; // 예: "2026-06-09"
    };
    const [startDate, setStartDate] = useState(getTodayString());
    const [endDate, setEndDate] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    if (!isOpen) return null;
    // 체크박스 핸들러
    const handleTargetChange = (key: 'user' | 'pm' | 'tow') => {
        setTargets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfirm = () => {


        const userTypeCds: string[] = [];
        if (targets.user) userTypeCds.push('MNUT05');
        if (targets.pm) userTypeCds.push('MNUT03');
        if (targets.tow) userTypeCds.push('MNUT04');

        // [체크 1] 제목 및 내용 필수 검사
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        // [체크 2] 표출범위 필수 검사 (배열이 비어있으면 차단)
        if (userTypeCds.length === 0) {
            alert("표출범위를 최소 하나 이상 선택해주세요. (사용자, PM사, 견인업체 중 선택)");
            return;
        }

        // [체크 3] 시작 일시 필수 검사 (input type="date" 특성상 빈 문자열 체크)
        if (!startDate) {
            alert("표출시작일을 선택해주세요.");
            return;
        }


        const formattedStartDate = startDate ? `${startDate}T00:00:00` : ''; // 예: "2026-06-08T00:00:00"
        const formattedEndDate = endDate ? `${endDate}T23:59:59` : '';     // 예: "2026-06-09T23:59:59"

        const requestData: NoticeAddRequestForm = {
            ttlNm: title,
            cnData: content,
            ntcTypeCd : 'NTCT01',
            mainExpsrYn: isFixed ? 'Y' : 'N',
            expsrBgngDt: formattedStartDate,
            expsrEndDt: formattedEndDate,
            userTypeCds: userTypeCds,
            // 💡 킥보드 페이지처럼 State에 담겨있던 오리지널 File 객체를 배열 안에 그대로 전달합니다.
            noticeFiles: file ? [file] : []
        };

        onSave(requestData);
    };

    return (
        <div className="popupWrap" style={{ display: 'block' }}> {/* Next.js 연동을 위해 display 블록 처리 */}
            <div className="popupInner">
                <div className="popup popup_notice">
                    <h3>공지사항 등록</h3>
                    <button className="popupClose" onClick={onClose}>닫기</button>
                    <div className="popupconten">
                        <table>
                            <tbody>
                            <tr>
                                <th>제목</th>
                                <td className="notititle">
                                    <input
                                        type="text"
                                        placeholder="제목을 입력하세요"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>표출범위</th>
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={targets.user}
                                            onChange={() => handleTargetChange('user')}
                                        /> 사용자
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={targets.pm}
                                            onChange={() => handleTargetChange('pm')}
                                        /> PM사
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={targets.tow}
                                            onChange={() => handleTargetChange('tow')}
                                        /> 견인업체
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th>상단고정</th>
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isFixed}
                                            onChange={(e) => setIsFixed(e.target.checked)}
                                        /> 고정
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th>첨부파일</th>
                                <td>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>표출여부</th>
                                <td>
                                    <select value={displayYn} onChange={(e) => setDisplayYn(e.target.value)}>
                                        <option value="Y">표출함</option>
                                        <option value="N">표출안함</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th>표출시작일</th>
                                <td>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>표출종료일</th>
                                <td>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="noticon" colSpan={2}>
                                        <textarea
                                            placeholder="내용을 입력하세요"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        {/* 버튼 그룹 */}
                        <div className="btnSet">
                            <button onClick={onClose}>취소</button>
                            <button className="red" onClick={handleConfirm}>저장</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}