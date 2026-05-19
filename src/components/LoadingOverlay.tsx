"use client";

import React from "react";

interface LoadingOverlayProps {
    message?: string;
}

export default function LoadingOverlay({ message = "처리중입니다..." }: LoadingOverlayProps) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
        }}>
            {/* 빙글빙글 스피너 */}
            <div className="loading-spinner" />
            <p style={{ color: '#fff', marginTop: '15px', fontWeight: 'bold' }}>
                {message}
            </p>

            <style>{`
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255, 255, 255, 0.3);
                    border-top: 5px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}