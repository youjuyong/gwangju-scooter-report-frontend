"use client";


import Cookies from "js-cookie";
import ReportList from "@/components/report/ReportList";

export default function PmReportPage() {
    const token = Cookies.get("towAccessToken");

    return (
        <ReportList
            prefix="/tow"
            token={token}
            title="회수관리"
        />
    );
}