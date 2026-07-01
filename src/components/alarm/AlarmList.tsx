"use client";

import {useEffect, useState} from "react";
import {getAlarmListApi, readAllNotifications, UpdateAlarmStatus} from "@/services/alarm/alarmApi";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "react-hot-toast";
import { useSseStore } from '@/store/sseStore';

export default function AlarmList(){
    //알림 상태 구독
    const alarmList = useSseStore((state) => state.alarmList);
    const setInitialList = useSseStore((state) => state.setInitialList);
    const markAsRead = useSseStore((state) => state.markAsRead);
    const markAllAsRead = useSseStore((state) => state.markAllAsRead);

    const router = useRouter();
    const pathname = usePathname();
    const prefix = pathname.startsWith("/pm") ? "/pm" : pathname.startsWith("/tow") ? "/tow" : "";

    const getDetail = (id: string) => {
       router.push(`${prefix}/reportDetail/${id}`);
    };

    // 알람 하나 클릭 시 읽음 처리
    const alarmStatusUpdate = async (logId: string) => {
        try {
            await UpdateAlarmStatus(logId);
            markAsRead(logId); // 전역 스토어 상태 업데이트 (화면 즉시 반영)
        } catch (error: any) {
            console.error("리스트 업데이트 실패:", error);
        }
    };
    // 모두 읽음 처리
    const alarmStatusAllUpdate = async () => {
        try {
            const res = await readAllNotifications();
            if (res.success) {
                markAllAsRead(); // 전역 스토어 상태 업데이트 (화면 즉시 반영)
            }
        } catch (error: any) {
            console.error("리스트 업데이트 실패:", error);
        }
    };

    useEffect(()=>{
        const fetchAlarmList = async ()=>{
            try{
                const result = await getAlarmListApi();
                setInitialList(result);

            }catch (error){
                console.error("알람 리스트 로딩 실패: ", error);
            }
        };
        fetchAlarmList();
    },[setInitialList]);

    return(
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>알림</h1>
                <button type="button" className="back" onClick={() => window.history.back()}>뒤로 가기</button>
                <button type="button" className="alarmok" onClick={()=>alarmStatusAllUpdate()}>모두 읽음 처리</button>
            </header>
            <main className="sub_article">
                <div className="alarmbox">
                    <ul>
                        {alarmList && alarmList.length > 0 ? (
                            alarmList.map((item) => (
                                <li key={item.pushLogId} className={item.readYn === 'N' ? 'new' : ''}>
                                    <a onClick={() => {
                                        getDetail(item.dclrId);
                                        alarmStatusUpdate(item.pushLogId);
                                    }}>
                                        <p className="noticeTitle">{item.pushCn}</p>
                                        <p className="noticeDay">{item.sndngDt}</p>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <p className="none alnone">소식이 없습니다.</p>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    )
}