"use client";

import { useEffect } from "react";
import { registerMenuLog } from "@/services/common/commonApi";
import Cookies from "js-cookie";
import ReportList from "@/components/report/ReportList";

export default function PmReportPage() {
    const token = Cookies.get("pmAccessToken");

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("PMS2000"); 
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <ReportList
            prefix="/pm"
            token={token}
            title="회수관리"
        />
    );
}