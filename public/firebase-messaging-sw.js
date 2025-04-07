importScripts(
  "https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "process.env.NEXT_PUBLIC_FIREBASE_API_KEY",
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

const getUserLocale = async () => {
  return new Promise((resolve) => {
    const request = indexedDB.open("wonwoo-video", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(["settings"], "readonly");
        const store = transaction.objectStore("settings");
        const getLocale = store.get("locale");

        getLocale.onsuccess = () => {
          if (getLocale.result && getLocale.result.value) {
            resolve(getLocale.result.value);
          } else {
            const browserLang = self.navigator?.language?.split("-")[0] || "en";

            const supportedLanguages = ["ko", "en", "ja", "zh-CN", "zh-TW"];
            const detectedLang = supportedLanguages.includes(browserLang)
              ? browserLang
              : "en";

            resolve(detectedLang);
          }
          db.close();
        };

        getLocale.onerror = () => {
          resolve("en");
          db.close();
        };
      } catch {
        resolve("en");
        db.close();
      }
    };

    request.onerror = () => {
      resolve("en");
    };
  });
};

function internationalize(locale, data) {
  const { videoTitle, numOfVideos } = data;

  const intNumOfVideos = parseInt(numOfVideos, 10);

  if (locale === "ko") {
    const body =
      intNumOfVideos > 1
        ? `${videoTitle}을 포함한 ${numOfVideos}개의 동영상이 업데이트 되었습니다.`
        : `${videoTitle}이 업데이트 되었습니다.`;
    return {
      title: "새로운 비디오 업데이트",
      body,
    };
  }

  if (locale === "ja") {
    const body =
      intNumOfVideos > 1
        ? `${videoTitle}を含む${numOfVideos}本の動画が更新されました。`
        : `${videoTitle}が更新されました。`;
    return {
      title: "新しい動画が更新されました",
      body,
    };
  }

  if (locale === "zh-CN") {
    const body =
      intNumOfVideos > 1
        ? `${videoTitle}等${numOfVideos}个视频已更新。`
        : `${videoTitle}已更新。`;
    return {
      title: "新视频更新",
      body,
    };
  }

  if (locale === "zh-TW") {
    const body =
      intNumOfVideos > 1
        ? `${videoTitle}等${numOfVideos}個影片已更新。`
        : `${videoTitle}已更新。`;
    return {
      title: "新影片更新",
      body,
    };
  }

  const body =
    intNumOfVideos > 1
      ? `${numOfVideos} videos including ${videoTitle} have been updated.`
      : `${videoTitle} has been updated.`;
  return {
    title: "New Video Updated",
    body,
  };
}

messaging.onBackgroundMessage(async (payload) => {
  if (payload.data && payload.data.type === "update") {
    const locale = await getUserLocale();
    const { title, body } = internationalize(locale, payload.data);
    self.registration.showNotification(title, {
      body,
      icon: payload.notification?.icon || "/default-icon.png",
    });
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
