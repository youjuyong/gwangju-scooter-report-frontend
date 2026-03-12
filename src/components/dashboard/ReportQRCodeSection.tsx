"use client";

import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, Upload, AlertCircle } from "lucide-react";

export default function HybridReportSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // 1. 실시간 스캐너 시작 로직
  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      qrScannerRef.current = html5QrCode;
      setIsScanning(true);

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      // 기기 목록 확인 없이 바로 environment(후면) 시도
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (text) => {
          alert(`QR 인식 성공: ${text}`);
          stopScanner();
        },
        () => {} // 스캔 실패는 무시
      );
    } catch (err) {
      console.error(err);
      setErrorCount(prev => prev + 1);
      setIsScanning(false);
      // 에러가 나면 스캐너 인스턴스 정리
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      await qrScannerRef.current.stop();
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 flex flex-col items-center min-h-[60vh]">
      {!isScanning ? (
        <div className="w-full space-y-6 flex flex-col items-center my-auto">
          <div className="bg-blue-50 p-6 rounded-[2.5rem] shadow-inner">
            <Camera size={64} className="text-blue-500" />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">QR코드 신고</h2>
            <p className="text-gray-400 text-sm mt-2">킥보드의 QR코드를 스캔하거나<br/>촬영하여 신고를 진행하세요.</p>
          </div>

          <div className="w-full space-y-3 pt-4">
            {/* 방법 1: 실시간 스캔 시도 */}
            <button 
              onClick={startScanner}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              <RefreshCw size={20} />
              실시간 스캔 시작
            </button>

            {/* 방법 2: 사진 직접 촬영 (우회로) */}
            <label className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer active:bg-gray-50 transition-all">
              <Upload size={20} />
              사진 직접 촬영/업로드
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={(e) => alert("사진 분석 로직으로 연결")} 
              />
            </label>
          </div>

          {errorCount > 0 && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">
              <AlertCircle size={14} />
              카메라 연결이 원활하지 않습니다. '사진 촬영'을 이용해 주세요.
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div id="reader" className="w-full aspect-square bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
             <div className="absolute inset-0 border-[2px] border-blue-500/30 animate-pulse"></div>
          </div>
          <button 
            onClick={stopScanner}
            className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold"
          >
            취소하기
          </button>
        </div>
      )}
    </div>
  );
}