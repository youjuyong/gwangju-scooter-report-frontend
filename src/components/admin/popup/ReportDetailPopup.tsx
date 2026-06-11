"use client";

import React, { useState, useEffect } from 'react';
import {getReportDetail} from "@/services/report/reportApi";
import { useDrag } from "@/hooks/userDrag";

interface ReportDetailModalProps {
    isOpen: boolean;
    bzentyId: string ;
    onClose: () => void;
    onRefreshList: () => void;
    data:any | null;
}

export default function ReportDetailPopup({ isOpen, bzentyId, onClose, onRefreshList,data }: ReportDetailModalProps){
    const [report, setReport] = useState<any>(null);
    const { position, handleMouseDown, isDragging } = useDrag(isOpen); // 팝업 드래그

    useEffect(() => {
        if (!data || !data.dclrId) return;

        let isMounted = true; // 연속 클릭 시 이전 요청 무시용 안전장치

        const fetchDetail = async () => {
            try {
                const res = await getReportDetail(data.dclrId);
                if (res.success && isMounted) {
                    console.log(res.data);
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
    }, [data ,isOpen]);
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


    const getStatusStyle = (prcsStpCd : any) => {
        switch (prcsStpCd) {
            case "DEST01": return "st1";
            case "DEST02": return "st2";
            case "DEST03": return "st3";
            case "DEST04": return "st4";
            case "DEST06": return "st5";
            case "DEST07": return "st6";
            case "DEST08": return "st7";
            case "DEST09": return "st8";
            default: return "알 수 없음"; // 예외 처리
        }
    };
    const statusClass = getStatusStyle(data?.prcsStpCd) || "si1";



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
                    <p className={`state ${statusClass}`}>
                        {data.prcsStpNm} {/*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8 */}
                    </p>
                    <div className="address">경기도 광주시 탄벌동 28-4</div>
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
                            {data?.prcrId && (
                                <tr>
                                    <th>처리자ID</th>
                                    <td>{data.prcrId}</td>
                                </tr>
                            )}
                            {data?.prcsDt && (
                                <tr>
                                    <th>처리일시</th>
                                    <td className="blue">{data.prcsDt}</td>
                                </tr>
                            )}
                            {data?.prcsRsn && (
                                <tr>
                                    <th>처리사유</th>
                                    <td>{data.prcsRsn}</td>
                                </tr>
                            )}
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
                </div>
            </div>
        </div>
    </div>
    );
}