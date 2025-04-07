import { NextResponse } from "next/server";

import admin from "@/lib/firebase/admin";

export async function POST(req: Request) {
    try {
      const { token, topic } = await req.json();
  
      if (!token || !topic) {
        return NextResponse.json({ success: false, message: "토큰과 토픽이 필요합니다." }, { status: 400 });
      }
  
      await admin.messaging().unsubscribeFromTopic(token, topic);
  
      return NextResponse.json({ success: true, message: `토픽 "${topic}" 구독 해제 완료` });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
  }