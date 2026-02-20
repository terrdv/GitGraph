import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "github_access_token";
const USERNAME_COOKIE = "github_username";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const username = req.cookies.get(USERNAME_COOKIE)?.value ?? null;

  return NextResponse.json({
    authenticated: Boolean(accessToken),
    username,
  });
}
