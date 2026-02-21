import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "gitgraph_session";
const USERNAME_COOKIE = "github_username";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const username = req.cookies.get(USERNAME_COOKIE)?.value ?? null;

  return NextResponse.json({
    authenticated: Boolean(sessionId),
    username,
  });
}
