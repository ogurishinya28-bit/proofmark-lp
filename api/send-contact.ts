/**
 * POST /api/send-contact
 *
 * Receives a contact-form submission and forwards it to the ProofMark inbox via Resend.
 * Falls back to logging-only mode if RESEND_API_KEY is not configured (used in preview envs).
 *
 * Anti-abuse:
 *  - Origin check
 *  - Required fields validation
 *  - Honeypot field (`website`) must be empty
 *  - Cheap in-memory rate limit (per IP)
 *
 * Storage:
 *  - Persists submissions to `contact_submissions` for the team to triage even if email fails.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, getAdminClient, isAllowedOrigin, json, makeLogger, methodGuard, optionalEnv } from './_lib/server.js';

interface ContactPayload {
    name: string;
    email: string;
    company?: string;
    topic: string;
    message: string;
    // Honeypot
    website?: string;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = ipHits.get(ip);
    if (!entry || entry.resetAt < now) {
        ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    entry.count += 1;
    return entry.count <= RATE_LIMIT_MAX;
}

function parsePayload(body: unknown): ContactPayload {
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
    const b = body as Record<string, unknown>;
    if (typeof b.website === 'string' && b.website.trim().length > 0) {
        throw new HttpError(400, 'Spam detected');
    }
    const required = ['name', 'email', 'topic', 'message'] as const;
    for (const k of required) {
        if (typeof b[k] !== 'string' || (b[k] as string).trim() === '') {
            throw new HttpError(400, `Field ${k} is required`);
        }
    }
    const email = (b.email as string).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid email');
    if ((b.message as string).length > 5000) throw new HttpError(400, 'Message too long');
    return {
        name: (b.name as string).trim().slice(0, 200),
        email,
        company: typeof b.company === 'string' ? (b.company as string).trim().slice(0, 200) : undefined,
        topic: (b.topic as string).trim().slice(0, 100),
        message: (b.message as string).trim(),
    };
}

async function sendViaResend(payload: ContactPayload): Promise<{ ok: boolean; details?: string }> {
    const apiKey = optionalEnv('RESEND_API_KEY');
    if (!apiKey) return { ok: false, details: 'RESEND_API_KEY is not configured' };
    const from = optionalEnv('CONTACT_FROM_ADDRESS', 'ProofMark <noreply@proofmark.jp>');
    const to = optionalEnv('CONTACT_TO_ADDRESS', 'support@proofmark.jp');

    const subject = `[ProofMark Contact] ${payload.topic} — ${payload.name}`;
    const text = [
        `Topic   : ${payload.topic}`,
        `Name    : ${payload.name}`,
        `Email   : ${payload.email}`,
        `Company : ${payload.company ?? '-'}`,
        '',
        payload.message,
    ].join('\n');

    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], reply_to: payload.email, subject, text }),
    });

    if (!r.ok) {
        return { ok: false, details: `Resend HTTP ${r.status}` };
    }
    return { ok: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('send-contact');
    res.setHeader('x-request-id', log.ctx.reqId);

    if (!methodGuard(req, res, ['POST'])) return;
    const origin = (req.headers.origin as string | undefined) ?? '';
    if (origin && !isAllowedOrigin(origin)) {
        json(res, 403, { error: 'Origin not allowed', reqId: log.ctx.reqId });
        return;
    }

    try {
        const payload = parsePayload(req.body);
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
        if (!rateLimit(ip)) {
            json(res, 429, { error: 'Too many requests', reqId: log.ctx.reqId });
            return;
        }

        const admin = getAdminClient();
        const { data, error } = await admin
            .from('contact_submissions')
            .insert({
                topic: payload.topic,
                name: payload.name,
                email: payload.email,
                company: payload.company ?? null,
                message: payload.message,
                ip,
                user_agent: (req.headers['user-agent'] as string | undefined) ?? null,
            })
            .select('id')
            .maybeSingle();
        if (error) throw error;

        const sent = await sendViaResend(payload);
        if (!sent.ok) log.warn({ event: 'contact.email_skip', details: sent.details ?? '' });

        log.info({ event: 'contact.received', topic: payload.topic, id: data?.id ?? null, sent: sent.ok });
        json(res, 200, { ok: true, id: data?.id ?? null, reqId: log.ctx.reqId });
    } catch (err) {
        if (err instanceof HttpError) {
            json(res, err.status, { error: err.message, reqId: log.ctx.reqId });
            return;
        }
        log.error({ event: 'contact.error', message: String((err as Error)?.message ?? err) });
        json(res, 500, { error: 'Internal error', reqId: log.ctx.reqId });
    }
}

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };
