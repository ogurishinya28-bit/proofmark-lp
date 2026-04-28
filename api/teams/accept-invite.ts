/**
 * POST /api/teams/accept-invite
 * Body: { token: string }
 *
 * The Triple-Check is enforced ATOMICALLY inside `fn_accept_team_invite`:
 *  1) token exists and not expired
 *  2) auth.user.email == invitations.invitee_email (case-insensitive)
 *  3) team_members.count < teams.max_seats
 * The same RPC also performs the atomic A/B operation:
 *   A) INSERT INTO team_members
 *   B) DELETE FROM team_invitations
 *
 * The HTTP layer is intentionally thin: validate input, call the RPC, translate
 * Postgres errcodes to HTTP status, and return a small JSON payload.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, getAdminClient, isAllowedOrigin, json, makeLogger, methodGuard, requireUser } from '../_lib/server.js';

interface AcceptBody { token: string }

function parseBody(body: unknown): AcceptBody {
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
    const t = (body as Record<string, unknown>).token;
    if (typeof t !== 'string' || t.length < 16 || t.length > 256) throw new HttpError(400, 'token is invalid');
    return { token: t };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('teams/accept-invite');
    res.setHeader('x-request-id', log.ctx.reqId);
    if (!methodGuard(req, res, ['POST'])) return;

    const origin = (req.headers.origin as string | undefined) ?? '';
    if (origin && !isAllowedOrigin(origin)) {
        json(res, 403, { error: 'Origin not allowed', reqId: log.ctx.reqId });
        return;
    }

    try {
        const body = parseBody(req.body);
        const user = await requireUser(req);
        if (!user.email) throw new HttpError(409, 'Authenticated session has no email');

        const admin = getAdminClient();
        const { data, error } = await admin.rpc('fn_accept_team_invite', {
            p_token: body.token,
            p_user_id: user.id,
            p_current_email: user.email,
        });

        if (error) {
            const code = (error as { code?: string }).code ?? '';
            const message = error.message ?? '';
            // Map known PL/pgSQL errcodes to HTTP statuses.
            if (code === 'P0003' || /another email/i.test(message)) {
                json(res, 409, { error: 'invitation_email_mismatch', reqId: log.ctx.reqId });
                return;
            }
            if (code === 'P0002' || /expired/i.test(message)) {
                json(res, 410, { error: 'invitation_expired', reqId: log.ctx.reqId });
                return;
            }
            if (code === 'P0001' || /not found/i.test(message)) {
                json(res, 404, { error: 'invitation_not_found', reqId: log.ctx.reqId });
                return;
            }
            if (code === 'P0004' || /max_seats/i.test(message)) {
                json(res, 409, { error: 'max_seats_reached', reqId: log.ctx.reqId });
                return;
            }
            throw error;
        }

        const row = Array.isArray(data) ? data[0] : data;
        log.info({ event: 'invite.accepted', userId: user.id, teamId: row?.team_id ?? null });
        json(res, 200, { ok: true, teamId: row?.team_id ?? null, role: row?.role ?? null, reqId: log.ctx.reqId });
    } catch (err) {
        if (err instanceof HttpError) {
            json(res, err.status, { error: err.message, reqId: log.ctx.reqId });
            return;
        }
        log.error({ event: 'accept.error', message: String((err as Error)?.message ?? err) });
        json(res, 500, { error: 'Internal error', reqId: log.ctx.reqId });
    }
}

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };
