"use client";

import { useState } from "react";
import axios from "axios";
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
    deviceId: "", // 이제 직접 입력 가능한 기기 식별자
    deviceName: "", // 읽기 전용으로 바뀔 기기 명칭
  });

  // 공통 정보 조회 함수 (스캔 시 또는 직접 입력 후 필요 시 호출 가능)
  const fetchScooterInfo = async (id: string) => {
    try {
      const response = await api.get(`/scooter/${id}`);
      const resData = response.data;

      if (resData.success && resData.data) {
        const info = resData.data;
        setKickboardInfo({
          company: info.scooterCompanyResponse.scooterCompanyName || "정보 없음",
          companyId: info.scooterCompanyResponse.scooterCompanyId,
          deviceId: info.scooterId,
          deviceName: info.scooterName,
        });
        setErrorMsg("");
      }
    } catch (error) {
      console.error("기기 정보 조회 실패:", error);
      setErrorMsg("등록되지 않은 기기입니다. 식별자를 직접 확인해주세요.");
      setKickboardInfo((prev) => ({
        ...prev,
        company: "직접 입력 필요",
        deviceName: "알 수 없는 기기",
      }));
    }
  };

  // 스캔 성공 시 실행
  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue) {
      alert("result : "+ result[0]);
      const scannedId = result[0].rawValue;
      setScannedData(scannedId);
      setIsScanning(false);
      setKickboardInfo((prev) => ({ ...prev, deviceId: scannedId }));
      alert(scannedId);
      //await fetchScooterInfo(scannedId);
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scan Error:", error);
    if (error?.name === "NotAllowedError") {
      setErrorMsg("카메라 권한을 허용해주세요.");
    } else {
      setErrorMsg("카메라를 시작할 수 없습니다.");
    }
  };

  const handleReport = async () => {
    if (!kickboardInfo.deviceId) {
      alert("기기 식별자를 입력하거나 QR을 스캔해주세요.");
      return;
    }

    try {
      // const { data } = await api.get(`api/scooter/${kickboardInfo.deviceId}`);
      
      // if (!data.success) {
      //   alert(data.message);
      //   return;
      // }

      //const response = await api.post("/report", { scooterId: kickboardInfo.deviceId });
      alert(`신고가 접수되었습니다: [${kickboardInfo.company}] ID: ${kickboardInfo.deviceId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "알 수 없는 오류가 발생했습니다.";
      alert(message);
    } else {
      console.error("일반 에러:", error);
    }
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-6 text-center min-h-[70vh] max-w-md mx-auto">
      {!isScanning ? (
        <section className="space-y-8 w-full py-4">
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            {kickboardInfo.deviceId ? (
              <CheckCircle2 size={48} className="text-green-500" />
            ) : (
              <Camera size={48} className="text-blue-500" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {kickboardInfo.deviceId ? "신고 정보 입력" : "QR코드 스캔"}
            </h2>
            <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">
              {kickboardInfo.deviceId 
                ? "식별자가 정확한지 확인 후 신고해주세요." 
                : "주정차 위반 킥보드를 촬영하거나\n식별 번호를 직접 입력하세요."}
            </p>
          </div>

          <div className="w-full space-y-4 text-left">
            {/* 회사명 - 입력 가능 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <ShieldAlert size={12} /> 킥보드 회사
              </label>
              <input 
                type="text"
                placeholder="회사명 입력"
                value={kickboardInfo.company}
                onChange={(e) => setKickboardInfo({...kickboardInfo, company: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* 기기 식별자 (ID) - 입력 가능하도록 수정 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <Smartphone size={12} /> 기기 식별자 (ID) *
              </label>
              <input 
                type="text"
                placeholder="직접 입력 또는 QR 스캔"
                value={kickboardInfo.deviceId}
                onChange={(e) => setKickboardInfo({...kickboardInfo, deviceId: e.target.value})}
                className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              />
            </div>

            {/* 기기 명칭 - 읽기 전용으로 수정 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1">
                <Smartphone size={12} /> 기기 명칭 (조회전용)
              </label>
              <input 
                type="text"
                readOnly
                placeholder="조회 시 자동 입력됩니다"
                value={kickboardInfo.deviceName}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none"
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
              {kickboardInfo.deviceId ? "다시 스캔하기" : "QR 스캔 시작"}
            </button>

            <button 
              onClick={handleReport}
              disabled={!kickboardInfo.deviceId}
              className={`w-full py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all ${
                kickboardInfo.deviceId ? "bg-red-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              신고하기
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 justify-center border border-red-100">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
        </section>
      ) : (
        /* 스캔 화면 영역 (동일) */
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

          <p className="text-xs text-gray-400 font-medium">
            킥보드 핸들 사이에 있는 QR코드를 비춰주세요.
          </p>
        </section>
      )}
    </div>
  );
}