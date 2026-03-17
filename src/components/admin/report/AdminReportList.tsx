"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { ApiResponse, ReportData, ReportItem } from "@/types/report";
import ReportItemCard from "@/components/shared/report/ReportItemCard";

export default function AdminReportList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<ReportData>>("api/report");
        if (response.data.success) {
          setReports(response.data.data.content);
        }
      } catch (error) {
        console.error("전체 신고 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">전체 데이터 로드 중...</div>;

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 p-4 rounded-2xl mb-4 text-sm text-blue-700 font-semibold">
        💡 관리자 권한으로 전체 내역을 조회 중입니다.
      </div>
      {reports.map((report) => (
        <ReportItemCard 
          key={report.reportId} 
          report={report} 
          onClick={(id) => console.log(`관리자 액션: ${id}번 신고 확인`)} 
        />
      ))}
    </div>
  );
}