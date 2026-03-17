"use client";

import { ReportItem } from "@/types/report";
import { getReportStatusInfo, formatDateTime } from "@/utils/format";
import { ChevronRight } from "lucide-react";
interface Props {
  report: ReportItem;
  onClick?: (id: number) => void;
  children?: React.ReactNode; // 관리자 버튼 등을 위한 슬롯
}

export default function ReportItemCard({ report, onClick, children }: Props) {
  const { label, style } = getReportStatusInfo(report.reportStatus);

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <div 
        onClick={() => onClick?.(report.reportId)}
        className="flex items-center justify-between group cursor-pointer"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${style}`}>
              {label}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              {formatDateTime(report.reportedAt)}
            </span>
          </div>
          <p className="font-bold text-gray-800">킥보드 ID: {report.scooterId}</p>
        </div>
        <ChevronRight className="text-gray-200 group-hover:text-blue-500 transition-colors" size={20} />
      </div>

      {/* 관리자 전용 버튼 영역 (있을 때만 렌더링) */}
      {children && (
        <div className="pt-3 border-t border-gray-50 flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}