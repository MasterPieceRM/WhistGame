import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? '✅ set' : '❌ missing',
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ set' : '❌ missing',
        KV_REST_API_URL: process.env.KV_REST_API_URL ? '✅ set' : '❌ missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '✅ set' : '❌ missing',
        KV_URL: process.env.KV_URL ? '✅ set' : '❌ missing',
    });
}
