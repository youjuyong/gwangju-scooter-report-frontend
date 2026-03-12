"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

export default function ReportQRCodeSection() {
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // QR 성공
  const onScanSuccess = async (decodedText: string) => {
    alert(`QR 인식 성공: ${decodedText}`);
    await stopScanner();
  };

  // QR 실패 (무시)
  const onScanFailure = () => {};

  // 스캐너 시작
  const startScanner = async () => {
    try {
      // 기존 스캐너 완전 종료
      if (qrScannerRef.current) {
        try {
          if (qrScannerRef.current.isScanning) {
            await qrScannerRef.current.stop();
          }
          await qrScannerRef.current.clear();
        } catch {}
      }

      // 카메라 권한 요청 (깨우기)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      // 인스턴스 생성
      const html5QrCode = new Html5Qrcode("reader");
      qrScannerRef.current = html5QrCode;

      // 카메라 목록
      const devices = await Html5Qrcode.getCameras();

      if (!devices.length) {
        alert("사용 가능한 카메라가 없습니다.");
        return;
      }

      // 후면 카메라 찾기
      const backCamera = devices.find(device =>
        /back|rear|environment/i.test(device.label)
      );

      const cameraId = backCamera
        ? backCamera.id
        : devices[devices.length - 1].id;

      // 스캐너 시작
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        onScanSuccess,
        onScanFailure
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err: any) {
      console.error("Camera Start Error:", err);

      setHasPermission(false);

      if (err.name === "NotAllowedError") {
        alert("브라우저에서 카메라 권한을 허용해주세요.");
      } else if (err.name === "NotReadableError") {
        alert(
          "카메라가 이미 사용 중입니다. 카카오톡 / 카메라 앱 등을 종료해주세요."
        );
      } else {
        alert("카메라를 시작할 수 없습니다.");
      }
    }
  };

  // 스캐너 중지
  const stopScanner = async () => {
    if (!qrScannerRef.current) return;

    try {
      if (qrScannerRef.current.isScanning) {
        await qrScannerRef.current.stop();
      }

      await qrScannerRef.current.clear();
    } catch {}

    qrScannerRef.current = null;
    setIsScanning(false);
  };

  // 컴포넌트 종료 시 카메라 해제
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
            <h2 className="text-2xl font-black text-gray-900">
              QR코드 스캔
            </h2>

            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              서울시 공유 킥보드 신고를 위해
              <br />
              카메라 권한을 허용해주세요.
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
            <h2 className="font-bold text-gray-800">
              QR 스캔 중...
            </h2>

            <button
              onClick={stopScanner}
              className="p-2 bg-gray-100 rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          {/* 스캐너 영역 */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl aspect-square border-4 border-white">
            <div id="reader" className="w-full h-full"></div>

            {/* 스캔 라인 */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
          </div>

          <p className="text-xs text-gray-400">
            사각형 안에 QR코드를 맞춰주세요.
          </p>
        </section>
      )}

      {hasPermission === false && (
        <p className="mt-4 text-red-500 text-sm font-bold">
          카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.
        </p>
      )}
    </div>
  );
}