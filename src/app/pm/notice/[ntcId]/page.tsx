import NoticeBoardDetail from "@/components/notice/NoticeBoardDetail";
import NoticeViewCounter from "@/components/notice/NoticeViewCounter";

interface Props {
    params: Promise<{ ntcId: string }>;
}

export default async function NoticeDetailPage({ params }: Props) {
    const { ntcId } = await params;

    return (
        <>
        <NoticeBoardDetail
            ntcId={ntcId}
            apiEndpoint="/api/ntc"
            backUrl="/pm/notice"
            title="PM 공지사항"
        />

        <NoticeViewCounter ntcId={ntcId} />
        </>
    );
}