import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const OAUTH_STATE_COOKIE = "github_oauth_state";
const OAUTH_SCOPE = "repo read:user";

export async function GET() {
  try {
    const state = randomBytes(32).toString("hex");

    const target = new URL(`${BASE_URL}/auth/github/login-url`);
    target.searchParams.set("state", state);
    target.searchParams.set("scope", OAUTH_SCOPE);

    const res = await fetch(target.toString());
    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    if (res.ok) {
      response.cookies.set({
        name: OAUTH_STATE_COOKIE,
        value: state,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching login URL:", error);
    return NextResponse.json({ error: "Failed to fetch login URL" }, { status: 500 });
  }
}
