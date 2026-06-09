"use client";

import React, { useState, useEffect } from 'react';
import { NoticeResponse } from '@/types/notice';
import { getMainNoticeApi } from "@/services/notice/noticeApi"; // 💡 updateNoticeApi 추가

interface NoticeDetailModalProps {
    isOpen: boolean;
    ntcId: string ;
    onClose: () => void;
    onRefreshList: () => void;
}

export default function NoticeDetailPopup({ isOpen, ntcId, onClose, onRefreshList }: NoticeDetailModalProps) {
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // 폼 내부 상태 관리
    const [title, setTitle] = useState('');
    const [targets, setTargets] = useState({ user: false, pm: false, tow: false });
    const [isFixed, setIsFixed] = useState(false);
    const [displayYn, setDisplayYn] = useState('Y');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setIsLoading(true);
                const data = await getMainNoticeApi(ntcId);
                console.log("백엔드 상세 응답 데이터 확인:", data);
                initFormData(data);
                setIsReadOnly(true);
            } catch (error) {
                console.error("공지사항 상세 조회 실패:", error);
                alert("상세 데이터를 불러오는데 실패했습니다.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && ntcId) {
            fetchDetail();
        }
    }, [isOpen, ntcId]);

    if (!isOpen || !ntcId) return null;
    // 데이터 매핑 공통 함수
    const initFormData = (data: any) => {
        setTitle(data.ttlNm || '');
        setIsFixed(data.mainExpsrYn === 'Y');
        setContent(data.cnData || '');
        setDisplayYn(data.mainExpsrYn || 'Y');

        // 💡 [해결책] 표출 기간 데이터 바인딩 안정화 (null 및 포맷 체크)
        if (data.expsrBgngDt && typeof data.expsrBgngDt === 'string') {
            setStartDate(data.expsrBgngDt.includes('T') ? data.expsrBgngDt.split('T')[0] : data.expsrBgngDt);
        } else {
            setStartDate('');
        }

        if (data.expsrEndDt && typeof data.expsrEndDt === 'string') {
            setEndDate(data.expsrEndDt.includes('T') ? data.expsrEndDt.split('T')[0] : data.expsrEndDt);
        } else {
            setEndDate('');
        }

        // 객체 바인딩 오류 해결
        if (data.files) {
            setExistingFileName(typeof data.files === 'object' ? data.files.orgnlFileNm : data.files);
        } else {
            setExistingFileName(null);
        }

        // 💡 [해결책] 표출범위 바인딩 - 배열(userTypeCds) 및 문자열(targets) 교차 검증 구조로 변경
        const targetStr = data.targets || '';
        const userTypeCds = Array.isArray(data.userTypeCds) ? data.userTypeCds : [];

        setTargets({
            user: targetStr.includes('USER') || targetStr.includes('MNUT05') || userTypeCds.includes('MNUT05'),
            pm: targetStr.includes('PM') || targetStr.includes('MNUT03') || userTypeCds.includes('MNUT03'),
            tow: targetStr.includes('TOW') || targetStr.includes('MNUT04') || userTypeCds.includes('MNUT04'),
        });
    };

    // 모달 오픈 시 백엔드 단건 상세 정보 조회


    const handleTargetChange = (key: 'user' | 'pm' | 'tow') => {
        if (isReadOnly) return;
        setTargets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 💡 저장 버튼 구현 완료
    // const handleConfirmUpdate = async () => {
    //     const formattedStartDate = startDate ? `${startDate}T00:00:00` : '';
    //     const formattedEndDate = endDate ? `${endDate}T23:59:59` : '';
    //
    //     const userTypeCds: string[] = [];
    //     if (targets.user) userTypeCds.push('MNUT05');
    //     if (targets.pm) userTypeCds.push('MNUT03');
    //     if (targets.tow) userTypeCds.push('MNUT04');
    //
    //     if (!title.trim() || !content.trim()) {
    //         alert("필수 항목을 입력해주세요.");
    //         return;
    //     }
    //     if (userTypeCds.length === 0) {
    //         alert("표출범위를 하나 이상 선택해주세요.");
    //         return;
    //     }
    //
    //     const formData = new FormData();
    //     formData.append('ntcId', ntcId);
    //     formData.append('ttlNm', title);
    //     formData.append('cnData', content);
    //     formData.append('ntcTypeCd', 'NTCT01');
    //     formData.append('mainExpsrYn', isFixed ? 'Y' : 'N');
    //     formData.append('expsrBgngDt', formattedStartDate);
    //     formData.append('expsrEndDt', formattedEndDate);
    //     userTypeCds.forEach(cd => formData.append('userTypeCds', cd));
    //     if (file) formData.append('noticeFiles', file);
    //
    //     try {
    //         await updateNoticeApi(formData);
    //         alert("공지사항이 성공적으로 수정되었습니다.");
    //
    //         // 수정 완료 후 최신 데이터로 다시 패치하여 팝업 갱신
    //         const updatedData = await getMainNoticeApi(ntcId);
    //         initFormData(updatedData);
    //
    //         setIsReadOnly(true); // 다시 읽기 모드 전환
    //         onRefreshList();     // 부모 그리드 리프레시
    //     } catch (error) {
    //         console.error("수정 실패:", error);
    //         alert("수정 중 오류가 발생했습니다.");
    //     }
    // };

    if (isLoading) {
        return (
            <div className="popupWrap" style={{ display: 'block' }}>
                <div className="popupInner"><div className="popup"><h3>로딩 중...</h3></div></div>
            </div>
        );
    }

    return (
        <div className="popupWrap" style={{ display: 'block' }}>
            <div className="popupInner">
                <div className="popup popup_notice">
                    <h3>공지사항 {isReadOnly ? "상세보기" : "수정하기"}</h3>
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
                                        disabled={isReadOnly}
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
                                            disabled={isReadOnly}
                                            onChange={() => handleTargetChange('user')}
                                        /> 사용자
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={targets.pm}
                                            disabled={isReadOnly}
                                            onChange={() => handleTargetChange('pm')}
                                        /> PM사
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={targets.tow}
                                            disabled={isReadOnly}
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
                                            disabled={isReadOnly}
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
                                        disabled={isReadOnly}
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {existingFileName && isReadOnly && (
                                        <p className="file-info" style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}>
                                            📄 기존 파일: {existingFileName}
                                        </p>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>표출여부</th>
                                <td>
                                    <select value={displayYn} disabled={isReadOnly} onChange={(e) => setDisplayYn(e.target.value)}>
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="noticon" colSpan={2}>
                                        <textarea
                                            placeholder="내용을 입력하세요"
                                            value={content}
                                            disabled={isReadOnly}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        <div className="btnSet">
                            <button onClick={onClose}>닫기</button>

                            {isReadOnly ? (
                                <>
                                    <button onClick={() => setIsReadOnly(false)}>수정</button>
                                    <button className="red" onClick={() => {/* 삭제 로직 필요시 추가 */}}>삭제</button>
                                </>
                            ) : (
                                <>
                                    {/*<button className="red" onClick={handleConfirmUpdate}>저장</button>*/}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}