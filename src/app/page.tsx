import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (accessToken) {
    redirect("/main");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-400">
      <div className="text-center space-y-6">
        <div className="text-6xl">🛴</div>
        <h1 className="text-4xl font-black text-black">PM 신고 시스템</h1>
        <p className="text-lg text-yellow-900">안전한 퍼스널 모빌리티 문화를 만듭니다.</p>
        
        <div className="pt-8 flex flex-col items-center gap-4"> 
          
          {/* 일반 시민 로그인 버튼 (보통 시민용을 더 강조하므로 위로 올리는 걸 추천해요!) */}
          <Link href="/citizen/login">
            <button className="w-64 p-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
              일반 시민 로그인
            </button>
          </Link>

          {/* 서비스 관리자 로그인 버튼 */}
          <Link href="/admin/login">
            <button className="w-64 p-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-700 active:scale-95 transition-all">
              서비스 관리자 로그인
            </button>
          </Link>

        </div>
      </div>
    </div>
  );
}