import { NextResponse } from 'next/server';

const KEY = 'whist_players';

async function getKv() {
    if (!process.env.KV_URL && !process.env.KV_REST_API_URL) return null;
    const { kv } = await import('@vercel/kv');
    return kv;
}

export async function GET() {
    const kv = await getKv();
    if (!kv) return NextResponse.json([]);
    try {
        const players = (await kv.get(KEY)) ?? [];
        return NextResponse.json(players);
    } catch {
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    const kv = await getKv();
    if (!kv) return NextResponse.json({ ok: false });
    try {
        const players = await request.json();
        await kv.set(KEY, players);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
