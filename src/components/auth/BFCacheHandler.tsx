"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export default function BFCacheHandler() {
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            // 1. 뒤로가기로 돌아왔을 때 남아있는 토스트 모두 제거
            toast.dismiss();

            // 2. 만약 브라우저 캐시(BFCache)로부터 복원된 상태라면 강제 새로고침
            if (event.persisted) {
                window.location.reload();
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    return null; // 화면에 아무것도 그리지 않음
}