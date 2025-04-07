import { NextResponse } from "next/server";

import admin from "@/lib/firebase/admin";

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
    const { topic, title, body } = await req.json();

    if (!topic || !title || !body) {
      return NextResponse.json(
        { success: false, message: "토픽, 제목, 본문이 필요합니다." },
        { status: 400 }
      );
    }

    const message = {
      notification: { title, body },
      topic: topic, // 특정 토픽에 푸시 전송
    };

    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, response });
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
