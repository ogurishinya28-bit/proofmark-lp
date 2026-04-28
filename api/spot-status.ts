/**
 * GET /api/spot-status?sid=<stripe_checkout_session_id>
 *
 * Polled by /spot-issue/result. Returns minimal spot order status without
 * exposing PII unnecessarily. Service-role read; never expose anon read on the table.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminClient, json, makeLogger, methodGuard } from './_lib/server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('spot-status');
    res.setHeader('x-request-id', log.ctx.reqId);

    if (!methodGuard(req, res, ['GET'])) return;

    const sid = (req.query.sid as string | undefined) ?? '';
    if (!sid) {
        json(res, 400, { error: 'sid is required', reqId: log.ctx.reqId });
        return;
    }

    const admin = getAdminClient();
    const { data, error } = await admin
        .from('spot_orders')
        .select('staging_id, status, sha256, paid_at, email')
        .eq('stripe_session_id', sid)
        .maybeSingle();

    if (error) {
        log.error({ event: 'spot-status.error', message: error.message });
        json(res, 500, { error: 'Internal error', reqId: log.ctx.reqId });
        return;
    }
    if (!data) {
        json(res, 404, { error: 'Not found', reqId: log.ctx.reqId });
        return;
    }

    res.setHeader('Cache-Control', 'no-store');
    json(res, 200, {
        status: data.status,
        staging_id: data.staging_id,
        paid_at: data.paid_at,
        email: data.email,
        sha256: data.sha256,
    });
}
