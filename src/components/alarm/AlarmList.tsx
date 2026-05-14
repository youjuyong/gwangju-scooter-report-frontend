"use client";

import {useEffect, useState} from "react";
import {getAlarmListApi, UpdateAlarmStatus} from "@/services/alarm/alarmApi";
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
           const res = await UpdateAlarmStatus(logId);
            if (res.success) {
                //리스트 백그라운드 흰색으로 변경
           }
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
        <>
            {alarmList && alarmList.length > 0 && alarmList.map((item) => (
                <>
                <li>
                    <a href="#" onClick={() => {
                        getDetail(item.dclrId)
                        alarmStatusUpdate(item.pushLogId)
                    }}>
                        <p className="noticeTitle">{item.pushCn}</p>
                        <p className="noticeDay">{item.sndngDt}</p>
                    </a>
                </li>
                </>
                ))
            }
        </>
    )
}