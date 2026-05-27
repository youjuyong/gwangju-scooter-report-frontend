import { create } from 'zustand';
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import {AlarmResponse} from "@/types/alarm";
import { persist } from 'zustand/middleware';

interface AlarmState {
    alarmList: AlarmResponse[];
    setInitialList: (list: AlarmResponse[]) => void;
    addLatestAlarm: (newAlarm: AlarmResponse) => void; // 추후 SSE용으로 남겨둠
    clearStore: () => void;
    markAsRead: (alarmId: string) => void; //단건 읽음 처리
    markAllAsRead: () => void; //전체 읽음 처리
}

export const useAlarmStore = create<AlarmState>()(
    persist(
        (set) => ({
            alarmList: [],
            // 로그인 성공 시점에 호출되어 스토어를 채울 함수
            setInitialList: (list) => set({ alarmList: list }),
            // 추후 SSE 구현되면 실시간으로 한 건씩 추가할 함수
            addLatestAlarm: (newAlarm) =>
                set((state) => ({ alarmList: [newAlarm, ...state.alarmList] })),
            clearStore: () => {
                localStorage.removeItem('alarm-storage');
                set({ alarmList: [] });
            },
            markAsRead: (alarmId:string) =>
                set((state) => ({
                    alarmList: state.alarmList.map((alarm) =>
                        alarm.pushLogId === alarmId ? { ...alarm, readYn: 'Y' } : alarm
                    ),
                })),
            markAllAsRead: () =>
                set((state) => ({
                    alarmList: state.alarmList.map((alarm) => ({
                        ...alarm,
                        readYn: 'Y',
                    })),
                })),
        }),
        {
            name: 'alarm-storage', // 로컬스토리지 키 이름
        }
    )
);