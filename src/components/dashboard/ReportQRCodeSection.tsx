"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "@/services/api";
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, Smartphone } from "lucide-react";

export default function ReactQrReportSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [kickboardInfo, setKickboardInfo] = useState({
    company: "",
    companyId: null as number | null,
    deviceId: "",
    deviceName: "",
  });

  // 스캔 성공 시 실행
  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedId = result[0].rawValue;
      setScannedData(scannedId);
      setIsScanning(false);

      try {
        // 1. API 호출 (scooterId를 경로에 넣어서 GET 요청)
        const response = await api.get(`/api/scooter/${scannedId}`);
        const resData = response.data;

        if (resData.success && resData.data) {
          const info = resData.data;

          // 2. 서버에서 받은 데이터를 kickboardInfo 상태에 저장
          setKickboardInfo({
            company: info.scooterCompanyResponse.scooterCompanyName || "정보 없음", // 화면 표시용 이름
            companyId: info.scooterCompanyResponse.scooterCompanyId, // (추가 상태 필요시)
            deviceId: info.scooterId, // 식별자 ID
            deviceName: info.scooterName, // 기기 이름
          });
        }
      } catch (error) {
        console.error("기기 정보 조회 실패:", error);
        setErrorMsg("등록되지 않은 기기이거나 정보를 불러올 수 없습니다.");
        
        setKickboardInfo({
          company: "직접 입력 필요",
          companyId: null,
          deviceId: scannedId,
          deviceName: "",
        });
      }
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scan Error:", error);
    if (error?.name === "NotAllowedError") {
      setErrorMsg("카메라 권한을 허용해주세요.");
    } else {
      setErrorMsg("카메라를 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  const handleReport = () => {
    if (!kickboardInfo.deviceId) {
      alert("킥보드 ID를 입력하거나 QR을 스캔해주세요.");
      return;
    }
    alert(`신고가 접수되었습니다: [${kickboardInfo.company}] ${kickboardInfo.deviceId}`);
    // 여기서 API 호출 로직을 구현하세요.
  };

  return (
    <div className="w-full flex flex-col items-center p-6 text-center min-h-[70vh] max-w-md mx-auto">
      {!isScanning ? (
        <section className="space-y-8 w-full py-4">
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
              {scannedData ? "기기 정보 확인" : "QR코드 스캔"}
            </h2>
            <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">
              {scannedData 
                ? "확인된 정보를 확인하고 신고를 완료하세요." 
                : "주정차 위반 킥보드를 촬영하여\n신고 대상 기기를 확인하세요."}
            </p>
          </div>

          {/* 정보 입력 및 확인 영역 */}
          <div className="w-full space-y-4 text-left">
            {/* 회사명 입력창 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <ShieldAlert size={12} /> 킥보드 회사
              </label>
              <input 
                type="text"
                placeholder="회사를 선택하거나 입력하세요"
                value={kickboardInfo.company}
                onChange={(e) => setKickboardInfo({...kickboardInfo, company: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* 기기 ID (식별자) 입력창 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <Smartphone size={12} /> 기기 식별자 (ID)
              </label>
              <input 
                type="text"
                readOnly // 식별자는 스캔된 고유값이므로 오타 방지를 위해 읽기전용 권장
                placeholder="QR 스캔시 자동 입력됩니다"
                value={kickboardInfo.deviceId}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none"
              />
            </div>

            {/* 기기 이름/번호 입력창 (선택사항) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <Smartphone size={12} /> 기기 명칭
              </label>
              <input 
                type="text"
                placeholder="기기 번호"
                value={kickboardInfo.deviceName}
                onChange={(e) => setKickboardInfo({...kickboardInfo, deviceName: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={() => {
                setIsScanning(true);
                setErrorMsg("");
              }}
              className="w-full bg-white text-blue-600 border-2 border-blue-600 py-4 rounded-2xl font-black active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              {scannedData ? "다시 스캔하기" : "QR 스캔 시작"}
            </button>

            <button 
              onClick={handleReport}
              className={`w-full py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all ${
                kickboardInfo.deviceId ? "bg-red-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              신고하기
            </button>
          </div>
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
          
          <div className="relative overflow-hidden rounded-[2.5rem] bg-black shadow-2xl border-4 border-white aspect-square group">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              allowMultiple={false}
              constraints={{ facingMode: "environment" }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { objectFit: "cover" }
              }}
              components={{ finder: false }}
            />
            
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-12 border-2 border-white/30 rounded-3xl"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-bounce"></div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 justify-center border border-red-100">
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