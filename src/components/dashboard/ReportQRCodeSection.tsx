"use client";

import { useState } from "react";
import { QrReader } from "react-qr-reader"; // 최신 버전은 이렇게 가져옵니다
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";

export default function ReactQrReportSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [data, setData] = useState("아직 인식된 결과가 없습니다.");
  const [errorMsg, setErrorMsg] = useState("");

  const handleResult = (result: any, error: any) => {
    if (result) {
      setData(result?.text);
      setIsScanning(false);
      alert(`신고 기기 확인: ${result?.text}`);
      // 여기서 다음 단계(신고서 작성)로 넘어가면 됩니다.
    }

    if (error) {
      // 카메라 권한 거부나 장치 충돌 시 에러 발생
      if (error?.name === "NotAllowedError") {
        setErrorMsg("카메라 권한을 허용해주세요.");
      }
      // 일반적인 스캔 실패 에러는 무시 (콘솔이 너무 지저분해지므로)
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-6 text-center min-h-[70vh]">
      {!isScanning ? (
        <section className="space-y-6 my-auto w-full">
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <Camera size={48} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">QR코드 스캔 (React)</h2>
            <p className="text-sm text-gray-400 mt-2">
              주정차 위반 킥보드를 촬영하여<br />
              신고 대상 기기를 확인하세요.
            </p>
          </div>
          
          <button 
            onClick={() => {
              setIsScanning(true);
              setErrorMsg("");
            }}
            className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
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
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* QR 스캐너 영역 */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl border-4 border-white aspect-square">
           <QrReader
                onResult={handleResult}
                constraints={{ 
                    facingMode: "environment",
                    // 해상도를 명시적으로 낮추거나 높여서 대역폭 문제 해결 시도
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }}
                containerStyle={{ width: "100%", backgroundColor: "black" }}
                videoStyle={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    // 아래 속성들이 모바일 검은 화면 해결의 핵심입니다
                    display: "block",
                }}
                // video 태그에 직접 속성 주입 (일부 버전에서 지원)
                videoContainerStyle={{
                    paddingTop: '100%', // 1:1 비율 강제
                }}
                />
            {/* 가이드 라인 디자인 */}
            <div className="absolute inset-0 border-[2px] border-blue-500/30 pointer-events-none">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2 justify-center">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
          
          <p className="text-xs text-gray-400 font-medium">
            기기의 QR코드를 사각형 안에 비춰주세요.
          </p>
        </section>
      )}
    </div>
  );
}