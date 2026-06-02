import NoticeBoardList from "@/components/notice/NoticeBoardList";

export default async function NoticeListPage() {
    return (
        <NoticeBoardList
            apiEndpoint="/api/ntc/citizen"
            linkPrefix="notice"
        />
    );
}