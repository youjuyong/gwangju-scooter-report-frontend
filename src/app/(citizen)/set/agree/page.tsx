import { cookies } from "next/headers";

export default async function TermsPage() {
    let termsContent = "내용을 불러오는 중입니다...";

    try {
        const baseUrl = process.env.INTERNAL_API_URL ;


        const response = await fetch(`${baseUrl}/api/ntc/type?ntcTypeCd=NTCT02`, {
            method: 'GET',
            cache: 'no-store', // 서버에서 매번 새로 데이터를 가져오도록 설정 (백엔드의 실시간 데이터 반영)
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const result = await response.json();
            // 백엔드 응답 구조가 { success: true, data: { cnData: '...' } } 인 경우
            console.log(result);
            termsContent = result.data?.cnData || "등록된 내용이 없습니다.";
        }

    } catch (error) {
        console.error("약관 페칭 에러:", error);
        termsContent = "데이터를 불러오는 데 실패했습니다.";
    }

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>개인정보처리방침</h1>
                {/* 클라이언트 컴포넌트 없이 뒤로가기를 구현하려면 a태그나 별도 버튼 컴포넌트 사용 */}
                <a href="/set" className="back" style={{ cursor: 'pointer' }}>뒤로 가기</a>
            </header>

            <main className="sub_article">
                <div className="allBox">
                    {/* 공지사항과 마찬가지로 줄바꿈 유지를 위해 white-space 적용 */}
                    <div className="agreecon" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {termsContent}
                    </div>
                </div>
            </main>
        </div>
    );
}