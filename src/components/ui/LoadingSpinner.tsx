"use client";

import { CheckCircle2, PackageCheck } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ 
        backgroundColor: '#F2F4F7', 
        zIndex: 9999,
        fontFamily: "'NanumSquareNeo', sans-serif" 
      }}
    >
      {/* 1. 브랜드 이름 & 아이콘 */}
      <div className="flex items-center gap-2 mb-16 animate-pulse" style={{ display: 'flex', marginBottom: '64px' }}>
        <PackageCheck className="w-9 h-9 text-blue-600" style={{ color: '#2563eb' }} />
        <h1 className="text-2xl font-black text-gray-950 tracking-tighter" style={{ margin: 0, lineHeight: 1.2 }}>
          광주 <span className="text-gray-900 font-bold ml-1" style={{ color: '#111827' }}>PM 회수 관리</span>
        </h1>
      </div>

      {/* 2. 메인 애니메이션 구역 */}
      <div className="relative flex items-center justify-center w-52 h-52" style={{ position: 'relative', width: '208px', height: '208px' }}>
        {/* 배경 원 */}
        <div className="absolute inset-0 rounded-full border-[6px] border-gray-100" 
             style={{ position: 'absolute', inset: 0, borderRadius: '9999px', border: '6px solid #f3f4f6' }}></div>
        
        {/* 회전 스피너 (바깥쪽) */}
        <div className="absolute inset-0 rounded-full border-[6px] border-blue-600 border-t-transparent animate-spin" 
             style={{ position: 'absolute', inset: 0, borderRadius: '9999px', border: '6px solid #2563eb', borderTopColor: 'transparent' }}></div>
        
        {/* 회전 스피너 (안쪽 역방향) */}
        <div className="absolute inset-3 rounded-full border-[6px] border-emerald-500 border-b-transparent animate-spin" 
             style={{ position: 'absolute', inset: '12px', borderRadius: '9999px', border: '6px solid #10b981', borderBottomColor: 'transparent', animationDirection: 'reverse' }}></div>
        
        {/* 중앙 메시지/아이콘 */}
        <div className="flex flex-col items-center text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CheckCircle2 className="w-16 h-16 text-blue-700 opacity-90 mb-1" style={{ color: '#1d4ed8' }} />
          <p className="text-sm font-bold text-gray-500" style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>인증 확인 중</p>
        </div>
      </div>

      {/* 3. 하단 상태 메시지 */}
      <div className="mt-16 text-center" style={{ marginTop: '64px', textAlign: 'center' }}>
        <p className="text-xl font-extrabold text-gray-900 animate-pulse" style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>
          로그인 정보를 처리하고 있습니다.
        </p>
        <p className="text-base text-gray-500 mt-2 font-medium" style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
          시스템 연결을 위해 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}