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

self.addEventListener("push", function (e) {
  if (!e.data) return;

  const payload = e.data.json();
  const data = payload.data; 

  if (data) {
    const title = data.title || "새 알림";
    const body = data.body || "";
    const url = data.url || "/";

    e.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        data: { url: url },
        icon: "/push-icon.png", 
        badge: "/badge.png",
        vibrate: [200, 100, 200], // 진동 패턴 
      })
    );
  }
});


/**
 * 알림 클릭 → React 페이지 이동
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  console.log(event);
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