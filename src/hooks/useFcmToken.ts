import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/hooks/useFCM";
import api from "@/services/api";

export const useFcmToken = () => {
  // 기기 정보 추출 유틸
  const getDeviceInfo = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    let deviceType = "WEB";
    if (/android/i.test(ua)) deviceType = "ANDROID";
    else if (/iPad|iPhone|iPod/.test(ua)) deviceType = "IOS";

    return  deviceType;
  };

  // 1. FCM 토큰 생성/가져오기
  const fetchFcmToken = async () => {
    const isSupported = 
      typeof window !== "undefined" && 
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost");

    if (!isSupported) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;

      const messaging = getFirebaseMessaging();
      if (!messaging) return null;

      return await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
    } catch (error) {
      console.error("FCM 생성 에러:", error);
      return null;
    }
  };

  // 2. 서버에 토큰 저장
  const saveTokenToServer = async (fcmToken: string, accessToken : string) => {
    const  deviceType  = getDeviceInfo();
    try {
      await api.post("/api/fcm/token", 
        { fcmToken, deviceType },
        { headers: { Authorization: `Bearer ${accessToken}`} }
      );
      console.log("FCM 토큰 서버 동기화 완료");
    } catch (error) {
      console.error("FCM 서버 저장 실패:", error);
    }
  };

  return { fetchFcmToken, saveTokenToServer, getDeviceInfo };
};