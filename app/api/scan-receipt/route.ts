import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

        if (!gasUrl) {
            return NextResponse.json(
                { status: 'error', message: 'GAS URL not configured' },
                { status: 500 }
            );
        }

        // Server-side fetch to GAS — no CORS issues
        const res = await fetch(gasUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body),
        });

        const text = await res.text();

        console.log('=== RAW GAS/n8n RESPONSE ===');
        console.log('Status:', res.status);
        console.log('Body (first 2000 chars):', text.slice(0, 2000));
        console.log('=== END RAW RESPONSE ===');

        // GAS sometimes returns HTML on error
        try {
            const data = JSON.parse(text);
            console.log('=== PARSED JSON KEYS ===', JSON.stringify(Object.keys(data)));
            if (data.data) console.log('data.data keys:', JSON.stringify(typeof data.data === 'object' ? Object.keys(data.data) : data.data));
            return NextResponse.json(data);
        } catch {
            return NextResponse.json(
                { status: 'error', message: 'Invalid response from GAS', raw: text.slice(0, 500) },
                { status: 502 }
            );
        }
    } catch (err) {
        console.error('Proxy error:', err);
        return NextResponse.json(
            { status: 'error', message: String(err) },
            { status: 500 }
        );
    }
}
