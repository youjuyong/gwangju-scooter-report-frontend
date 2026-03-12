import CitizenLoginForm from "@/components/citizen/login/CitizenLoginForm";
import { Info } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {/* 헤더 부분 (서버에서 미리 렌더링) */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl" role="img" aria-label="scooter">🛴</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">PM 신고 시스템</h1>
          <p className="mt-2 text-sm text-gray-600">관리자 계정으로 로그인하세요</p>
        </div>

        {/* 실제 로직이 들어있는 클라이언트 컴포넌트 호출 */}
        <CitizenLoginForm />

        {/* 푸터 안내 (정적 요소) */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-4">
          <Info size={14} />
          <span>계정 분실 시 전산팀에 문의하세요.</span>
        </div>
      </div>
    </div>
  );
}