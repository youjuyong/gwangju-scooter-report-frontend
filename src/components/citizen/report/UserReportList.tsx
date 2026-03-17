"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { ApiResponse, ReportData, ReportItem } from "@/types/report";
import ReportItemCard from "@/components/shared/report/ReportItemCard";
import { ClipboardList } from "lucide-react";

export default function UserReportList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<ReportData>>("api/report/me");
        if (response.data.success) {
          setReports(response.data.data.content);
        }
      } catch (error) {
        console.error("내 신고 내역 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyReports();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">내역 불러오는 중...</div>;
  if (reports.length === 0) return (
    <div className="flex flex-col items-center py-20 text-gray-400">
      <ClipboardList size={48} className="mb-3 opacity-20" />
      <p>접수된 신고 내역이 없습니다.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportItemCard key={report.reportId} report={report} />
      ))}
    </div>
  );
}