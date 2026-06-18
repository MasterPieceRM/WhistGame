import { NextResponse } from 'next/server';

const KEY = 'whist_history';

async function getRedis() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
}

export async function GET() {
    const redis = await getRedis();
    if (!redis) return NextResponse.json([]);
    try {
        const history = (await redis.get(KEY)) ?? [];
        return NextResponse.json(history);
    } catch {
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    const redis = await getRedis();
    if (!redis) return NextResponse.json({ ok: false });
    try {
        const entry = await request.json();
        const history = (await redis.get(KEY)) ?? [];
        history.unshift(entry);
        await redis.set(KEY, history.slice(0, 30));
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
