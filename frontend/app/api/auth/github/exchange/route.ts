import { NextResponse } from "next/server";

const BASE_URL = process.env.SERVER_BASE_URL!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE_URL}/auth/github/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error exchanging code:", error);
    return NextResponse.json({ error: "Failed to exchange GitHub code" }, { status: 500 });
  }
}
