import NoticeBoardList from "@/components/notice/NoticeBoardList";

export default async function NoticeListPage() {
    return (
        <NoticeBoardList
            apiEndpoint="/api/ntc" // 만약 백엔드 API 주소도 pm용이 따로 있다면 바꿀 수 있습니다.
            linkPrefix="/pm/notice"
            title="공지사항" // 제목을 다르게 주고 싶다면 커스텀 가능
        />
    );
}