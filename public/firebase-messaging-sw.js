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
// 더욱 직관적이고 빠른 실행을 위해 async/await 구조로 변경한 코드
self.addEventListener("notificationclick", (event) => {
 event.notification.close();
  
  const relativeUrl = event.notification.data?.url || "/";
  const absoluteUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    
    const matchingClient = clientList.find(client => client.url.startsWith(self.location.origin));

    if (matchingClient) {
      matchingClient.postMessage({ type: "NAVIGATE", url: relativeUrl });
      
      if (matchingClient.url !== absoluteUrl && "navigate" in matchingClient) {
        await matchingClient.navigate(absoluteUrl);
      }
      return matchingClient.focus();
    }

    return clients.openWindow(absoluteUrl);
  })());
});
// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
  
//   const relativeUrl = event.notification.data?.url || "/";
//   const absoluteUrl = new URL(relativeUrl, self.location.origin).href;
//   console.log(absoluteUrl);
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true })
//       .then((clientList) => {
//         const matchingClient = clientList.find(client => {
//           return client.url.startsWith(self.location.origin);
//         });

//         if (matchingClient) {
//           matchingClient.postMessage({ type: "NAVIGATE", url: relativeUrl });
//           return matchingClient.focus();
//         }

//         return clients.openWindow(absoluteUrl);
//       })
//   );
// });
// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
  
//   const relativeUrl = event.notification.data?.url || "/";
//   console.log("알림 클릭 relativeUrl:", relativeUrl);
//   const absoluteUrl = new URL(relativeUrl, self.location.origin).href;

//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true })
//       .then((clientList) => {
        
//         if (clientList.length > 0) {
//           const client = clientList[0]; 
          
//           if ("focus" in client) {
//             return client.focus().then((focusedClient) => {
//               if (focusedClient) {
//                 focusedClient.postMessage({ type: "NAVIGATE", url: relativeUrl });
//               }
//             });
//           }
//         }
        
//         return clients.openWindow(absoluteUrl);
//       })
//   );
// });