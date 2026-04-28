/**
 * POST /api/teams/invite
 * Body: { teamId: uuid, email: string, role?: 'admin'|'member', ttlMinutes?: number }
 *
 * - Requires authenticated user (the inviter).
 * - Inviter must already be the team's owner/admin (enforced inside fn_create_team_invitation).
 * - Returns the invitation token + accept URL.
 *
 * Notes:
 *   We deliberately do NOT auto-send an email here; that is decoupled to the
 *   `notifyInviteEmail` helper which uses Resend (already configured in
 *   /api/send-contact). Sending email failure should not roll back the token.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    HttpError,
    getAdminClient,
    isAllowedOrigin,
    json,
    makeLogger,
    methodGuard,
    optionalEnv,
    requireUser,
} from '../_lib/server.js';

const APP_URL = optionalEnv('APP_URL', 'https://proofmark.jp').replace(/\/$/, '');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const userHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userHits.get(userId);
  if (!entry || entry.resetAt < now) {
    userHits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

interface InviteBody {
    teamId: string;
    email: string;
    role?: 'admin' | 'member';
    ttlMinutes?: number;
}

function parseBody(body: unknown): InviteBody {
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
    const b = body as Record<string, unknown>;
    if (typeof b.teamId !== 'string' || !UUID.test(b.teamId)) throw new HttpError(400, 'teamId must be a UUID');
    if (typeof b.email !== 'string' || !EMAIL.test(b.email.trim())) throw new HttpError(400, 'email is invalid');
    const role = b.role === 'admin' || b.role === 'member' ? b.role : 'member';
    const ttlMinutes = typeof b.ttlMinutes === 'number' && Number.isFinite(b.ttlMinutes)
        ? Math.max(15, Math.min(60 * 24 * 30, Math.floor(b.ttlMinutes)))
        : 60 * 24 * 7;
    return { teamId: b.teamId, email: b.email.trim().toLowerCase(), role, ttlMinutes };
}

async function sendInviteEmail(opts: {
    inviterEmail: string | null;
    teamName: string;
    email: string;
    acceptUrl: string;
    role: string;
}) {
    const apiKey = optionalEnv('RESEND_API_KEY');
    if (!apiKey) return { ok: false, reason: 'RESEND_API_KEY missing' };
    const from = optionalEnv('CONTACT_FROM_ADDRESS', 'ProofMark <noreply@proofmark.jp>');

    const subject = `[ProofMark] ${opts.teamName} に ${opts.role === 'admin' ? '管理者' : 'メンバー'} として招待されました`;
    const text = [
        `${opts.inviterEmail ?? 'ProofMark'} さんから ${opts.teamName} に招待されました。`,
        '',
        '以下のリンクから参加してください:',
        opts.acceptUrl,
        '',
        '※ このリンクは1週間で失効します。心当たりがない場合は破棄してください。',
    ].join('\n');

    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [opts.email], subject, text, reply_to: opts.inviterEmail ?? from }),
    });
    return { ok: r.ok, reason: r.ok ? '' : `HTTP ${r.status}` };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('teams/invite');
    res.setHeader('x-request-id', log.ctx.reqId);
    if (!methodGuard(req, res, ['POST'])) return;

    const origin = (req.headers.origin as string | undefined) ?? '';
    if (origin && !isAllowedOrigin(origin)) {
        json(res, 403, { error: 'Origin not allowed', reqId: log.ctx.reqId });
        return;
    }

    try {
        const body = parseBody(req.body);
        const inviter = await requireUser(req);

        if (!rateLimit(inviter.id)) {
            json(res, 429, { error: 'Too many requests. Please wait a minute.', reqId: log.ctx.reqId });
            return;
        }

        const admin = getAdminClient();

        // Look up team name (used in email body) — the RPC enforces inviter authorization.
        const { data: team, error: teamErr } = await admin
            .from('teams')
            .select('id, name, status')
            .eq('id', body.teamId)
            .maybeSingle();
        if (teamErr) throw teamErr;
        if (!team) throw new HttpError(404, 'team not found');
        if (team.status !== 'active') throw new HttpError(409, 'team is not active');

        const { data, error } = await admin.rpc('fn_create_team_invitation', {
            p_team_id: body.teamId,
            p_inviter_id: inviter.id,
            p_email: body.email,
            p_role: body.role ?? 'member',
            p_ttl_minutes: body.ttlMinutes ?? 60 * 24 * 7,
        });
        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.token) throw new HttpError(500, 'invitation creation failed');

        const acceptUrl = `${APP_URL}/teams/accept?token=${encodeURIComponent(row.token)}`;
        const send = await sendInviteEmail({
            inviterEmail: inviter.email,
            teamName: team.name,
            email: body.email,
            acceptUrl,
            role: body.role ?? 'member',
        });
        if (!send.ok) log.warn({ event: 'invite.email_skip', reason: send.reason });

        log.info({ event: 'invite.created', teamId: team.id, inviteId: row.id, email: body.email });
        json(res, 200, {
            ok: true,
            invitationId: row.id,
            acceptUrl,
            expiresAt: row.expires_at,
            emailSent: send.ok,
            reqId: log.ctx.reqId,
        });
    } catch (err) {
        if (err instanceof HttpError) {
            json(res, err.status, { error: err.message, reqId: log.ctx.reqId });
            return;
        }
        const message = String((err as Error)?.message ?? err);
        log.error({ event: 'invite.error', message });
        if (/inviter is not allowed/.test(message)) {
            json(res, 403, { error: 'inviter is not allowed', reqId: log.ctx.reqId });
            return;
        }
        if (/max_seats/.test(message)) {
            json(res, 409, { error: 'max_seats_reached', reqId: log.ctx.reqId });
            return;
        }
        json(res, 500, { error: 'Internal error', reqId: log.ctx.reqId });
    }
}

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };
