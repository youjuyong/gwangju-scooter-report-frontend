"use client";

import {useAuthStore} from "@/store/authStore";
import {toast} from "react-hot-toast";
import {useFcmToken} from "@/hooks/useFcmToken";
import MainNotice from "@/components/notice/MainNotice";
import {useRouter} from "next/navigation";

export default function HomeContents() {
    const accessToken = useAuthStore((state) => state.reporter.accessToken);

    return (
        <HomeSection accessToken={accessToken}/>
    );
}

function HomeSection({accessToken}: { accessToken: string | null }) {
    const {getDeviceInfo} = useFcmToken();
    const router = useRouter();

    const oauthHandleLogin = async (provider: string) => {
        const currentOrigin = window.location.origin;
        const deviceType = getDeviceInfo();
        const loginUrl = `api-auth/oauth2/authorization/${provider}?redirect_uri=${currentOrigin}/api-auth/login/oauth2/code/${provider}`;

        if (deviceType === "iOS") {
            if ("Notification" in window && Notification.permission === "default") {
                try {
                    await Notification.requestPermission();
                } catch (error) {
                    console.error("iOS 알림 권한 요청 실패:", error);
                }
            }
        }

        toast.loading(`${provider === 'kakao' ? '카카오' : '네이버'}로 연결 중...`);
        window.location.href = loginUrl;
    };

    const handleReport = () => {
        router.push("/report");
    };

    return (
        <>
            <MainNotice/>

            <div className="mainImgBox">
                <div className="img">
                    <img src="/assets/style/images/main_all_img.png" alt="광주시 킥보드 주정차 위반신고" className="mainImg"/>
                </div>
            </div>

            <div className={`main_loginbtnBox ${accessToken ? "login_on" : ""}`}>
                <p className="guid">신고가능시간 <span>평일 07:00~17:00 (주말 및 공휴일 휴무)</span></p>

                {!accessToken ? (
                    <div className="main_loginset">
                        <button onClick={() => oauthHandleLogin('kakao')} className="login_cacao">
                            카카오톡으로 시작하기
                        </button>
                        <button onClick={() => oauthHandleLogin('naver')} className="login_naver">
                            네이버로 시작하기
                        </button>
                    </div>
                ) : (
                    /* 버튼 클릭 시 상태 변경이 아니라 실제 페이지로 이동합니다 */
                    <button
                        className="go_report"
                        onClick={handleReport}
                    >
                        신고하기
                    </button>
                )}
            </div>
        </>
    );
}