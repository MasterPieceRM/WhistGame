import { NextResponse } from 'next/server';

const KEY = 'whist_history';

async function getKv() {
    if (!process.env.KV_URL && !process.env.KV_REST_API_URL) return null;
    const { kv } = await import('@vercel/kv');
    return kv;
}

export async function GET() {
    const kv = await getKv();
    if (!kv) return NextResponse.json([]);
    try {
        const history = (await kv.get(KEY)) ?? [];
        return NextResponse.json(history);
    } catch {
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    const kv = await getKv();
    if (!kv) return NextResponse.json({ ok: false });
    try {
        const entry = await request.json();
        const history = (await kv.get(KEY)) ?? [];
        history.unshift(entry);
        await kv.set(KEY, history.slice(0, 30));
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
