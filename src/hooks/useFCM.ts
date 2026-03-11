import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

export const getFirebaseMessaging = () => {
    if (messaging) return messaging;

    // 브라우저 환경 및 서비스 워커 지원 여부 체크
    const isSupportedEnv =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        (window.location.protocol === "https:" || window.location.hostname === "localhost");

    if (!isSupportedEnv) {
        console.warn("Firebase Messaging: 지원되지 않는 환경입니다. (HTTPS 필요)");
        return null;
    }

    try {
        messaging = getMessaging(app);
        return messaging;
    } catch (error) {
        console.error("Firebase Messaging 초기화 실패:", error);
        return null;
    }
};