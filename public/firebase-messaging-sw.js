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

// self.addEventListener("push", function (e) {
//   console.log("Push received:", e);

//   let title = "새 알림";
//   let body = "내용이 없습니다.";
//   let url = "/";

//   if (e.data) {
//     try {
//       const payload = e.data.json();
//       const target = payload.data || payload; 
      
//       title = target.title || title;
//       body = target.body || body;
//       url = target.url || url;
//     } catch (err) {
//       console.error("JSON 파싱 에러:", err);
//       body = e.data.text();
//     }
//   }

//   // 데이터 여부와 상관없이 무조건 알림 표시
//   e.waitUntil(
//     self.registration.showNotification(title, {
//       body: body,
//       data: { url: url },
//       icon: "/push-icon.png",
//       badge: "/badge.png",
//       tag: "pm-report-alert",
//       renotify: true,
//       vibrate: [200, 100, 200],
//     })
//   );
// });


messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신: ', payload);

  // 서버에서 보낸 notification 또는 data에서 값 추출
  const title = payload.notification?.title || payload.data?.title || "새 알림";
  const body = payload.notification?.body || payload.data?.body || "";
  const url = payload.data?.url || "/"; // 클릭 시 이동할 URL

  return self.registration.showNotification(title, {
    body: body,
    icon: "/push-icon.png",
    badge: "/badge.png",
    data: { url: url }, // notificationclick에서 쓰기 위함
    tag: "pm-report-alert",
    renotify: true,
  });
});

/**
 * 알림 클릭 → React 페이지 이동
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({ url });
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});