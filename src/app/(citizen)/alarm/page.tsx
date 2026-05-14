"use client";

import AlarmList from "@/components/alarm/AlarmList";

export default function AlarmPage(){

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>알림</h1>
                <button type="button" className="back" onClick={() => window.history.back()}>뒤로 가기</button>
            </header>
            <main className="sub_article">
                <div className="alarmbox">
                    <ul>
                    <AlarmList/>
                    </ul>
                </div>
            </main>
        </div>
    );
}