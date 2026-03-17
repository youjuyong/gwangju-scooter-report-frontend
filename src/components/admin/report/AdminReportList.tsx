"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { updateReportStatus } from "@/services/report";
import { ApiResponse, ReportData, ReportItem, ReportStatus } from "@/types/report";
import ReportItemCard from "@/components/shared/report/ReportItemCard";

export default function AdminReportList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchAllReports(); }, []);

  // 상태 변경 핸들러
   const handleStatusChange = async (reportId: number, status: ReportStatus) => {
    // 사용자 확인 문구 분기
    const statusText = 
        status === "DONE" ? "작업" : 
        status === "REJECTED" ? "반려" :
        "반려 처리";

    if (!confirm(`${statusText}하시겠습니까?`)) return;

    try {
        const res = await updateReportStatus(reportId, status);
        
        if (res.success) {
        toast.success(`${statusText}되었습니다.`);
        fetchAllReports(); // 목록 새로고침
        }
    } catch (error: any) {
        toast.error("상태 변경 중 오류가 발생했습니다.");
    }
    };

  if (loading) return <div className="p-10 text-center text-gray-400">데이터 로드 중...</div>;
  return (
    <div className="space-y-4">
    {reports.map((report) => (
        <ReportItemCard key={report.reportId} report={report}>
        {/* 상태가 'PROCESSING'일 때만 관리자 액션 버튼 노출 */}
        {report.reportStatus === "PROCESSING" ? (
            <div className="flex gap-2 w-full">
            <button 
                onClick={() => handleStatusChange(report.reportId, "DONE")}
                className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
                작업
            </button>
            <button 
                onClick={() => handleStatusChange(report.reportId, "REJECTED")}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
                반려
            </button>
            </div>
        ) : (
            /* 이미 완료되거나 반려된 건은 정보만 표시 (선택 사항) */
            <div className="w-full py-2 px-4 bg-gray-50 rounded-xl text-center">
            <p className="text-[11px] text-gray-400 font-medium">
                이 신고 건은 이미 처리가 완료되었습니다.
            </p>
            </div>
        )}
        </ReportItemCard>
    ))}
    </div>
  );
}