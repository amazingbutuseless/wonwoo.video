import { NextResponse } from "next/server";

import admin from "@/lib/firebase/admin";
import { SUPPORTED_LANGUAGES } from "@/i18n/routing";

function internationalize(locale: string, data: Record<string, string>) {
  const { videoTitle, numOfVideos } = data;

  const intNumOfVideos = parseInt(numOfVideos, 10);

  if (locale === "ko") {
    const body =
      intNumOfVideos > 1
        ? `${videoTitle} 영상을 포함한 ${numOfVideos}개의 동영상이 업데이트 되었습니다.`
        : `${videoTitle} 영상이 업데이트 되었습니다.`;
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

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const username = process.env.PREVIEW_USERNAME || "admin";
  const password = process.env.PREVIEW_PASSWORD || "password";
  const validAuth = `Basic ${Buffer.from(`${username}:${password}`).toString(
    "base64"
  )}`;

  if (!authHeader || authHeader !== validAuth) {
    return NextResponse.json(
      { success: false, message: "인증이 필요합니다." },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": "Basic realm='Notification API'",
        },
      }
    );
  }

  try {
    const { topic, videoTitle, numOfVideos = 0 } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, message: "토픽이 필요합니다." },
        { status: 400 }
      );
    }

    let success = false;

    if (topic === "update" && videoTitle && numOfVideos > 0) {
      const tasks: Promise<string>[] = [];
      Object.keys(SUPPORTED_LANGUAGES).forEach((locale) => {
        const data = internationalize(locale, {
          videoTitle,
          numOfVideos,
        });

        tasks.push(
          admin.messaging().send({
            data,
            topic: `update-${locale}`,
          })
        );
      });

      await Promise.all(tasks);
      success = true;
    }

    return NextResponse.json({ success });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
