"use client";

import {useEffect, useState} from "react";
import {getAlarmListApi, readAllNotifications, UpdateAlarmStatus} from "@/services/alarm/alarmApi";
import {AlarmResponse} from "@/types/alarm";
import {useRouter} from "next/navigation";
import {toast} from "react-hot-toast";

export default function AlarmList(){
    const [alarmList , setAlarmList] = useState<AlarmResponse[]>([]);
    const router = useRouter()

    const getDetail = (id: string) => {
        router.push(`/reportDetail/${id}`);
    };

    const alarmStatusUpdate = async (logId: string) =>{
       try{
           await UpdateAlarmStatus(logId);
           toast.error("처리 되었습니다.");
       } catch (error: any) {
           console.error("읽음 처리 실패:", error);
       }
    }

    const alarmStatusAllUpdate = async () =>{
        try{
            await readAllNotifications();
            window.location.reload();
        } catch (error: any) {
            console.error("읽음 처리 실패:", error);
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
            {alarmList && alarmList.length > 0 && alarmList.map((item) => (
                <li key={item.pushLogId} className={item.readYn === 'N' ? 'new' : ''}>
                    <a onClick={() => {
                        getDetail(item.dclrId)
                        alarmStatusUpdate(item.pushLogId)
                    }}>
                        <p className="noticeTitle">{item.pushCn}</p>
                        <p className="noticeDay">{item.sndngDt}</p>
                    </a>
                </li>
            ))
            }
                    </ul>
                </div>
            </main>
        </div>
    )
}