importScripts(
  "https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "{{API_KEY}}",
  authDomain: "wonwoo-video.firebaseapp.com",
  databaseURL:
    "https://wonwoo-video-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wonwoo-video",
  storageBucket: "wonwoo-video.firebasestorage.app",
  messagingSenderId: "585284382032",
  appId: "1:585284382032:web:975eb116af47607eb99055",
  measurementId: "G-NC0JQM512T",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async (payload) => {
  const { title, body } = payload.data;
  if (!title || !body) {
    console.error("Missing title or body in payload");
    return;
  }
  self.registration.showNotification(title, {
    body,
    icon: payload.notification?.icon || "/default-icon.png",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});
