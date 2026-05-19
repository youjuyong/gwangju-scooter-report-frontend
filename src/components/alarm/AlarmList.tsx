"use client";

import {useEffect, useState} from "react";
import {getAlarmListApi, readAllNotifications, UpdateAlarmStatus} from "@/services/alarm/alarmApi";
import {AlarmResponse} from "@/types/alarm";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "react-hot-toast";

export default function AlarmList(){
    const [alarmList , setAlarmList] = useState<AlarmResponse[]>([]);
    const router = useRouter();
    const pathname = usePathname();
    const prefix = pathname.startsWith("/pm") ? "/pm" : pathname.startsWith("/tow") ? "/tow" : "";

    const getDetail = (id: string) => {
       router.push(`${prefix}/reportDetail/${id}`);
    };

    const alarmStatusUpdate = async (logId: string) =>{
       try{
           await UpdateAlarmStatus(logId);
       } catch (error: any) {
           console.error("리스트 업데이트 실패:", error);
       }
    }

    const alarmStatusAllUpdate = async () =>{
        try{
            const res = await readAllNotifications();
            if(res.success){
                toast.success("처리 되었습니다.");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error: any) {
            console.error("리스트 업데이트 실패:", error);
        }
    }

    useEffect(()=>{
        const fetchAlarmList = async ()=>{
            try{
                const result = await getAlarmListApi();
                setAlarmList(result);

            }catch (error){
                console.error("알람 리스트 로딩 실패: ", error);
            }
        };
        fetchAlarmList();
    },[]);

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