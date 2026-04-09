"use client";

import { Bell, MapPin, ClipboardList, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import axios from "axios";
import authApi from "@/services/api";

export default function SimpleDashboard() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRole = useAuthStore((state) => state.setRole);
  const { getDeviceInfo } = useFcmToken();
  const deviceType = getDeviceInfo();

  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;

    try {
      await authApi.post('/api/auth/logout', {
        deviceType: deviceType // "WEB", "ANDROID", "IOS" 등
       });
      setAccessToken(null); 
      setRole(null);
      //  Axios 공통 헤더도 같이 비워주기
      delete axios.defaults.headers.common['Authorization'];
      
      router.replace("/"); 
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. 심플 상단 바 - 로그아웃 버튼 추가 */}
      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-yellow-600">PM 신고 관리</h1>
        <div className="flex items-center gap-3">
          {/* 로그아웃 버튼 */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
          <div className="p-2 bg-gray-100 rounded-full">
            <User size={20} className="text-gray-600" />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* ... (기존 섹션들 동일) ... */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500 mb-1 font-medium">대기 중</p>
            <p className="text-2xl font-bold">12건</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-400">
            <p className="text-sm text-gray-500 mb-1 font-medium">처리 완료</p>
            <p className="text-2xl font-bold text-blue-600">5건</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 px-1">빠른 메뉴</h2>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center justify-between bg-yellow-400 p-4 rounded-xl font-bold shadow-sm active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <MapPin size={20} />
                <span>주변 단속지 확인 (지도)</span>
              </div>
              <span className="text-lg">→</span>
            </button>
            <button className="flex items-center justify-between bg-white p-4 rounded-xl font-bold border shadow-sm active:scale-95 transition-transform">
              <div className="flex items-center gap-3 text-gray-700">
                <ClipboardList size={20} />
                <span>신고 내역 전체 보기</span>
              </div>
              <span className="text-lg text-gray-400">→</span>
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-bold text-gray-400">최근 접수 내역</h2>
            <span className="text-xs text-blue-500 cursor-pointer">더보기</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <p className="font-bold text-sm">불법 주차 신고 (빔)</p>
                <p className="text-xs text-gray-500 mt-1">경기도 하남시 망월동 ...</p>
              </div>
              <span className="bg-red-50 text-red-500 text-[10px] px-2 py-1 rounded-md font-bold">긴급</span>
            </div>
            <p className="text-xs text-gray-400 text-right">방금 전</p>
          </div>
        </section>
      </main>

      {/* 5. 하단 탭바 */}
      <nav className="mt-auto bg-white border-t flex justify-around p-3 pb-6">
        <div className="flex flex-col items-center gap-1 text-yellow-500 cursor-pointer">
          <Bell size={20} />
          <span className="text-[10px]">홈</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer">
          <MapPin size={20} />
          <span className="text-[10px]">지도</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer">
          <User size={20} />
          <span className="text-[10px]">내 정보</span>
        </div>
      </nav>
    </div>
  );
}