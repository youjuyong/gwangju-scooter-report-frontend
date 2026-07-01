import { create } from "zustand";
import { pmDcleReportRequestForm, pmDcleReportResponse } from "@/types/report";
import { getPmDclrListApi } from "@/services/report/reportApi";
import { getTowDclrListApi } from "@/services/report/reportApi_tow";

interface ReportState {
    reports: pmDcleReportResponse[];
    searchDate: string;
    statusFilter: string;
    workerFilter: string;
    loading: boolean;

    // 상태 변경 액션들
    setSearchDate: (date: string) => void;
    setStatusFilter: (status: string) => void;
    setWorkerFilter: (worker: string) => void;

    // true면 로딩 스피너 안 띄움
    fetchReports: (token: string | undefined, prefix: string, isSilent?: boolean) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
    reports: [],
    searchDate: "",
    statusFilter: "",
    workerFilter: "",
    loading: false,

    setSearchDate: (date) => set({ searchDate: date }),
    setStatusFilter: (status) => set({ statusFilter: status }),
    setWorkerFilter: (worker) => set({ workerFilter: worker }),

    fetchReports: async (token,prefix,isSilent = false) => {
        // get()을 통해 스토어 내부의 최신 필터 값들을 가져옵니다.
        const { searchDate, statusFilter, workerFilter } = get();

        if (!isSilent) {
            set({ loading: true });
        }

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

            let data;
            if (prefix === "/tow") {
                // 견인업체 계정일 때 호출할 API
                data = await getTowDclrListApi(requestParams, token);
            } else {
                // PM 계정(또는 기본값)일 때 호출할 API
                data = await getPmDclrListApi(requestParams, token);
            }

            set({ reports: data || [] });
        } catch (error) {
            console.error("Zustand에서 데이터 로드 실패:", error);
            throw error; // 컴포넌트단에서 toast 처리를 위해 에러를 던져줍니다.
        } finally {
            set({ loading: false });
        }
    }
}));