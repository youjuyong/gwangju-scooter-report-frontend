"use client";

import React, {useEffect, useState} from "react";
import {getReportTerms} from "@/app/(citizen)/report/actions";

interface ReportTermsProps {
    onBack: () => void;
}

export default function ReportTerms({onBack}: ReportTermsProps) {
    const [termsContent, setTermsContent] = useState<string>("내용을 불러오는 중입니다...");

    useEffect(() => {
        const fetchTerms = async () => {
            const data = await getReportTerms();
            setTermsContent(data);
        };

        fetchTerms();
    }, []);

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>개인정보처리방침</h1>
                <button type="button" className="back" onClick={onBack} style={{cursor: 'pointer'}}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="allBox">
                    <div className="agreecon" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                        {termsContent}
                    </div>
                </div>
            </main>
        </div>
    );
}