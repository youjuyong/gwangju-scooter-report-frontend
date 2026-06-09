import { create } from 'zustand';
import { EventSourcePolyfill } from 'event-source-polyfill';

interface SseState {
  alarmList: any[];
  sseInstance: EventSourcePolyfill | null;
  setInitialList: (list: any[]) => void;
  connectSSE: (accessToken: string) => void;
  disconnectSSE: () => void;
}

export const useSseStore = create<SseState>((set, get) => ({
  alarmList: [],
  sseInstance: null,
  
  setInitialList: (list) => set({ alarmList: list }),
  
  connectSSE: (accessToken) => {

    if (get().sseInstance) return;

    console.log("전역 [SSE] 연결 시도... ");
    
    const sse = new EventSourcePolyfill(`${process.env.NEXT_PUBLIC_API_URL}/sse/connect`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      heartbeatTimeout: 60000 
    });

    sse.onopen = () => {
      console.log("전역 [SSE] 연결 성공");
    };
    

    sse.addEventListener("PING", () => {
      console.log("[SSE] PING 수신 - 연결 유지 중");
    });
    

    sse.addEventListener("ALARM", (e: any) => {
      try {
        const newAlarm = JSON.parse(e.data);
        set((state) => ({ alarmList: [newAlarm, ...state.alarmList] }));
      } catch (err) {
        console.error("알림 데이터 파싱 에러:", err);
      }
    });

    sse.onerror = (err) => {
      console.error("[SSE] 연결 오류 발생:", err);
    };

    set({ sseInstance: sse });
  },

  disconnectSSE: () => {
    const sse = get().sseInstance;
    if (sse) {
      sse.close();
      console.log("전역 [SSE] 연결 정상 종료");
      set({ sseInstance: null, alarmList: [] }); 
    }
  }
}));