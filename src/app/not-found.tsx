"use client";

// import "../assets/style_admin/css/base_style.css"; // 경로에 맞춰 임포트
// import "../assets/style_admin/css/style.css";
// import "../assets/style_admin/css/m_style.css";
import CommonError from "@/components/CommonError";

export default function NotFound() {
    return (
        <CommonError
            title="요청하신 페이지를 찾을 수 없습니다."
            messageLine1="찾으시려는 페이지는 주소를 잘못 입력 하였거나"
            messageLine2="페이지 주소의 변경 또는 삭제 등의 이유로"
            messageLine3="찾을 수 없는 페이지 입니다."
            showReset={false}
        />
    );
}