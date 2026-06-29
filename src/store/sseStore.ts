import {create} from 'zustand';
import {EventSourcePolyfill} from 'event-source-polyfill';
import {QueryClient} from "@tanstack/react-query";
import {useModeStore} from "@/store/dashboardStore";

interface SseState {
    alarmList: any[];
    markAsRead: (pushLogId: string) => void;
    markAllAsRead: () => void;
    sseInstance: EventSourcePolyfill | null;
    newReports: any[];
    isReportPopup: boolean;
    setIsReportPopup: (open: boolean) => void;
    removeNewReport: (dclrId: any) => void;
    checkExpiredReports: () => void;
    clearReports: () => void;
    setInitialList: (list: any[]) => void;
    connectSSE: (accessToken: string, queryClient?: QueryClient) => void;
    disconnectSSE: () => void;
}

const STATUS_SORT_ORDER: Record<string, number> = {
    "DEST01": 1,  // 미승인
    "DEST02": 2,  // 미배정
    "DEST03": 3,  // 처리중
    "DEST04": 4,  // 처리완료
    "DEST05": 5, // 반려(취소)
    "DEST06": 6,  // 견인미승인
    "DEST07": 7,  // 견인요청
    "DEST08": 8,  // 견인처리중
    "DEST09": 9,  // 견인완료
    "DEST10": 10,  // 자동취소
};

const sortDashboardList = (list: any[]) => {
    return [...list].sort((a, b) => {
        const scoreA = STATUS_SORT_ORDER[a.dclrStts?.cdId] || 99;
        const scoreB = STATUS_SORT_ORDER[b.dclrStts?.cdId] || 99;

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        return String(b.dclrId).localeCompare(String(a.dclrId));
    });
};

export const useSseStore = create<SseState>((set, get) => ({
    alarmList: [],
    sseInstance: null,

    newReports: [],
    isReportPopup: false,

    setIsReportPopup: (open) => set({isReportPopup: open}),

    removeNewReport: (dclrId) => {
        set((state) => {
            const filtered = state.newReports.filter((item) => String(item.dclrId) !== String(dclrId));
            return {
                newReports: filtered,
                isReportPopup: filtered.length > 0
            };
        });
    },

    checkExpiredReports: () => {
        const now = Date.now();
        const ONE_MINUTE = 60 * 1000;
        set((state) => {
            if (state.newReports.length === 0) return {};
            const filtered = state.newReports.filter((item) => now - item.timestamp < ONE_MINUTE);
            return {
                newReports: filtered,
                isReportPopup: filtered.length > 0
            };
        });
    },

    clearReports: () => set({
        newReports: [],
        isReportPopup: false
    }),

    setInitialList: (list) => set({alarmList: list}),

    // 단건 읽음 처리: 리스트에서 해당 알람의 readYn을 'Y'로 변경
    markAsRead: (pushLogId) => {
        set((state) => ({
            alarmList: state.alarmList.map((item) =>
                String(item.pushLogId) === String(pushLogId)
                    ? {...item, readYn: 'Y'}
                    : item
            ),
        }));
    },

    // 전체 읽음 처리: 모든 알람의 readYn을 'Y'로 변경
    markAllAsRead: () => {
        set((state) => ({
            alarmList: state.alarmList.map((item) => ({...item, readYn: 'Y'})),
        }));
    },

    connectSSE: (accessToken, queryClient) => {

        const currentSse = get().sseInstance;
        if (currentSse) {
            currentSse.close();
        }
        console.log("전역 [SSE] 연결 시도... ");
        const sse = new EventSourcePolyfill(`${process.env.NEXT_PUBLIC_API_URL}/sse/connect`, {
            headers: {Authorization: `Bearer ${accessToken}`},
            heartbeatTimeout: 60000
        });

        sse.onopen = () => {
            console.log("전역 [SSE] 연결 성공");
            console.log("@@@@@@@SSE");
        };


        sse.addEventListener("PING", () => {
            console.log("[SSE] PING 수신 - 연결 유지 중");
        });


        sse.addEventListener("ALARM", (e: any) => {
            try {
                const newAlarm = JSON.parse(e.data);
                set((state) => ({alarmList: [newAlarm, ...state.alarmList]}));
            } catch (err) {
                console.error("알림 데이터 파싱 에러:", err);
            }
        });

        //이벤트시 리스트 , 지도 리로드
        const handleSseReload = (e: any) => {
            const currentPath = window.location.pathname;
            // URL에 '/reportDetail'이 포함되어 있다면 새로고침을 건너뜁니다.
            if (currentPath.includes("/reportDetail")) {
                return;
            }
            window.location.reload(); // 그 외의 페이지에서만 즉시 새로고침
        };

        sse.addEventListener("DCLR_REGISTERED", handleSseReload);
        sse.addEventListener("TOW_ASSIGNED_TO_PM", handleSseReload);
        sse.addEventListener("TOW_ASSIGNED_TO_TOW", handleSseReload);
        sse.addEventListener("TOW_AUTO_CANCLE_TO_TOW", handleSseReload);
        sse.addEventListener("TOW_AUTO_CANCLE_TO_ADMIN", handleSseReload);

        // 자동이관 발생시 admin
        sse.addEventListener("TOW_ASSIGNED_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);

                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST07", "견인요청", targetData);
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error("TOW_ASSIGNED_TO_ADMIN 처리 중 에러:", err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // 자동취소 발생시
        sse.addEventListener("TOW_AUTO_CANCLE_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);

                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST10", "자동취소", targetData);
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error("TOW_AUTO_CANCLE_TO_ADMIN 처리 중 에러:", err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // 캐시 상태 변경
        const updateItemStatusInCache = (dclrId: string, nextStatusCcId: string, nextStatusNm: string, prcrHis?: any) => {
            queryClient?.setQueryData(["dashboardList", accessToken], (old: any) => {
                if (!old || !old.data) return old;

                const updatedList = old.data.map((item: any) =>
                    String(item.dclrId) === String(dclrId)
                        ? {
                            ...item,
                            dclrStts: {
                                ...item.dclrStts,
                                cdId: nextStatusCcId,
                                cdNm: nextStatusNm
                            },
                            ...(prcrHis && {
                                prcrHis: {
                                    ...item.prcrHis,
                                    ...prcrHis
                                }
                            })
                        }
                        : item
                );

                const sortedList = sortDashboardList(updatedList);
                return {...old, data: sortedList};
            });
        };

        //등록했을떄 이벤트 이름
        sse.addEventListener("DCLR_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);
                if (targetData && targetData.dclrId) {
                    queryClient?.setQueryData(["dashboardList", accessToken], (old: any) => {
                        if (!old || !old.data) return old;

                        const isExist = old.data.some((item: any) => String(item.dclrId) === String(targetData.dclrId));
                        if (isExist) return old;

                        const updatedList = [targetData, ...old.data];
                        const sortedList = sortDashboardList(updatedList);

                        return {...old, data: sortedList};
                    });
                    set((state) => ({
                        newReports: [{...targetData, timestamp: Date.now()}, ...state.newReports],
                        isReportPopup: true
                    }));
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error("DCLR_TO_ADMIN 처리 중 에러:", err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // PM사 회수 진행 시
        sse.addEventListener("PM_COLLECTION_IN_PROGRESS_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);
                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST03", "처리중");
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error("PM_COLLECTION_IN_PROGRESS_TO_ADMIN 에러:", err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // PM사 회수 완료 시
        sse.addEventListener("PM_COLLECTION_COMPLETED_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);

                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST04", "처리완료", targetData);
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error(`PM_COLLECTION_COMPLETED_TO_ADMIN 에러:`, err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // 견인업체 수거 진행 시
        sse.addEventListener("TOW_COLLECTION_IN_PROGRESS_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);

                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST08", "견인처리중", targetData);
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
                // updateItemStatusInCache(dclrId, "DEST08", "견인처리중", data.prcrHis);
            } catch (err) {
                console.error(`TOW_COLLECTION_IN_PROGRESS_TO_ADMIN 에러:`, err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });

        // 견인업체 수거 완료 시
        sse.addEventListener("TOW_COLLECTION_COMPLETED_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);

                if (targetData && targetData.dclrId) {
                    updateItemStatusInCache(targetData.dclrId, "DEST09", "견인완료", targetData.prcrHis);
                } else {
                    queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                }
            } catch (err) {
                console.error(`TOW_COLLECTION_COMPLETED_TO_ADMIN 에러:`, err);
                queryClient?.invalidateQueries({queryKey: ["dashboardList", accessToken]});
            }
        });
        // PARAM_TO_ADMIN 대시모드 모드변경
        sse.addEventListener("PARAM_TO_ADMIN", (e: any) => {
            try {
                const targetData = JSON.parse(e.data);
                console.log(targetData, 'data from param to dadmin');
                const isManual = targetData.paramVl === "N";

                useModeStore.getState().setMode(isManual ? 'MANUAL' : 'AUTO');
                if (queryClient) {
                    queryClient.invalidateQueries({queryKey: ["dashboardList", accessToken]});
                    queryClient.invalidateQueries({queryKey: ["status"]});
                }
            } catch (err) {
                console.error(`PARAM_TO_ADMIN 에러:`, err);
            }
        });
        sse.onerror = (err) => {
            console.error("[SSE] 연결 오류 발생:", err);
        };

        set({sseInstance: sse});
    },

    disconnectSSE: () => {
        const sse = get().sseInstance;
        if (sse) {
            sse.close();
            console.log("전역 [SSE] 연결 정상 종료");
            set({sseInstance: null, alarmList: [], newReports: [], isReportPopup: false});
        }
    }
}));