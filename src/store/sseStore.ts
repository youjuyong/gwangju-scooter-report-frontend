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

    const currentSse = get().sseInstance;
    if (currentSse) {
      return;
    }

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
    // 신고자가 신고를 했을 때 PM에게 보내는 이벤트 감지
    sse.addEventListener("DCLR_REGISTERED", (e: any) => {
      window.location.reload(); // 화면 즉시 새로고침
    });

    // 자동 이관 발생 시 pm에게 보내는 이벤트 감지
    sse.addEventListener("TOW_ASSIGNED_TO_PM", (e: any) => {
      window.location.reload(); // 화면 즉시 새로고침
    });
    //자동 이관시 tow에게 보내는 이벤트 감지
    sse.addEventListener("TOW_ASSIGNED_TO_TOW", (e: any) => {
      window.location.reload(); // 화면 즉시 새로고침
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