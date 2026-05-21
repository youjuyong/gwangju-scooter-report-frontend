"use client";

import React from "react";

interface PhotoRegistrationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onAlbumClick: () => void;
    onCameraClick: () => void;
}

export default function PhotoRegistrationPopup({
                                                   isOpen,
                                                   onClose,
                                                   onAlbumClick,
                                                   onCameraClick,
                                               }: PhotoRegistrationPopupProps) {
    if (!isOpen) return null;

    return (
        <div className="popupbox" style={{ display: "block" }}>
            <div className="popupconten camerapop">
                <p className="popuptxt">사진 등록</p>
                <div className="popupbtnset">
                    <button type="button" className="btnal" onClick={onAlbumClick}>
                        앨범
                    </button>
                    <button type="button" className="btnca" onClick={onCameraClick}>
                        촬영
                    </button>
                </div>
            </div>
            <div className="popbg" onClick={onClose}></div>
        </div>
    );
}