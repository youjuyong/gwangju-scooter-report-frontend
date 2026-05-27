import NoticeBoardDetail from "@/components/notice/NoticeBoardDetail";

interface Props {
    params: Promise<{ ntcId: string }>;
}

export default async function NoticeDetailPage({ params }: Props) {
    const { ntcId } = await params;

    return (
        <NoticeBoardDetail
            ntcId={ntcId}
            apiEndpoint="/api/ntc"
            backUrl="/tow/notice"
            title="PM 공지사항"
        />
    );
}