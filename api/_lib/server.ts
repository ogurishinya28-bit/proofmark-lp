/**
 * api/_lib/server.ts
 *
 * Server-side shared utilities for ProofMark API routes (Vercel Node runtime).
 * - Single source of truth for env loading.
 * - Authenticated Supabase client (RLS-aware) and admin client (bypass RLS).
 * - Auth helpers: bearer token extraction, optional auth, hard auth.
 * - Common JSON helpers and structured logger.
 *
 * Design notes:
 *  - Never import this file from the browser (`client/src/...`).
 *  - All admin-only code paths must use `getAdminClient()` only after authorization.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// ──────────────────────────────────────────────────────────────────────────
// Env helpers
// ──────────────────────────────────────────────────────────────────────────
export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`[config] Missing required env: ${name}`);
    return value;
}

export function optionalEnv(name: string, fallback = ''): string {
    return process.env[name] ?? fallback;
}

// ──────────────────────────────────────────────────────────────────────────
// Supabase clients
// ──────────────────────────────────────────────────────────────────────────
export function getAdminClient(): SupabaseClient {
    return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

export function getUserClient(jwt: string): SupabaseClient {
    return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

// ──────────────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────────────
const JWT_SHAPE = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/;

export function getBearerToken(req: VercelRequest): string | null {
    const header = req.headers.authorization;
    if (typeof header !== 'string') return null;
    const match = JWT_SHAPE.exec(header);
    return match ? match[1] : null;
}

export interface AuthedUser {
    id: string;
    email: string | null;
    jwt: string;
}

/** Hard authentication: 401 if missing or invalid JWT. */
export async function requireUser(req: VercelRequest): Promise<AuthedUser> {
    const jwt = getBearerToken(req);
    if (!jwt) throw httpError(401, 'Missing or malformed Authorization header');
    const supa = getUserClient(jwt);
    const { data, error } = await supa.auth.getUser(jwt);
    if (error || !data.user) throw httpError(401, 'Invalid session');
    return { id: data.user.id, email: data.user.email ?? null, jwt };
}

/** Soft authentication: returns null when no/invalid token (used by Spot guest flow). */
export async function tryUser(req: VercelRequest): Promise<AuthedUser | null> {
    try {
        return await requireUser(req);
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ──────────────────────────────────────────────────────────────────────────
export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export function httpError(status: number, message: string): HttpError {
    return new HttpError(status, message);
}

export function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
    res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(body));
}

export function methodGuard(req: VercelRequest, res: VercelResponse, allow: string[]): boolean {
    if (!allow.includes(req.method ?? '')) {
        res.setHeader('Allow', allow.join(', '));
        json(res, 405, { error: 'Method not allowed' });
        return false;
    }
    return true;
}

// ──────────────────────────────────────────────────────────────────────────
// Logger
// ──────────────────────────────────────────────────────────────────────────
export interface LogContext {
    reqId: string;
    route: string;
}

export function makeLogger(route: string): { ctx: LogContext; info: (e: Record<string, unknown>) => void; warn: (e: Record<string, unknown>) => void; error: (e: Record<string, unknown>) => void } {
    const ctx: LogContext = { reqId: randomUUID(), route };
    const emit = (level: 'info' | 'warn' | 'error', body: Record<string, unknown>) => {
        const line = JSON.stringify({ level, ...ctx, ...body, ts: new Date().toISOString() });
        if (level === 'error') console.error(line);
        else if (level === 'warn') console.warn(line);
        else console.log(line);
    };
    return {
        ctx,
        info: (body) => emit('info', body),
        warn: (body) => emit('warn', body),
        error: (body) => emit('error', body),
    };
}

// ──────────────────────────────────────────────────────────────────────────
// Origin guard — only used by API routes that must reject foreign callers
// ──────────────────────────────────────────────────────────────────────────
export function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return true; // Same-origin / Stripe webhooks have no Origin header
    const allowed = (optionalEnv('ALLOWED_ORIGINS', 'https://proofmark.jp,https://www.proofmark.jp,http://localhost:3000,http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean));
    return allowed.includes(origin);
}
