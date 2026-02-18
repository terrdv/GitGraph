import { NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");
    const scope = url.searchParams.get("scope");

    const target = new URL(`${BASE_URL}/auth/github/login-url`);
    if (state) target.searchParams.set("state", state);
    if (scope) target.searchParams.set("scope", scope);

    const res = await fetch(target.toString());
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching login URL:", error);
    return NextResponse.json({ error: "Failed to fetch login URL" }, { status: 500 });
  }
}
