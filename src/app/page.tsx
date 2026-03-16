"use client";

import { useState, useEffect } from "react";
import { Home, Camera, ClipboardList, Megaphone, LogOut, ChevronRight, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseMessaging } from "@/hooks/useFCM"; 
import ReportQRCodeSection from "@/components/dashboard/ReportQRCodeSection";
import { getToken } from "firebase/messaging";

export default function SeoulFullWidthDashboard() {
  const [activeTab, setActiveTab] = useState("홈");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const renderContent = () => {
    switch (activeTab) {
      case "홈": return <HomeSection setActiveTab={setActiveTab} />;
      case "신고하기": 
        return <ReportQRCodeSection />;
      case "신고확인": return <div className="p-10 text-center font-bold">📋 신고 내역 확인</div>;
      case "공지사항": return <div className="p-10 text-center font-bold">📢 공지사항 리스트</div>;
      default: return <HomeSection setActiveTab={setActiveTab} />;
    }
  };

  const handleAllowNotification = async () => {
      const isSupported = 
        typeof window !== "undefined" && 
        "serviceWorker" in navigator &&
        (location.protocol === "https:" || location.hostname === "localhost");
  
      if (!isSupported) return null;
  
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return null;
  
        // 서비스 워커 등록 확인
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;
  
        // FCM 토큰 가져오기
        const messaging = getFirebaseMessaging();
        if (!messaging) return null;
  
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        console.log(currentToken);
        return currentToken;
      } catch (error) {
        console.error("FCM 설정 에러:", error);
        return null;
      }
  };


  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  
  useEffect(() => {
      handleAllowNotification();
  }, []);

  return (
    // max-w-md를 제거하여 전체 너비를 사용합니다.
    <div className="min-h-screen bg-[#F2F4F7] flex flex-col font-sans w-full">
      
      {/* 상단 헤더: 컨텐츠가 너무 퍼지지 않게 안쪽에만 max-wide를 줄 수 있습니다. */}
      <header className="sticky top-0 z-20 bg-white w-full border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => setActiveTab("홈")}>
            광주 <span className="text-gray-900 font-bold ml-1">PM 신고</span>
          </h1>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            {isLoggedIn ? (
              <button 
                onClick={() => {
                  localStorage.removeItem("accessToken"); // 토큰 삭제 예시
                  setIsLoggedIn(false);
                  router.replace("/app");
                }} 
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            ) : (
              // 로그인 전일 때: 로그인 버튼
              <button 
                onClick={() => router.push("/commLogin")} 
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 w-full max-w-7xl mx-auto pb-24">
        {renderContent()}
      </main>

      {/* 하단 탭바: 모바일에서는 고정, PC에서도 하단 유지 */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center py-2 px-4">
          <TabItem icon={<Home size={24} />} label="홈" active={activeTab === "홈"} onClick={() => setActiveTab("홈")} />
          <TabItem icon={<Camera size={24} />} label="신고하기" active={activeTab === "신고하기"} onClick={() => setActiveTab("신고하기")} />
          <TabItem icon={<ClipboardList size={24} />} label="신고확인" active={activeTab === "신고확인"} onClick={() => setActiveTab("신고확인")} />
          <TabItem icon={<Megaphone size={24} />} label="공지사항" active={activeTab === "공지사항"} onClick={() => setActiveTab("공지사항")} />
        </div>
      </nav>
    </div>
  );
}

function HomeSection({ setActiveTab }: any) {
  return (
    <div className="px-5 py-6 space-y-8">
      {/* 대형 배너: PC에서는 가로로 길게 늘어남 */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black leading-tight">
            보행자의 안전을 위해<br />
            방치된 킥보드를 신고해주세요.
          </h2>
          <p className="mt-4 text-blue-100 text-lg opacity-90">
            광주광역시 전역의 불법 주정차 PM 기기를 단속합니다.
          </p>
          <button 
            onClick={() => setActiveTab("신고하기")}
            className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
          >
            지금 바로 신고하기
          </button>
        </div>
      </section>

      {/* 메뉴 그리드: PC에서는 2열, 모바일에서는 1열 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MenuButton 
          icon={<Camera className="text-white" />} 
          bgColor="bg-blue-500"
          title="신고하기" 
          desc="사진을 찍어 즉시 신고를 접수합니다." 
          onClick={() => setActiveTab("신고하기")}
        />
        <MenuButton 
          icon={<ClipboardList className="text-white" />} 
          bgColor="bg-emerald-500"
          title="신고확인" 
          desc="내가 접수한 민원의 처리 현황을 확인합니다." 
          onClick={() => setActiveTab("신고확인")}
        />
      </section>
    </div>
  );
}

function MenuButton({ icon, title, desc, onClick, bgColor }: any) {
  return (
    <button onClick={onClick} className="flex items-center p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left group">
      <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center mr-5 shadow-inner`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-lg">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
      </div>
      <ChevronRight size={24} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}

function TabItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? "text-blue-600 scale-110" : "text-gray-400 hover:text-gray-600"}`}>
      {icon}
      <span className={`text-[11px] font-bold ${active ? "opacity-100" : "opacity-70"}`}>{label}</span>
    </button>
  );
}