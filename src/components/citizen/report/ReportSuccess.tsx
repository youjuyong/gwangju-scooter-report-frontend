"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ReportSuccess() {
    const router = useRouter();

    const handleConfirm = () => {
        router.push("/");
    };

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>킥보드 주정차 위반신고 완료</h1>
                <button type="button" className="back" onClick={handleConfirm}>
                    뒤로 가기
                </button>
            </header>
            <main className="sub_article sub_article_padding">
                <div className="com_txt">
                    <p>주정차 위반 전동 킥보드의</p>
                    <p>신고가 완료되었습니다.</p>
                </div>
                <button type="button" className="go_report" onClick={handleConfirm}>
                    확인
                </button>
            </main>
        </div>
    );
}