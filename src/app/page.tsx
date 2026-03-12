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
        
        <div className="pt-8">
          <Link 
            href="/login" 
            className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all"
          >
            시작하기 (로그인)
          </Link>
        </div>
      </div>
    </div>
  );
}