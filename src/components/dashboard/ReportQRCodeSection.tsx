"use client";

import { useState } from "react";
import { QrReader } from "react-qr-reader";
import { Camera, X, RefreshCw } from "lucide-react";

export default function ReportQRCodeSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [resultData, setResultData] = useState<string>("");

  // QR 코드 인식 성공 시 호출되는 핸들러
  const handleResult = (result: any, error: any) => {
    if (!!result) {
      const scannedText = result?.text;
      setResultData(scannedText);
      setIsScanning(false);
      
      // 실제 서비스 시 여기서 API 호출을 하거나 상세 페이지로 이동합니다.
      alert(`인식 성공: ${scannedText}\n기기 정보를 조회합니다.`);
    }

    if (!!error) {
      // 일반적인 스캔 과정의 에러는 무시하고, 권한 에러 등은 콘솔에 기록합니다.
      // console.log(error);
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-4 text-center min-h-[70vh]">
      {!isScanning ? (
        <section className="space-y-6 my-auto w-full max-w-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <Camera size={48} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">QR코드 신고</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              불법 주정차된 킥보드를 신고하기 위해<br />
              기기의 QR코드를 스캔해 주세요.
            </p>
          </div>
          <button 
            onClick={() => setIsScanning(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            스캔 시작하기
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
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* 스캐너 컨테이너 */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl aspect-[3/4] border-4 border-white ring-1 ring-gray-100">
            {/* 1. 실제 카메라 비디오 층 */}
            <QrReader
              onResult={handleResult}
              constraints={{ facingMode: "environment" }}
              containerStyle={{ width: "100%", height: "100%" }}
              videoStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* 2. 디자인 오버레이 층 (React Native 스타일 구현) */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {/* 상단 오버레이 */}
              <div className="flex-1 bg-black/40 flex items-center justify-center">
                <span className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase">
                  Align QR Code within frame
                </span>
              </div>

              {/* 중앙 인식 구역 가로 행 */}
              <div className="flex flex-row h-[260px]">
                <div className="flex-1 bg-black/40" /> {/* 좌측 오버레이 */}
                
                {/* 실제 인식 박스 가이드 */}
                <div className="w-[260px] relative border-2 border-red-500/50">
                  {/* 모서리 포인트 디자인 (선택사항) */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500" />
                  
                  {/* 초록색 스캔 애니메이션 바 */}
                  <div className="absolute w-[90%] h-[2px] bg-[#22ff00] left-[5%] shadow-[0_0_15px_#22ff00] animate-scan-move" />
                </div>

                <div className="flex-1 bg-black/40" /> {/* 우측 오버레이 */}
              </div>

              {/* 하단 오버레이 */}
              <div className="flex-1 bg-black/40" />
            </div>
          </div>
          
          <div className="bg-gray-50 py-3 px-4 rounded-2xl">
            <p className="text-[11px] text-gray-400 font-medium">
              인식이 잘 안 될 경우 기기와 20~30cm 거리를 유지해 주세요.
            </p>
          </div>
        </section>
      )}

      {/* 스캔 바 애니메이션 정의 */}
      <style jsx global>{`
        @keyframes scanLine {
          0% { top: 5%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        .animate-scan-move {
          animation: scanLine 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}