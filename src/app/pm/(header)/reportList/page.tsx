"use client";


import Cookies from "js-cookie";
import ReportList from "@/components/report/ReportList";

export default function PmReportPage() {
    const token = Cookies.get("pmAccessToken");

    return (
        <ReportList
            prefix="/pm"
            token={token}
            title="회수관리"
        />
    );
}