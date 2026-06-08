import NoticeBoardList from "@/components/notice/NoticeBoardList";
import {MenuLogGuestTracker} from "@/components/notice/MenuLogTracker";

export default async function NoticeListPage() {
    return (
        <>
        <NoticeBoardList
            apiEndpoint="/api/ntc/citizen"
            linkPrefix="notice"
        />

        <MenuLogGuestTracker menuId="CIT4000" />
        </>
    );
}