
interface Props {
    params: {
        ntcId: string;
    };
}

export default async function NoticeDetailPage({ params }: Props) {
    const { ntcId } = await params;
    let notice: any = null;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL ;

        const response = await fetch(`${baseUrl}/api/ntc/${ntcId}`, {
            method: 'GET',
            cache: 'no-store', // 서버에서 매번 새로 데이터를 가져오도록 설정 (백엔드의 실시간 데이터 반영)
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error("데이터 로드 실패");

        const result = await response.json();
        notice = result.data;

    } catch (error) {
        console.error("Notice Detail Fetch Error:", error);
    }

    if (!notice) {
        return <div className="p-10 text-center">공지사항을 찾을 수 없습니다.</div>;
    }

    return (
        // HTML의 wrap 클래스 그대로 유지
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>공지사항</h1>
                {/* 뒤로가기는 서버 컴포넌트에서 처리하기 어려우므로 간단한 링크나 Client 컴포넌트 사용 */}
                <a href="/notice" className="back" style={{ cursor: 'pointer' }}>뒤로 가기</a>
            </header>

            <main className="sub_article">
                <div className="allBox">
                    <table className="notiTable">
                        <caption>공지사항 상세</caption>
                        <colgroup>
                            <col style={{ width: "0%" }} />
                            <col style={{ width: "100%" }} />
                        </colgroup>

                        <tbody>
                        <tr>
                            <th scope="row">제목</th>
                            <td className="title">{notice.ttlNm}</td>
                        </tr>
                        <tr>
                            <th scope="row">작성일</th>
                            <td className="borderBottom">
                                <time dateTime={notice.regDt?.split(' ')[0]}>{notice.regDt}</time>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">내용</th>
                            {/* 줄바꿈 유지를 위해 style 추가 */}
                            <td className="content" style={{ whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>
                                {notice.cnData}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}