import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;
const ACCESS_TOKEN_COOKIE = "github_access_token";

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");
    const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const headerToken = authorization?.toLowerCase().startsWith("bearer ")
      ? authorization
      : null;
    const token = headerToken ?? (cookieToken ? `Bearer ${cookieToken}` : null);

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/repos`, {
      headers: { Authorization: token },
    });

    if (!res.ok) {
      console.error(`Failed to fetch repository data: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: "Failed to fetch repository data" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching repository data:", error);
    return NextResponse.json({ error: "Failed to fetch repository data" }, { status: 500 });
  }
}

