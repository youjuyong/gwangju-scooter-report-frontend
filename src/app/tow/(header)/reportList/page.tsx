"use client";


import Cookies from "js-cookie";
import { useEffect } from "react";
import { registerMenuLog } from "@/services/common/commonApi";
import ReportList from "@/components/report/ReportList_Tow";

export default function PmReportPage() {
    const token = Cookies.get("towAccessToken");

     useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("TOW2000"); 
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return (
        <ReportList
            prefix="/tow"
            token={token}
            title="회수관리"
        />
    );
}