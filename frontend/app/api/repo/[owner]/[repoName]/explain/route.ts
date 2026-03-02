import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const SESSION_COOKIE = "gitgraph_session";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ owner: string; repoName: string }> },
) {
  try {
    const { owner, repoName } = await context.params;
    const path = req.nextUrl.searchParams.get("path") ?? "";
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ error: "Missing file path." }, { status: 400 });
    }

    const target = new URL(`${BASE_URL}/repos/${owner}/${repoName}/explain`);
    target.searchParams.set("path", path);

    const res = await fetch(target.toString(), {
      headers: { "x-session-id": sessionId },
    });

    if (!res.ok || !res.body) {
      const detail = await res.text();
      return NextResponse.json(
        { error: detail || "Failed to stream file explanation." },
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
    console.error("Error streaming file explanation:", error);
    return NextResponse.json({ error: "Failed to stream file explanation." }, { status: 500 });
  }
}
