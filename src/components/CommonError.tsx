
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CommonErrorViewProps {
    title?: string;
    messageLine1?: string;
    messageLine2?: string;
    messageLine3?: string;
    showReset?: boolean;
    onReset?: () => void;
}

export default function CommonError({
                                        title = "요청하신 페이지를 찾을 수 없습니다.",
                                        messageLine1 = "찾으시려는 페이지는 주소를 잘못 입력 하였거나",
                                        messageLine2 = "페이지 주소의 변경 또는 삭제 등의 이유로",
                                        messageLine3 = "찾을 수 없는 페이지 입니다.",
                                        showReset = false,
                                        onReset
                                    }: CommonErrorViewProps) {

    const pathname = usePathname() || "";
    const segments = pathname.split('/');
    const firstSegment = segments[1]; // admin, pm, tow 중 하나

    // 1. 현재 경로 권한 판별 (수정하신 본문 반영: 기본값 '/')
    const currentRole = ['admin', 'pm', 'tow'].includes(firstSegment) ? firstSegment : '/';

    // 2. 권한별 자원 경로 설정 (일반 시민 '/' 일 경우 자산 폴더 매핑 예외 처리 보완)
    const assetPath = `/assets/style_admin/images`;

    // 3. 권한별 로그인 URL 및 버튼 텍스트 매칭 (수정하신 본문 반영)
    const loginUrl = ['admin', 'pm', 'tow'].includes(firstSegment) ? `/${firstSegment}/login` : "/";

    const getLoginButtonText = () => {
        if (currentRole === 'admin') return "방치킥보드관리 운영단말 로그인으로 이동";
        if (currentRole === 'pm') return "방치킥보드관리 [PM업체] 로그인으로 이동";
        if (currentRole === 'tow') return "방치킥보드관리 [견인업체] 로그인으로 이동";
        return "킥보드 주정차 신고 시스템 로그인으로 이동";
    };

    // 미디어 쿼리(max-width: 380px)를 실시간으로 감지하기 위한 리액트 훅 상태
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkWidth = () => setIsMobile(window.innerWidth <= 380);
        checkWidth(); // 초기 실행
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
    }, []);

    return (
        <div
            className="loginbody"
            style={{
                minHeight: "100vh",
                width: "100vw",
                position: "fixed",
                top: 0,
                left: 0,
                backgroundColor: "#1e1e24",
                overflow: "hidden",
                margin: 0,
                padding: 0
            }}
        >
            <div
                className="errBox"
                style={{
                    width: isMobile ? "90%" : "470px",
                    height: isMobile ? "420px" : "453px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 1)",
                    background: "#35363a",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center"
                }}
            >
                {/* 상단 에러 아이콘 및 배경 영역 */}
                <div
                    className="errtop"
                    style={{
                        width: "100%",
                        height: "120px",
                        background: `url(${assetPath}/err_bg.jpg) no-repeat`,
                        backgroundSize: "cover",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    <img src={`${assetPath}/err.png`} alt="에러 아이콘" />
                </div>

                {/* 중앙 에러 컨텐츠 영역 */}
                <div className="errcon" style={{ color: "#fff", padding: "40px 0", textAlign: "center" }}>
                    <p
                        className="big"
                        style={{
                            fontSize: isMobile ? "15px" : "17px",
                            textDecoration: "underline",
                            marginBottom: "26px"
                        }}
                    >
                        {title}
                    </p>
                    <div className="errtxt" style={{ fontSize: isMobile ? "12px" : "13px" }}>
                        <p style={{ lineHeight: "20px", margin: 0 }}>{messageLine1}</p>
                        <p style={{ lineHeight: "20px", margin: 0 }}>{messageLine2}</p>
                        <p style={{ lineHeight: "20px", margin: 0 }}>{messageLine3}</p>
                    </div>

                    {showReset && onReset ? (
                        <button
                            onClick={onReset}
                            className="gologin"
                            style={{
                                background: "#d22517",
                                display: "inline-block",
                                borderRadius: "5px",
                                color: "#fff",
                                fontSize: "12px",
                                height: "35px",
                                lineHeight: "35px",
                                padding: "0 15px",
                                marginTop: "25px",
                                boxShadow: "0 0 4px #00000080",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            다시 시도하기
                        </button>
                    ) : (
                        <Link prefetch={false} 
                            href={loginUrl}
                            className="gologin"
                            style={{
                                background: "#d22517",
                                display: "inline-block",
                                borderRadius: "5px",
                                color: "#fff",
                                fontSize: "12px",
                                height: "35px",
                                lineHeight: "35px",
                                padding: "0 15px",
                                marginTop: "25px",
                                boxShadow: "0 0 4px #00000080",
                                textDecoration: "none"
                            }}
                        >
                            {getLoginButtonText()}
                        </Link>
                    )}
                </div>

                {/* 하단 로고 영역 */}
                <div className="login_bottom_logo" style={{ position: "absolute", bottom: "20px", width: "100%", textAlign: "center" }}>
                    <img src={`${assetPath}/logo2.png`} alt="시스템 로고" />
                </div>
            </div>
        </div>
    );
}