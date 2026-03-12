"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner"; // 새로운 라이브러리
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReactQrReportSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 스캔 성공 시 실행
  const handleScan = (result: any) => {
    if (result && result[0]?.rawValue) {
      const text = result[0].rawValue;
      setScannedData(text);
      setIsScanning(false);
      // 성공 알림 및 후속 로직 (예: 신고서 폼으로 이동)
      alert(`신고 기기 확인: ${text}`);
    }
  };

  // 에러 발생 시 실행 (권한 거부 등)
  const handleError = (error: any) => {
    console.error("QR Scan Error:", error);
    if (error?.name === "NotAllowedError") {
      setErrorMsg("카메라 권한을 허용해주세요.");
    } else {
      setErrorMsg("카메라를 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-6 text-center min-h-[70vh]">
      {!isScanning ? (
        <section className="space-y-6 my-auto w-full">
          {/* 상태 표시 아이콘 */}
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            {scannedData ? (
              <CheckCircle2 size={48} className="text-green-500" />
            ) : (
              <Camera size={48} className="text-blue-500" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {scannedData ? "기기 확인 완료" : "QR코드 스캔"}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {scannedData 
                ? `확인된 번호: ${scannedData}` 
                : "주정차 위반 킥보드를 촬영하여\n신고 대상 기기를 확인하세요."}
            </p>
          </div>
          
          <button 
            onClick={() => {
              setIsScanning(true);
              setErrorMsg("");
              setScannedData(null);
            }}
            className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
          >
            {scannedData ? "다시 스캔하기" : "스캔 시작하기"}
          </button>
        </section>
      ) : (
        <section className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-500" />
              QR 스캔 중...
            </h2>
            <button 
              onClick={() => setIsScanning(false)} 
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* QR 스캐너 영역 */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl border-4 border-white aspect-square group">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              allowMultiple={false}
              constraints={{
                facingMode: "environment", // 후면 카메라
              }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { objectFit: "cover" }
              }}
              // 라이브러리 자체 가이드라인을 사용하거나, 아래 커스텀 가이드라인 유지 가능
              components={{
                finder: false, // 기본 가이드라인 대신 커스텀 사용 시 false
              }}
            />
            
            {/* 커스텀 가이드 라인 디자인 */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* 모서리 강조 디자인 */}
                <div className="absolute inset-12 border-2 border-white/30 rounded-3xl"></div>
                {/* 스캔 라인 애니메이션 */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-bounce"></div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 justify-center border border-red-100 animate-shake">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
          
          <p className="text-xs text-gray-400 font-medium">
            킥보드 핸들 사이에 있는 QR코드를 비춰주세요.
          </p>
        </section>
      )}
    </div>
  );
}