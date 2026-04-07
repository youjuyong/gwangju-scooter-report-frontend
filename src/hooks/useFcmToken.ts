import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/hooks/useFCM";
import api from "@/services/api";

export const useFcmToken = () => {

  // 기기 정보 추출 유틸
  const getDeviceInfo = () => {
    if (typeof window === "undefined") return "Web";

    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const touchPoints = navigator.maxTouchPoints || 0;

    if (/android/i.test(ua)) return "Android";

    const isIOS = 
      /iPad|iPhone|iPod/.test(ua) || 
      /iPad|iPhone|iPod/.test(platform) ||
      (platform === 'MacIntel' && touchPoints > 1) ||
      (ua.includes("Macintosh") && "ontouchend" in document); 

    if (isIOS) return "iOS";

    return "Web";
  };

  // 기기 uuid
  const getOrCreateDeviceUuid = () => {
    if (typeof window === "undefined") return "";

    const STORAGE_KEY = "user_device_uuid";
    let deviceUuid = localStorage.getItem(STORAGE_KEY);

    if (!deviceUuid) {
      deviceUuid = typeof crypto.randomUUID === "function" 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      localStorage.setItem(STORAGE_KEY, deviceUuid);
    }

    return deviceUuid;
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

  const fetchFcmTokenForCallback = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.error("서비스 워커를 지원하지 않는 환경입니다.");
      return null;
    }

    try {
      if (Notification.permission !== "granted") {
        console.warn("알림 권한이 허용되지 않은 상태입니다.");
        return null;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;

      const messaging = getFirebaseMessaging();
      if (!messaging) return null;

      let token = null;
      for (let i = 0; i < 3; i++) {
        try {
          token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          if (token) break; 
        } catch (e) {
          console.warn(`${i + 1}차 토큰 획득 시도 실패, 재시도 중...`);
          await new Promise((res) => setTimeout(res, 1000)); 
        }
      }

      return token;
    } catch (error) {
      console.error("FCM 콜백 전용 추출 에러:", error);
      return null;
    }
  };

  const handleAllowNotification = async () => {
      const isSupported = 
        typeof window !== "undefined" && 
        "serviceWorker" in navigator &&
        (location.protocol === "https:" || location.hostname === "localhost");

      if (!isSupported) return null;
  
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return null;
  
        // 서비스 워커 등록 확인
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;
  
        // FCM 토큰 가져오기
        const messaging = getFirebaseMessaging();
        if (!messaging) return null;
  
        const currentToken =  await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        
        return currentToken;
      } catch (error) {
        console.error("FCM 설정 에러:", error);
        return null;
      }
  };

  // 2. 서버에 토큰 저장
  const saveTokenToServer = async (fcmToken: string, accessToken : string) => {
    const  deviceType  = getDeviceInfo();
    const   deviceId   = getOrCreateDeviceUuid();
    
    try {
      await api.post("/fcm/token", 
        { fcmToken, deviceType, deviceId },
        { headers: { Authorization: `Bearer ${accessToken}`} }
      );
      console.log("FCM 토큰 서버 동기화 완료");
    } catch (error) {
      console.error("FCM 서버 저장 실패:", error);
    }
  };

  return { fetchFcmToken, saveTokenToServer, getDeviceInfo, handleAllowNotification, fetchFcmTokenForCallback };
};