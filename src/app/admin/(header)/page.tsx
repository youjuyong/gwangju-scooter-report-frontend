import {dehydrate, HydrationBoundary, QueryClient} from "@tanstack/react-query";
import {getDashboardList, getOutlineType} from "@/services/common/commonApi";
import DashboardContainer from "@/components/dashboard/DashBoardContainer";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const queryClient = new QueryClient();
    const cookieStore = await cookies();
    const token = cookieStore.get("adminAccessToken")?.value;
    try {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ["outlineType"],
                queryFn: getOutlineType,
            }),
            queryClient.prefetchQuery({
                queryKey: ["dashboardList", token], 
                queryFn: () => getDashboardList(token),
            }),
        ]);
    } catch (error) {
        console.error("Dashboard 서버사이드 프리페칭 실패:", error);
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <DashboardContainer/>
        </HydrationBoundary>
    );
}