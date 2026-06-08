"use client";

import { useEffect } from "react";
import { registerMenuLog } from "@/services/common/commonApi";
import AlarmList from "@/components/alarm/AlarmList";

export default function AlarmPage(){

     useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("TOW4000"); 
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);
    
    return (
        <AlarmList/>
    );
}