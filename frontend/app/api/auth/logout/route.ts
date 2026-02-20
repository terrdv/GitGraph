import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "github_access_token";
const USERNAME_COOKIE = "github_username";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(USERNAME_COOKIE);
  return response;
}
