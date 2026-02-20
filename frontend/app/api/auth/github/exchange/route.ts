import { NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const ACCESS_TOKEN_COOKIE = "github_access_token";
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

    const response = NextResponse.json(data, { status: res.status });

    if (
      res.ok &&
      typeof data === "object" &&
      data !== null &&
      "access_token" in data &&
      typeof (data as { access_token?: unknown }).access_token === "string"
    ) {
      const typedData = data as { access_token: string; username?: string };
      response.cookies.set({
        name: ACCESS_TOKEN_COOKIE,
        value: typedData.access_token,
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

    return response;
  } catch (error) {
    console.error("Error exchanging code:", error);
    return NextResponse.json({ error: "Failed to exchange GitHub code" }, { status: 500 });
  }
}
