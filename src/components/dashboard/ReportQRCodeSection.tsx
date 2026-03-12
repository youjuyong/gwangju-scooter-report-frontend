"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, AlertTriangle, RefreshCw, X } from "lucide-react";

export default function ReportQRCodeSection() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // 1. 카메라 권한 요청 및 시작
  // ReportQRCodeSection.tsx 내 startScanner 함수 수정
    const startScanner = async () => {
    try {
        // 1. 모든 비디오 트랙 중지 (기존에 꼬여있을 수 있는 카메라 해제)
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        // 2. 후면 카메라를 찾되, 못 찾으면 첫 번째 카메라 사용
        const backCamera = devices.find(device => 
            device.label.toLowerCase().includes("back") || 
            device.label.toLowerCase().includes("후면")
        );
        
        const cameraId = backCamera ? backCamera.id : devices[0].id;

        await html5QrCode.start(
            cameraId, // facingMode 대신 직접 cameraId 사용
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
        );
        setIsScanning(true);
        }
    } catch (err) {
        console.error("카메라 시작 에러:", err);
        alert("카메라를 시작할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해 주세요.");
    }
    };

  const onScanSuccess = (decodedText: string) => {
    alert(`인식 성공: ${decodedText}`);
    stopScanner();
  };

  const onScanFailure = (error: any) => {
    // 스캔 시도 중 (콘솔 출력 생략)
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      await qrScannerRef.current.stop();
      qrScannerRef.current.clear();
      setIsScanning(false);
    }
  };

  // 컴포넌트 언마운트 시 중지
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center p-6 text-center min-h-[70vh]">
      {!isScanning ? (
        <section className="space-y-6 my-auto">
          <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Camera size={48} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">QR코드 스캔</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              서울시 공유 킥보드 신고를 위해<br />
              카메라 권한을 허용해 주세요.
            </p>
          </div>
          <button 
            onClick={startScanner}
            className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
          >
            스캐너 시작하기
          </button>
        </section>
      ) : (
        <section className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-bold text-gray-800">QR 스캔 중...</h2>
            <button onClick={stopScanner} className="p-2 bg-gray-100 rounded-full">
              <X size={18} />
            </button>
          </div>
          
          {/* 스캐너 영역: 디자인 최적화 */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl aspect-square border-4 border-white">
            <div id="reader" className="w-full h-full"></div>
            {/* 스캔 라인 애니메이션 (선택사항) */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
          </div>
          
          <p className="text-xs text-gray-400">
            사각형 안에 QR코드가 꽉 차게 맞춰주세요.
          </p>
        </section>
      )}

      {hasPermission === false && (
        <p className="mt-4 text-red-500 text-sm font-bold">
          카메라 권한이 거부되었습니다. 설정에서 허용해 주세요.
        </p>
      )}
    </div>
  );
}