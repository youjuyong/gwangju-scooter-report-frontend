"use client";

import React from "react";

interface Message {
    msg : string;
    showPopup : boolean;
    onClose: () => void;
}
export default function CustomPopup({msg,showPopup,onClose}:Message){
    return (
        <div className="popupbox" style={{display: showPopup ? "block" : "none"}}>
            <div className="popupconten">
                <p className="popuptxt">{msg}</p>
                <div className="popupbtnset">
                    <button type="button" onClick={onClose}>확인</button>
                </div>
            </div>
            <div className="popbg"></div>
        </div>
    )
}