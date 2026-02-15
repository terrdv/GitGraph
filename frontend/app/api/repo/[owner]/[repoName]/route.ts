import { NextResponse } from 'next/server';
const BASE_URL = process.env.SERVER_BASE_URL!;

export async function GET(req: Request,
    context: { params: Promise<{ owner: string, repo: string }> }
) {
    try {
        const { owner, repo } = await context.params;
        const res = await fetch(`${BASE_URL}/${owner}/${repo}/tree`);
        if (!res.ok) {
            console.error(`Failed to fetch repository data: ${res.status} ${res.statusText}`);
            return NextResponse.json({ error: 'Failed to fetch repository data' }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching repository data:', error);
        return NextResponse.json({ error: 'Failed to fetch repository data' }, { status: 500 });
    }
}