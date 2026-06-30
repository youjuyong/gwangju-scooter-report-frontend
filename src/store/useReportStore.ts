import { create } from "zustand";
import { pmDcleReportRequestForm, pmDcleReportResponse } from "@/types/report";
import { getPmDclrListApi } from "@/services/report/reportApi";

interface ReportState {
    reports: pmDcleReportResponse[];
    searchDate: string;
    statusFilter: string;
    workerFilter: string;
 //   loading: boolean;

    // 상태 변경 액션들
    setSearchDate: (date: string) => void;
    setStatusFilter: (status: string) => void;
    setWorkerFilter: (worker: string) => void;

    // 🔥 파라미터를 내부에서 조립하여 페칭하는 핵심 액션
    fetchReports: (token: string | undefined) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
    reports: [],
    searchDate: "",
    statusFilter: "",
    workerFilter: "",
   // loading: false,

    setSearchDate: (date) => set({ searchDate: date }),
    setStatusFilter: (status) => set({ statusFilter: status }),
    setWorkerFilter: (worker) => set({ workerFilter: worker }),

    fetchReports: async (token) => {
        // get()을 통해 스토어 내부의 최신 필터 값들을 가져옵니다.
        const { searchDate, statusFilter, workerFilter } = get();

   ///     set({ loading: true });
        try {
            let extractedMonth = "";
            if (searchDate) {
                const dateParts = searchDate.split("-");
                extractedMonth = `${dateParts[0]}-${dateParts[1]}`;
            }

            // 스토어 내부 상태값들로 파라미터 조립
            const requestParams: pmDcleReportRequestForm = {
                searchMonth: extractedMonth,
                searchDate: searchDate,
                prcsUserId: workerFilter,
                dclrSttsCd: statusFilter
            };

            const data = await getPmDclrListApi(requestParams, token);
            set({ reports: data || [] });
        } catch (error) {
            console.error("Zustand에서 데이터 로드 실패:", error);
            throw error; // 컴포넌트단에서 toast 처리를 위해 에러를 던져줍니다.
        } finally {
        //    set({ loading: false });
        }
    }
}));