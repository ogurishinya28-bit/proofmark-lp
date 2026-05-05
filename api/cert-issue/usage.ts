/**
 * GET /api/cert-issue/usage — Phase 12.3 UI 連携
 *
 * UI が「あと X 件」「Warning 表示 (>=25)」「上限到達 (>=30)」を判断するために、
 * 副作用なしで現在の使用数を返す read-only エンドポイント。
 *
 *  - Free 以外は `bypassed: true` を返し、UI は数字を一切出さない。
 *  - Redis 不通の場合も 200 を返す (used:0, fallback:true)。
 *  - サーバの 429 応答が真。UI のローカルカウントはあくまで予測値。
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    HttpError,
    getAdminClient,
    json,
    makeLogger,
    methodGuard,
    requireUser,
} from '../_lib/server.js';
import { peekCertIssueUsage } from '../_lib/rate-limit.js';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('cert-issue/usage');
    res.setHeader('x-request-id', log.ctx.reqId);

    if (!methodGuard(req, res, ['GET'])) return;

    try {
        const user = await requireUser(req);
        const admin = getAdminClient();
        const { data: profile } = await admin
            .from('profiles')
            .select('plan_tier')
            .eq('id', user.id)
            .maybeSingle();
        const planTier = (profile?.plan_tier ?? 'free') as string;

        const usage = await peekCertIssueUsage({ userId: user.id, planTier });
        // edge cache 無効。常に最新を返す。
        res.setHeader('Cache-Control', 'private, no-store');
        return json(res, 200, {
            planTier,
            used: usage.used,
            quota: usage.quota,
            remaining: Number.isFinite(usage.remaining) ? usage.remaining : null,
            resetAt: usage.resetAt,
            bypassed: usage.bypassed,
            reqId: log.ctx.reqId,
        });
    } catch (err) {
        if (err instanceof HttpError) {
            return json(res, err.status, { error: err.message, reqId: log.ctx.reqId });
        }
        log.error({ event: 'usage.error', message: String((err as Error)?.message ?? err) });
        return json(res, 500, { error: 'internal_error', reqId: log.ctx.reqId });
    }
}
