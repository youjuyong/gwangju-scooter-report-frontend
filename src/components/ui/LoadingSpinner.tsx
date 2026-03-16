"use client";

import { CheckCircle2, PackageCheck } from "lucide-react"; // 예: 전문적인 아이콘 추가 가능

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-[#F2F4F7] z-[9999] flex flex-col items-center justify-center font-sans">
      {/* 1. 브랜드 이름 & 아이콘 */}
      <div className="flex items-center gap-2 mb-16 animate-pulse">
        <PackageCheck className="w-9 h-9 text-blue-600" />
        <h1 className="text-2xl font-black text-gray-950 tracking-tighter">
          광주 <span className="text-gray-900 font-bold ml-1">PM 회수 관리</span>
        </h1>
      </div>

      {/* 2. 메인 애니메이션 구역 (가운데 정렬) */}
      <div className="relative flex items-center justify-center w-52 h-52">
        {/* 역동적인 이중 스피너 */}
        <div className="absolute inset-0 rounded-full border-[6px] border-gray-100"></div>
        <div className="absolute inset-0 rounded-full border-[6px] border-blue-600 border-t-transparent animate-[spin_1s_linear_infinite_reverse]"></div>
        <div className="absolute inset-3 rounded-full border-[6px] border-emerald-500 border-b-transparent animate-spin"></div>
        
        {/* 중앙 메시지/아이콘 */}
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="w-16 h-16 text-blue-700 opacity-90 mb-1" />
          <p className="text-sm font-bold text-gray-500">인증 확인 중</p>
        </div>
      </div>

      {/* 3. 하단 상태 메시지 */}
      <div className="mt-16 text-center">
        <p className="text-xl font-extrabold text-gray-900 animate-pulse">
          로그인 정보를 처리하고 있습니다.
        </p>
        <p className="text-base text-gray-500 mt-2 font-medium">
          시스템 연결을 위해 잠시만 기다려주세요.
        </p>
      </div>

      {/* 4. 장식용 그래픽 요소 (선택사항, 은은한 배경 패턴) */}
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-100 rounded-full opacity-30 blur-2xl"></div>
      <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-100 rounded-full opacity-30 blur-3xl"></div>
    </div>
  );
}