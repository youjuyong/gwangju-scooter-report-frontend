importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
});

const messaging = firebase.messaging();

self.addEventListener("install", (event) => {
  self.skipWaiting(); // 대기하지 않고 즉시 활성화 단계로 이동
});

self.addEventListener("activate", (event) => {
  // 새 서비스 워커가 즉시 페이지의 제어권을 가져옴
  event.waitUntil(clients.claim()); 
});

self.addEventListener("push" , function (e) {
  console.log("Push received:", e);

  let title = "새 알림";
  let body = "내용이 없습니다.";
  let url = "/";

  if (e.data) {
    try {
      const payload = e.data.json();
      const target = payload.data || payload; 
      
      title = target.title || title;
      body = target.body || body;
      url = target.url || url;
    } catch (err) {
      console.error("JSON 파싱 에러:", err);
      body = e.data.text();
    }
  }

  // 데이터 여부와 상관없이 무조건 알림 표시
  e.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      data: { url: url },
      icon: "/push-icon.png",
      badge: "/badge.png",
      tag: "pm-report-alert",
      renotify: true,
      vibrate: [200, 100, 200],
    })
  );
});


/**
 * 알림 클릭 → React 페이지 이동
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const relativeUrl = event.notification.data?.url || "/";
  console.log(relativeUrl);
  const absoluteUrl = new URL(relativeUrl, self.location.origin).href;

event.waitUntil(
  clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      if (clientList.length > 0) {
        let focused = false;

        for (const client of clientList) {
          console.log("client : ", client);
          client.postMessage({ type: "NAVIGATE", url: relativeUrl });

          if (!focused && "focus" in client) {
            client.focus();
            focused = true;
          }
        }
        return;
      }
      
      return clients.openWindow(absoluteUrl);
    })
);
});