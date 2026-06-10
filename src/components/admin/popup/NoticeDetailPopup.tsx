"use client";

import React, { useState, useEffect } from 'react';
import { NoticeResponse } from '@/types/notice';
import {deleteNoticeApi, getMainNoticeApi, updateNoticeApi} from "@/services/notice/noticeApi";
import LoadingOverlay from "@/components/LoadingOverlay";

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

    const [existingFiles, setExistingFiles] = useState<any[]>([]); // 서버에서 온 파일들
    const [newFiles, setNewFiles] = useState<File[]>([]);           // 새로 업로드할 파일들

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setIsLoading(true);
                const data = await getMainNoticeApi(ntcId);
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

    if (!isOpen || !ntcId) return null;
    // 데이터 매핑 공통 함수
    const initFormData = (data: any) => {
        setTitle(data.ttlNm || '');
        setIsFixed(data.mainExpsrYn === 'Y');
        setContent(data.cnData || '');
        setDisplayYn(data.exprsYn || 'Y'); // 백엔드 필드명 exprsYn 반영

        // 1. 표출 시작일 바인딩 ("2026-06-09 00:00" -> 공백 기준 분리)
        if (data.expsrBgngDt && typeof data.expsrBgngDt === 'string') {
            setStartDate(data.expsrBgngDt.split(' ')[0]);
        } else {
            setStartDate('');
        }

        // 2. 표출 종료일 바인딩 (null 처리 방어 코드)
        if (data.expsrEndDt && typeof data.expsrEndDt === 'string') {
            setEndDate(data.expsrEndDt.split(' ')[0]);
        } else {
            setEndDate('');
        }

        // 3. 첨부파일 바인딩 (files 배열 처리)
        if (data.files && Array.isArray(data.files)) {
            setExistingFiles(data.files);
        } else {
            setExistingFiles([]);
        }
        setNewFiles([]); // 초기화

        // 4. 표출범위 바인딩 (백엔드 targetArr 객체 배열 완벽 분석 매핑)
        const targetList = Array.isArray(data.targetArr) ? data.targetArr : [];

        // 해당 코드가 배열 안에 존재하는지 검사
        const hasUser = targetList.some((t: any) => t.userTypeCd === 'MNUT05');
        const hasPm = targetList.some((t: any) => t.userTypeCd === 'MNUT03');
        const hasTow = targetList.some((t: any) => t.userTypeCd === 'MNUT04');

        setTargets({
            user: hasUser,
            pm: hasPm,
            tow: hasTow
        });
    };

    const handleTargetChange = (key: 'user' | 'pm' | 'tow') => {
        if (isReadOnly) return;
        setTargets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfirmUpdate = async () => {
        const formattedStartDate = startDate ? `${startDate}T00:00:00` : '';
        const formattedEndDate = endDate ? `${endDate}T23:59:59` : '';

        const userTypeCds: string[] = [];
        if (targets.user) userTypeCds.push('MNUT05');
        if (targets.pm) userTypeCds.push('MNUT03');
        if (targets.tow) userTypeCds.push('MNUT04');

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

        const formData = new FormData();
        formData.append('ntcId', ntcId);
        formData.append('ttlNm', title);
        formData.append('cnData', content);
        formData.append('ntcTypeCd', 'NTCT01');
        formData.append('mainExpsrYn', isFixed ? 'Y' : 'N');
        formData.append('exprsYn', displayYn);
        formData.append('expsrBgngDt', formattedStartDate);
        formData.append('expsrEndDt', formattedEndDate);

        userTypeCds.forEach(cd => formData.append('userTypeCds', cd));

        // 살아남은 기존 파일 ID 전송
        existingFiles.forEach(file => formData.append('existingFileIds', file.fileId));
        // 신규 추가 파일 전송
        newFiles.forEach(file => formData.append('noticeFiles', file));
        try {
            await updateNoticeApi(formData);
            alert("공지사항이 성공적으로 수정되었습니다.");

            const updatedData = await getMainNoticeApi(ntcId);
            initFormData(updatedData);

            setIsReadOnly(true);
            onRefreshList();
        } catch (error) {
            console.error("수정 실패:", error);
            alert("수정 중 오류가 발생했습니다.");
        }
    };
    const handleDeleteNotice = async () => {
        if (window.confirm("이 공지사항을 정말로 삭제하시겠습니까?")) {
            try {
                setIsLoading(true);
                await deleteNoticeApi(ntcId); // 단건 삭제 API 호출
                alert("공지사항이 정상적으로 삭제되었습니다.");

                onRefreshList(); // 부모 목록 그리드 새로고침
                onClose();       // 팝업 닫기
            } catch (error) {
                console.error("공지사항 팝업 내 삭제 실패:", error);
                alert("삭제 처리 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };


    if (isLoading) {
        return (
            <LoadingOverlay
                message={"데이터를 로딩 중입니다..."}
            />
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
                                    {isReadOnly ? (
                                        /* 🔎 1. 상세보기 모드 (다운로드 링크 표출, 없으면 숨김 행 처리 원할 시 껍데기 유지) */
                                        existingFiles.length > 0 ? (
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                                {existingFiles.map((file, idx) => (
                                                    <div key={file.fileId || idx}>
                                                        <a
                                                            href={`/api/system/files/download/${file.fileId}`}
                                                            download
                                                            aria-label={`${file.orgnlFileNm} 다운로드`}
                                                            style={{
                                                                color: '#0066cc',
                                                                textDecoration: 'underline',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {file.orgnlFileNm}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{color: '#999', fontSize: '13px'}}>등록된 첨부파일이 없습니다.</span>
                                        )
                                    ) : (
                                        /* 🛠️ 2. 수정하기 모드 (다중 파일 업로드 및 개별 X 삭제) */
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        const selectedFiles = Array.from(e.target.files);
                                                        setNewFiles(prev => [...prev, ...selectedFiles]);
                                                    }
                                                }}
                                            />
                                            {(existingFiles.length > 0 || newFiles.length > 0) && (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                                    {/* 기존 파일 목록 & X 삭제 */}
                                                    {existingFiles.map((file, idx) => (
                                                        <div key={file.fileId || idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '13px',
                                                                color: '#555'
                                                            }}> {file.orgnlFileNm}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#e15252',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* 신규 파일 목록 & X 삭제 */}
                                                    {newFiles.map((file, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '13px',
                                                                color: '#0066cc'
                                                            }}>{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#e15252',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>표출여부</th>
                                <td>
                                    <select value={displayYn} disabled={isReadOnly}
                                            onChange={(e) => setDisplayYn(e.target.value)}>
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
                                    <button className="red" onClick={handleDeleteNotice}>삭제</button>
                                </>
                            ) : (
                                <>
                                    <button className="red" onClick={handleConfirmUpdate}>저장</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}