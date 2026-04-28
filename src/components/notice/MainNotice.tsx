"use client";

import React, { useState, useEffect } from "react";
import {getMainNoticeApi} from "@/services/notice/noticeApi";
import {NoticeResponse} from "@/types/notice";

export default function MainNotice() {
    const [notices, setNotices] = useState<NoticeResponse[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 1. 데이터 가져오기 (최근 3개, 메인 노출용)
    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const result = await getMainNoticeApi({
                    page: 0,
                    size: 3,
                    mainExpsrYn: 'Y'
                });
                setNotices(result);
            } catch (error) {
                console.error("공지 로딩 실패:", error);
            }
        };
        fetchNotices();
    }, []);


    // 다음 공지 보기
    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % notices.length);
    };

    // 이전 공지 보기
    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);
    };

    // 데이터가 없을 때의 처리
    if (notices.length === 0) {
        return (
            <article className="mainBoard">
                <h2>공지사항</h2>
                <div className="title">
                    <a href="#">등록된 공지사항이 없습니다.</a>
                </div>
            </article>
        );
    }

    return (
        <article className="mainBoard">
            <h2>공지사항</h2>
            <div className="title">
                {/* 공지사항 화면 나오면  이동  */}
                {/*<a href={`/notice/${notices[currentIndex].ntcId}`}>*/}
                <a>
                    {notices[currentIndex].ttlNm}
                </a>
            </div>
            <div className="main_bord_arrow">
                <button
                    type="button"
                    className="btnleft"
                    aria-label="이전 공지 보기"
                    onClick={handlePrev}
                >
                    이전공지보기
                </button>
                <button
                    type="button"
                    className="btnright"
                    aria-label="다음 공지 보기"
                    onClick={handleNext}
                >
                    다음공지보기
                </button>
            </div>
        </article>
    );
}