import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const isVercelPreview = hostname.endsWith(".vercel.app");

  if (isVercelPreview) {
    const authHeader = request.headers.get("authorization");
    
    const username = process.env.PREVIEW_USERNAME || "admin";
    const password = process.env.PREVIEW_PASSWORD || "password";
    
    const validAuth = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    
    if (authHeader !== validAuth) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": "Basic realm='Secure Area'"
        }
      });
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
