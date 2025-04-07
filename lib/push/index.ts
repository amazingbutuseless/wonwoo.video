"use client";

import * as FCM from "firebase/messaging";

const VAPID_KEY = process.env.PUBLIC_VAPID_KEY;

export const subscribe = async (messagingApp: FCM.Messaging) => {
  try {
    const fcmToken = await FCM.getToken(messagingApp, { vapidKey: VAPID_KEY });

    if (fcmToken) {
      await fetch("/api/notification/subscribe", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken, topic: "update" }),
      });
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

export const unsubscribe = async (messagingApp: FCM.Messaging) => {
  try {
    const fcmToken = await FCM.getToken(messagingApp, { vapidKey: VAPID_KEY });

    if (fcmToken) {
      await fetch("/api/notification/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken, topic: "update" }),
      });
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

export function internationalize(locale: string, data: Record<string, string>) {
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
