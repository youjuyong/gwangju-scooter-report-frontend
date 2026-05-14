"use client";

export default function AlarmPage(){

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>알림</h1>
                <button type="button" className="back" onClick={() => window.history.back()}>뒤로 가기</button>
                <button type="button" className="alarmok">모두 읽음 처리</button>
            </header>
            <main className="sub_article">
            <div className="alarmbox">
                    <ul>

                        <li>
                            <a href="result_detail.html">
                                <p className="noticeTitle">민원 처리 완료</p>
                                <p className="noticeDay">2026-01-05 11:30</p>
                            </a>
                        </li>

                        <li>
                            <a href="result_detail.html">
                                <p className="noticeTitle">민원 처리 완료</p>
                                <p className="noticeDay">2026-01-05 11:30</p>
                            </a>
                        </li>

                    </ul>
                </div>
            </main>
        </div>
    );
}