import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const SESSION_COOKIE = "gitgraph_session";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ owner: string; repoName: string }> },
) {
  try {
    const { owner, repoName } = await context.params;
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query : "";
    if (!query.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}/analyze/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        owner,
        repo: repoName,
        query,
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text();
      return NextResponse.json(
        { error: detail || "Failed to stream chat response." },
        { status: res.status || 500 },
      );
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error proxying chat request:", error);
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}
