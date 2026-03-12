"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, AlertTriangle, RefreshCw } from "lucide-react";

export default function ReportQRCodeSection() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null: 확인전, true: 허용, false: 거절

  useEffect(() => {
  if (hasPermission === true) {
    const scanner = new Html5QrcodeScanner(
      "reader",
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            // 여기 아래 설정을 추가해보세요!
            videoConstraints: {
            facingMode: "environment" // 후면 카메라 강제 사용
            }
        },
        false
        );

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
        scanner.clear().catch(err => console.error(err));
        };
    }
    }, [hasPermission]);

  // 스캔 성공 시
  const onScanSuccess = (decodedText: string) => {
    alert(`QR 코드 인식 성공: ${decodedText}`);
    // 여기서 다음 단계(신고 폼)로 이동하는 로직 추가
  };

  const onScanFailure = (error: any) => {
    // 스캔 중인 상태 (에러가 자주 발생하므로 보통 비워둠)
  };

  // 카메라 권한 요청 함수
  const requestCamera = async () => {
    try {
        // 후면 카메라 권한을 명시적으로 요청
        const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: { exact: "environment" } // 안되면 exact 제거하고 시도
        } 
        });
        
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
    } catch (err) {
        // 만약 'exact' 설정 때문에 에러가 난다면, 일반 후면 카메라로 재시도
        try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        fallbackStream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        } catch (fallbackErr) {
        console.error("카메라 에러:", fallbackErr);
        setHasPermission(false);
        }
    }
    };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      {hasPermission === null && (
        <section className="space-y-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Camera size={40} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">QR코드 스캔</h2>
            <p className="text-sm text-gray-500 mt-2">
              기기 식별을 위해 카메라 권한이 필요합니다.<br />
              아래 버튼을 눌러 카메라를 허용해주세요.
            </p>
          </div>
          <button 
            onClick={requestCamera}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            카메라 허용하기
          </button>
        </section>
      )}

      {hasPermission === false && (
        <section className="space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">카메라 권한 거절됨</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              QR 스캐너를 이용할 수 없습니다.<br />
              브라우저 설정에서 카메라 권한을 허용으로<br />
              변경한 뒤 다시 시도해주세요.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-blue-600 font-bold mx-auto"
          >
            <RefreshCw size={18} />
            <span>다시 시도</span>
          </button>
        </section>
      )}

      {hasPermission === true && (
        <section className="w-full max-w-sm mx-auto space-y-4">
          <h2 className="text-lg font-bold text-gray-900">기기의 QR코드를 찍어주세요</h2>
          {/* 스캐너가 렌더링될 영역 */}
          <div id="reader" className="overflow-hidden rounded-3xl border-0 shadow-2xl bg-black"></div>
          <p className="text-xs text-gray-400 mt-4">
            QR코드가 훼손되었다면 직접 번호를 입력할 수도 있습니다.
          </p>
        </section>
      )}
    </div>
  );
}