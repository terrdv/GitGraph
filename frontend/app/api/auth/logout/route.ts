import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const SESSION_COOKIE = "gitgraph_session";
const ACCESS_TOKEN_COOKIE = "github_access_token";
const USERNAME_COOKIE = "github_username";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value ?? "";

  if (sessionId) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "x-session-id": sessionId },
      });
    } catch (error) {
      console.error("Failed to invalidate backend session:", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  // Cleanup legacy token cookie from previous versions.
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(USERNAME_COOKIE);
  return response;
}
