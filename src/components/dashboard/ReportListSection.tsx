"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types/auth";
import { Lock } from "lucide-react";

import UserReportList from "@/components/citizen/report/UserReportList";
import AdminReportList from "@/components/admin/report/AdminReportList";

export default function ReportListSection() {
  const { accessToken, role } = useAuthStore();

  // 1. 로그인하지 않은 경우 (가드 로직)
  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-5">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="text-gray-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">접근 제한</h3>
        <p className="text-gray-500 text-center leading-relaxed">
          로그인 후 이용 가능합니다.<br />
          본인의 신고 내역을 안전하게 확인해보세요.
        </p>
      </div>
    );
  }

  // 2. 로그인된 경우 권한에 따른 렌더링
  return (
    <div className="px-5 py-8 max-w-4xl mx-auto">
      {/* 상단 헤더 영역 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {role === UserRole.ADMIN ? "전체 신고 관리" : "나의 신고 내역"}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {role === UserRole.ADMIN 
              ? "시스템에 접수된 모든 신고 건을 관리합니다." 
              : "직접 접수한 신고 내역의 처리 상태를 확인하세요."}
          </p>
        </div>
      </div>

      {/* 권한별 리스트 컴포넌트 분기 */}
      <div className="min-h-[400px]">
        {role === UserRole.ADMIN ? (
          <AdminReportList />
        ) : (
          <UserReportList />
        )}
      </div>
    </div>
  );
}