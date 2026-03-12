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
        // 1. 기존 스캐너가 돌고 있다면 확실히 중지
        if (qrScannerRef.current) {
        await qrScannerRef.current.stop().catch(() => {});
        }

        // 2. 브라우저에 카메라 권한을 명시적으로 다시 요청 (스트림 생성으로 잠 깨우기)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // 권한만 확인하고 즉시 해제

        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        // 3. 기기의 모든 카메라 목록 가져오기
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
        // 4. 후면(Back/Rear) 카메라 찾기
        const backCamera = devices.find(device => 
            /back|rear|environment/i.test(device.label)
        );
        
        // 후면 카메라가 있으면 그것을, 없으면 마지막 카메라(보통 후면) 사용
        const cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;

        await html5QrCode.start(
        cameraId,
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            // 'as any'를 추가하여 타입 체크를 건너뜁니다.
            videoConstraints: {
            facingMode: "environment",
            focusMode: "continuous",
            } as any 
        },
        onScanSuccess,
        onScanFailure
        );
        setIsScanning(true);
        setHasPermission(true);
        } else {
        alert("사용 가능한 카메라 장치를 찾을 수 없습니다.");
        }
    } catch (err: any) {
        console.error("Camera Start Error:", err);
        setHasPermission(false);
        
        // 에러 메시지에 따라 대응 가이드 출력
        if (err.name === "NotAllowedError") {
        alert("브라우저 설정에서 카메라 권한을 '허용'으로 변경해주세요.");
        } else {
        alert("카메라를 시작할 수 없습니다. 다른 앱(카톡, 기본카메라 등)을 완전히 종료하고 다시 시도해주세요.");
        }
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