// src/components/NoticeBoardDetail.tsx
import { NoticeResponse } from "@/types/notice";

interface NoticeBoardDetailProps {
    ntcId: string;       // URL params에서 받아온 공지사항 ID
    apiEndpoint: string; // 백엔드 상세 API 주소의 앞부분 (예: '/api/ntc')
    backUrl: string;     // [뒤로 가기] 버튼을 눌렀을 때 이동할 목록 페이지 주소 (예: '/pm/notice')
    title?: string;      // 헤더 제목 (기본값: 공지사항)
}

export default async function NoticeBoardDetail({
                                                    ntcId,
                                                    apiEndpoint,
                                                    backUrl,
                                                    title = "공지사항"
                                                }: NoticeBoardDetailProps) {
    let notice: any = null;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL;

        // Props로 받은 apiEndpoint와 ntcId를 조합하여 호출합니다.
        const response = await fetch(`${baseUrl}${apiEndpoint}/${ntcId}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error("데이터 로드 실패");

        const result = await response.json();
        notice = result.data;

    } catch (error) {
        console.error(`${title} 상세 서버 페칭 에러:`, error);
    }

    if (!notice) {
        return <div className="p-10 text-center">{title}을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>{title}</h1>
                {/* Props로 받은 backUrl을 바인딩하여 동적으로 목록으로 돌아갑니다 */}
                <a href={backUrl} className="back" style={{ cursor: 'pointer' }}>뒤로 가기</a>
            </header>

            <main className="sub_article">
                <div className="allBox">
                    <table className="notiTable">
                        <caption>{title} 상세</caption>
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
                            <th scope="row">첨부파일</th>
                            <td className="borderBottom"><a href="" download aria-label="파일이름이 나옵니다">파일이름이
                                나옵니다.</a></td>
                        </tr>
                        <tr>
                            <th scope="row">내용</th>
                            <td className="content" style={{whiteSpace: 'pre-wrap', verticalAlign: 'top'}}>
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