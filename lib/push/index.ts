"use client";

import * as FCM from "firebase/messaging";

const VAPID_KEY = process.env.PUBLIC_VAPID_KEY;

export const subscribe = async (
  messagingApp: FCM.Messaging,
  locale: string = "en"
) => {
  try {
    const fcmToken = await FCM.getToken(messagingApp, { vapidKey: VAPID_KEY });

    if (fcmToken) {
      const topic = `update-${locale}`;

      await fetch("/api/notification/subscribe", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken, topic }),
      });

      console.log(`Subscribed to topic: ${topic}`);
      return true;
    } else {
      console.log("FCM 토큰을 가져올 수 없습니다.");
      return false;
    }
  } catch (error) {
    console.error("FCM 토큰 가져오기 실패:", error);
    return false;
  }
};

export const unsubscribe = async (
  messagingApp: FCM.Messaging,
  locale: string = "en"
) => {
  try {
    const fcmToken = await FCM.getToken(messagingApp, { vapidKey: VAPID_KEY });

    if (fcmToken) {
      const topic = `update-${locale}`;

      await fetch("/api/notification/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken, topic }),
      });
      return true;
    } else {
      console.log("FCM 토큰을 가져올 수 없습니다.");
      return false;
    }
  } catch (error) {
    console.error("FCM 토큰 구독 해제 실패:", error);
    return false;
  }
};
