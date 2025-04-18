import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templatePath = path.join(
      process.cwd(),
      "lib",
      "firebase",
      "service-worker-template.js"
    );
    const templateContent = await fs.readFile(templatePath, "utf-8");

    const swContent = templateContent.replace(
      "{{API_KEY}}",
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""
    );

    return new NextResponse(swContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Service-Worker-Allowed": "/",
      },
    });
  } catch (error) {
    console.error("Error generating service worker:", error);
    return new NextResponse("Error generating service worker", { status: 500 });
  }
}
