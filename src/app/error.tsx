"use client";

// import "../assets/style_admin/css/base_style.css"; // 경로에 맞춰 임포트
// import "../assets/style_admin/css/style.css";
// import "../assets/style_admin/css/m_style.css";
import CommonError from "@/components/CommonError";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <CommonError
            title="일시적인 시스템 오류가 발생했습니다."
            messageLine1="데이터 처리 중 예기치 못한 에러가 발생했거나"
            messageLine2="통신망 상태가 불안정하여 연결이 끊어졌을 수 있습니다."
            messageLine3="문제가 지속되면 시스템 관리자에게 문의해 주세요."
            showReset={true}
            // onReset={reset} //500 에러일 때는 로그인 이동 대신 '다시 시도하기' 버튼으로 작동함
        />
    );
}