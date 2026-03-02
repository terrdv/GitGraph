import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const SESSION_COOKIE = "gitgraph_session";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ owner: string; repoName: string }> },
) {
  try {
    const { owner, repoName } = await context.params;
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/repos/${owner}/${repoName}/explanations`, {
      headers: { "x-session-id": sessionId },
    });

    if (!res.ok) {
      console.error(`Failed to fetch repository explanations: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: "Failed to fetch repository explanations" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching repository explanations:", error);
    return NextResponse.json({ error: "Failed to fetch repository explanations" }, { status: 500 });
  }
}
