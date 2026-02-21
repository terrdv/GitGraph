import { NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const SESSION_COOKIE = "gitgraph_session";
const USERNAME_COOKIE = "github_username";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE_URL}/auth/github/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || "Unexpected response from auth server." };
    }

    const responseBody: Record<string, unknown> =
      typeof data === "object" && data !== null ? { ...(data as Record<string, unknown>) } : {};

    const hasSessionId =
      res.ok &&
      typeof data === "object" &&
      data !== null &&
      "session_id" in data &&
      typeof (data as { session_id?: unknown }).session_id === "string";

    if (hasSessionId) {
      const typedData = data as { session_id: string; username?: string };
      // Never expose session ids to browser JavaScript.
      delete responseBody.session_id;
      if (!("username" in responseBody) && typeof typedData.username === "string") {
        responseBody.username = typedData.username;
      }
    }

    const response = NextResponse.json(responseBody, { status: res.status });

    if (hasSessionId) {
      const typedData = data as { session_id: string; username?: string };
      response.cookies.set({
        name: SESSION_COOKIE,
        value: typedData.session_id,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      if (typeof typedData.username === "string" && typedData.username.length > 0) {
        response.cookies.set({
          name: USERNAME_COOKIE,
          value: typedData.username,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    // Cleanup legacy deployments that used token cookies.
    response.cookies.delete("github_access_token");

    return response;
  } catch (error) {
    console.error("Error exchanging code:", error);
    return NextResponse.json({ error: "Failed to exchange GitHub code" }, { status: 500 });
  }
}
