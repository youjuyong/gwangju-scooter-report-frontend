"use client";

import React, { useState, useEffect } from 'react';
import {getReportDetail} from "@/services/report/reportApi";
import { useDrag } from "@/hooks/userDrag";
import {useModeStore} from "@/store/dashboardStore";

interface ReportDetailModalProps {
    isOpen: boolean;
    bzentyId: string ;
    onClose: () => void;
    onRefreshList: () => void;
    data:any | null;
    isDashBoard?: boolean;
}

export default function ReportDetailPopup({ isOpen, bzentyId, onClose, onRefreshList, data, isDashBoard }: ReportDetailModalProps){
    const [report, setReport] = useState<any>(null);
    const { position, handleMouseDown, isDragging } = useDrag(isOpen); // 팝업 드래그
    const { currentMode, isSubmitting } = useModeStore();

    useEffect(() => {
        if (!isOpen || !data.dclrId) return;

        let isMounted = true; // 연속 클릭 시 이전 요청 무시용 안전장치

        const fetchDetail = async () => {
            try {
                const res = await getReportDetail(data.dclrId);
                if (res.success && isMounted) {
                    setReport(res.data);
                }
            } catch (error) {
                console.error("상세 내역 로드 실패:", error);
            }
        };

        fetchDetail();

        return () => {
            isMounted = false; // 컴포넌트가 언마운트되거나 data가 바뀌면 이전 요청 차단
        };
    }, [data?.dclrId ,isOpen]);
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

    if (!isOpen || !bzentyId) return null;

    //처리상태 코드
    const STATUS_CONFIG: { [key: string]: { className: string; text: string } } = {
        "DEST01": {className: "st1", text: "미승인"},
        "DEST02": {className: "st2", text: "미배정"},
        "DEST03": {className: "st3", text: "처리중"},
        "DEST04": {className: "st4", text: "처리완료"},
        "DEST06": {className: "st5", text: "견인미승인"},
        "DEST07": {className: "st6", text: "견인요청"},
        "DEST08": {className: "st7", text: "견인처리중"},
        "DEST09": {className: "st8", text: "견인완료"},
        "DEST10": {className: "st4", text: "자동취소"}
    };
    const getStatusInfo = (prcsStpCd : string) => {
        return STATUS_CONFIG[prcsStpCd] || { className: "st4", label: "알 수 없음" };
    };
    const { className, text } = getStatusInfo(data?.prcsStpCd);

    return(
    <div className="popupWrap">
        <div className="popupInner">
            <div
                className="popup popup_kick"
                style={{  // 팝업 드래그
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease'
                }}
            >
                <h3   // 팝업 드래그
                    onMouseDown={handleMouseDown}
                    style={{cursor: 'move', userSelect: 'none'}}
                >
                    신고정보
                </h3>
                <button className="popupClose" onClick={onClose}>닫기</button>
                <div className="popupconten">
                    <p className={`state ${className}`}>
                        {text}
                    </p>
                    <div className="address">{data.dclrAddrTxt}</div>
                    <table>
                        <tbody>
                        <tr>
                            <th>신고일시</th>
                            <td>{data.dclDt}</td>
                        </tr>
                        <tr>
                            <th>신고번호</th>
                            <td>{data.dclrId}</td>
                        </tr>
                        <tr>
                            <th>신고자ID</th>
                            <td>{data.dclrUserId}</td>
                        </tr>
                        <tr>
                            <th>위반유형</th>
                            <td>{data.vltnTypeNm}</td>
                        </tr>
                        <tr>
                            <th>상세설명</th>
                            <td>{data.dclrCn || "상세 설명이 없습니다."}</td>
                        </tr>
                        <tr>
                            <th>PM사</th>
                            <td>{data.bzentyNm}</td>
                        </tr>
                        <tr>
                            <th>킥보드ID</th>
                            <td>{data.qrVal}</td>
                        </tr>
                        </tbody>
                    </table>

                    <div className="kickimg">
                        {report?.imgUrls?.map((url: string, index: number) => (
                            <div key={`my-img-${index}`} className={`imgli ${index === 1 ? "lastimgli" : ""}`}>
                                <div className="imgsize">
                                    <img src={url} alt={`주정차 위반 신고 촬영한 사진${index + 1}`}/>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="table2">
                        <table>
                            <tbody>
                            <tr>
                                <th>처리자ID</th>
                                <td>{data?.prcrId ? data.prcrId : "-"}</td>
                            </tr>
                            <tr>
                                <th>처리일시</th>
                                <td className="blue">{data?.prcsDt ? data.prcsDt : "-"}</td>
                            </tr>
                            <tr>
                                <th>처리사유</th>
                                <td>{data.prcsRsn ? data.prcsRsn : "-"}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="kickimg kickimg_ok">
                        <div className="imgli">
                        <div className="imgsize">
                                {report?.completeImgUrls && report.completeImgUrls[0] ? (
                                    <img src={report.completeImgUrls[0]} alt="업체 처리 완료 사진1"/>
                                ) : null}
                            </div>
                        </div>
                        <div className="imgli lastimgli">
                            <div className="imgsize">
                                {report?.completeImgUrls && report.completeImgUrls[1] ? (
                                    <img src={report.completeImgUrls[1]} alt="업체 처리 완료 사진2"/>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    {currentMode === "MANUAL" && (
                        <div className="btnSet">
                            <button>반려</button>
                            {/*반려 시 리스트에서 삭제*/}
                            <button className="red">승인</button>
                            {/*승인 시 미배정으로 변경*/}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
}