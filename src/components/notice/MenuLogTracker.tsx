"use client";

import { useEffect } from "react";
import { registerMenuLog } from "@/services/common/commonApi";
import { registerGuestMenuLog } from "@/services/common/commonApi";

export function MenuLogTracker({ menuId }: { menuId: string }) {
    useEffect(() => {
        registerMenuLog(menuId).catch((err) => 
            console.error("메뉴 이력 적재 실패:", err)
        );
    }, [menuId]);

    return null; 
}

export function MenuLogGuestTracker({ menuId }: { menuId: string }) {
    useEffect(() => {
        registerGuestMenuLog(menuId).catch((err) => 
            console.error("메뉴 이력 적재 실패:", err)
        );
    }, [menuId]);

    return null; 
}