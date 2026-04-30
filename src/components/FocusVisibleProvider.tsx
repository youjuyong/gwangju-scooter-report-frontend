"use client";

import React, { useEffect, useState } from "react";

export default function FocusVisibleProvider({ children }: { children: React.ReactNode }) {
    const [isKeyboard, setIsKeyboard] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Tab") setIsKeyboard(true);
        };
        const handleMouseDown = () => setIsKeyboard(false);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousedown", handleMouseDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousedown", handleMouseDown);
        };
    }, []);

    return (
        <div className={isKeyboard ? "" : "hiddenFocus"}>
            {children}
        </div>
    );
}