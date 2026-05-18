import Link from "next/link";
import {NoticeResponse} from "@/types/notice";

export default async function NoticeListPage() {
    let notices: NoticeResponse[] = [];

    try {
        const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL;

        const response = await fetch(`${baseUrl}/api/ntc?page=0&size=999`, {
            method: 'GET',
            cache: 'no-store', // 서버에서 매번 새로 데이터를 가져오도록 설정 (백엔드의 실시간 데이터 반영)
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }
        const result = await response.json();

        notices = Array.isArray(result) ? result : (result.data.content || []);

    } catch (error) {
        console.error("공지사항 서버 페칭 에러:", error);
    }

    const totalCount = notices.length;

    return (
        <article className="subBoard">
            <h2>공지사항</h2>
            <div className="noticount">
                총 <span>{totalCount}</span>건
            </div>

            <ul className="notilistBody">
                {notices.length > 0 ? (
                    notices.map((notice: any) => (
                        <li key={notice.ntcId}>
                            <Link href={`/pm/notice/${notice.ntcId}`} prefetch={false}>
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