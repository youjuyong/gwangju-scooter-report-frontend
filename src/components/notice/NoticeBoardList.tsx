// src/components/NoticeBoardList.tsx
import Link from "next/link";
import { NoticeResponse } from "@/types/notice";

interface NoticeBoardListProps {
    apiEndpoint: string; // 각 분기별 백엔드 API 주소 (예: '/api/ntc', '/api/pm/ntc')
    linkPrefix: string;  // 이동할 상세 페이지의 URL 앞부분 (예: '/notice', '/pm/notice')
    title?: string;      // 게시판 제목 (기본값: 공지사항)
}

export default async function NoticeBoardList({
                                                  apiEndpoint,
                                                  linkPrefix,
                                                  title = "공지사항"
                                              }: NoticeBoardListProps) {
    let notices: NoticeResponse[] = [];

    try {
        const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL;
        // Props로 받은 apiEndpoint를 활용해 동적으로 데이터를 가져옵니다.
        const response = await fetch(`${baseUrl}${apiEndpoint}?page=0&size=999`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }
        const result = await response.json();
        notices = Array.isArray(result) ? result : (result.data?.content || []);

    } catch (error) {
        console.error(`${title} 서버 페칭 에러:`, error);
    }

    const totalCount = notices.length;

    return (
        <article className="subBoard">
            <h2>{title}</h2>
            <div className="noticount">
                총 <span>{totalCount}</span>건
            </div>

            <ul className="notilistBody">
                {notices.length > 0 ? (
                    notices.map((notice: any) => (
                        <li key={notice.ntcId}>
                            {/* Props로 받은 linkPrefix를 활용해 유연하게 주소를 생성합니다 */}
                            <Link href={`${linkPrefix}/${notice.ntcId}`} prefetch={false}>
                                <p className="noticeTitle">{notice.ttlNm}</p>
                                <p className="noticeDay">{notice.regDt}</p>
                            </Link>
                        </li>
                    ))
                ) : (
                    <li className="text-center py-10">등록된 공지사항이 없습니다.</li>
                )}
            </ul>
        </article>
    );
}