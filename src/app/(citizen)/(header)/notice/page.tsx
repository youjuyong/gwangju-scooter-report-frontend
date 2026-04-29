"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { getMainNoticeApi } from "@/services/notice/noticeApi";
import { NoticeResponse } from "@/types/notice";
import Link from "next/link";

export default function NoticeListPage() {
    const [notices, setNotices] = useState<NoticeResponse[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [activeTab, setActiveTab] = useState("공지사항");

    useEffect(() => {
        const fetchAllNotices = async () => {
            try {
                // 목록 페이지이므로 size를 넉넉히 잡거나 페이징 로직을 넣습니다.
                const result = await getMainNoticeApi({
                    page: 0,
                    size: 20, // 일단 20개 로드
                });

                // API 구조에 따라 result가 배열이거나 content를 포함한 객체일 수 있습니다.
                // 여기서는 이전 답변에서 정리한 content 배열 기준입니다.
                setNotices(result);
                setTotalCount(result.length); // 실제로는 API의 totalElements를 사용 권장
            } catch (error) {
                console.error("공지사항 목록 로드 실패:", error);
            }
        };

        fetchAllNotices();
    }, []);

    return (
        // 공지사항 페이지는 wrap에 별도의 클래스가 필요할 수 있어 sub-wrap 등을 적용


                <article className="subBoard">
                    <h2>공지사항</h2>
                    <div className="noticount">
                        총 <span>{totalCount}</span>건
                    </div>

                    <ul className="notilistBody">
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <li key={notice.ntcId}>
                                    {/* 상세 페이지 이동 (Link 활용) */}
                                    <Link href={`/notice/${notice.ntcId}`}>
                                        <p className="noticeTitle">{notice.ttlNm}</p>
                                        <p className="noticeDay">{notice.regDt}</p>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li className="text-center py-10">등록된 공지사항이 없습니다.</li>
                        )}
                    </ul>
                </article>


    );
}