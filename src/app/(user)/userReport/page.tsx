"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuthStore} from "@/store/authStore";

import Header from "@/components/Header";
import ReportQRCodeSection from "@/components/dashboard/ReportQRCodeSection";
import ReportListSection from "@/components/dashboard/ReportListSection";
import {toast} from "react-hot-toast";
import {useFcmToken} from "@/hooks/useFcmToken";
import MainNotice from "@/components/notice/MainNotice";


export default function SeoulFullWidthDashboard() {
    const [activeTab, setActiveTab] = useState("홈");
    const {getDeviceInfo} = useFcmToken();
    const deviceType = getDeviceInfo();
    const router = useRouter();

    // 탭에 따라 메인 기사 내용 변경
    const renderContent = () => {
        switch (activeTab) {
            case "홈":
                return <HomeSection setActiveTab={setActiveTab} accessToken={accessToken}/>;
            case "신고확인":
                return <ReportListSection/>;
            case "공지사항":
                return <div className="p-10 text-center font-bold">공지사항 리스트 영역</div>;
            default:
                return <HomeSection setActiveTab={setActiveTab} accessToken={accessToken}/>;
        }
    };
    const accessToken = useAuthStore((state) => state.accessToken);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);

    useEffect(() => {
        if (activeTab === "신고하기") {
            router.push("/citizen/report");
            setActiveTab("홈");
        }
    }, [activeTab, router]);

    return (
        // wrap 클래스: 홈일 때와 아닐 때를 구분하여 클래스 부여 가능
        <div className={`wrap ${activeTab === "홈" ? "main-wrap" : "sub-wrap"}`}>

            <Header activeTab={activeTab} setActiveTab={setActiveTab}/>

            <main className="main_article">
                {renderContent()}
            </main>
        </div>
    );
}

// 퍼블리싱된 홈 화면 구조
function HomeSection({setActiveTab, accessToken}: any) {
    const {handleAllowNotification, getDeviceInfo} = useFcmToken();

    const oauthHandleLogin = async (provider:string) => {
        const currentOrigin = window.location.origin;
        const deviceType = getDeviceInfo();
        const loginUrl = `api-auth/oauth2/authorization/${provider}?redirect_uri=${currentOrigin}/api-auth/login/oauth2/code/${provider}`;

        // 1. iOS인 경우에만 알림 권한 체크 및 요청
        if (deviceType === "iOS") {
            if ("Notification" in window && Notification.permission === "default") {
                try {
                    await Notification.requestPermission();
                } catch (error) {
                    console.error("iOS 알림 권한 요청 실패:", error);
                }
            }
        }

        // 2. 공통 로그인 처리 (권한 허용/거부와 상관없이 진행)
        toast.loading(`${provider === 'kakao' ? '카카오' : '네이버'}로 연결 중...`);
        window.location.href = loginUrl;
    };
    return (
        <>
            {/*<article className="mainBoard">*/}
            {/*    <h2>공지사항</h2>*/}
            {/*    <div className="title">*/}
            {/*        <a href="#">공지사항 제목이 나옵니다. 최근 3개까지 롤링</a>*/}
            {/*    </div>*/}
            {/*    <div className="main_bord_arrow">*/}
            {/*        <button type="button" className="btnleft" aria-label="이전 공지 보기">이전공지보기</button>*/}
            {/*        <button type="button" className="btnright" aria-label="다음 공지 보기">다음공지보기</button>*/}
            {/*    </div>*/}
            {/*</article>*/}
            <MainNotice></MainNotice>

            <div className="mainImgBox">
                <div className="img">
                    <img src="/images/main_all_img.png" alt="광주시 킥보드 주정차 위반신고" className="mainImg" />
                </div>
            </div>

            {/* 로그인 여부에 따라 클래스 login_on 추가/제거 */}
            <div className={`main_loginbtnBox ${accessToken ? "login_on" : ""}`}>
                <p className="guid">신고가능시간 <span>평일 07:00~17:00 (주말 및 공휴일 휴무)</span></p>

                {/* 조건부 렌더링: 로그인 여부에 따라 태그 자체가 교체됨 */}
                {!accessToken ? (
                    <div className="main_loginset">
                        <button
                            onClick={() => oauthHandleLogin('kakao')}
                            className="login_cacao"
                        >
                            카카오톡으로 시작하기
                        </button>
                        <button
                            onClick={() => oauthHandleLogin('naver')}
                            className="login_naver"
                        >
                            네이버로 시작하기
                        </button>
                    </div>
                ) : (
                    <button className="go_report" onClick={() => setActiveTab("신고하기")}>
                        신고하기
                    </button>
                )}
            </div>
        </>
    );
}