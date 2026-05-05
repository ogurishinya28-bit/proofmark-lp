/**
 * POST /api/cert-issue — Phase 12.3 物理ロック対応版
 *
 * 設計思想:
 *   1. 認証 (requireUser) → 入力検証 → **Redis INCR (Free のみ)** →
 *      INSERT certificates → 監査ログ。これ以外の順序を許さない。
 *   2. plan_tier は profiles から 1 度だけ取得し、結果をキャッシュ変数で
 *      持ち回す (DB 往復を最小化)。
 *   3. INCR の戻り値が 31 以上なら、`certificates` テーブルへの SELECT も
 *      INSERT も**一切**実行しない。これが Phase 12.3 の検収条件の核。
 *   4. INSERT が転んだ場合のみ DECR で巻き戻す (rollbackIncrement)。
 *      INSERT 成功後にここで例外が出ても DECR しない (= サーバが二重請求
 *      しないために、API としては「課金済み」を真とする)。
 *   5. 既存の `server.ts` の HttpError / methodGuard / json を踏襲。
 *
 * 注意:
 *   - C2PA manifest や file_hash 等の細部は既存 create.ts に準拠する。
 *     本ファイルはレートリミット注入の「型」を示すレファレンス。
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    HttpError,
    getAdminClient,
    json,
    makeLogger,
    methodGuard,
    requireUser,
} from './_lib/server.js';
import {
    FREE_MONTHLY_QUOTA,
    incrementAndCheckCertIssue,
    rollbackIncrement,
} from './_lib/rate-limit.js';

export const config = { maxDuration: 30 };

const HEX64 = /^[0-9a-f]{64}$/i;

interface CertIssueBody {
    sha256: string;
    title?: string;
    proofMode?: 'private' | 'shareable';
    visibility?: 'private' | 'unlisted' | 'public';
    metadataJson?: string;
}

function parseBody(raw: unknown): CertIssueBody | null {
    if (!raw || typeof raw !== 'object') return null;
    const b = raw as Record<string, unknown>;
    if (typeof b.sha256 !== 'string' || !HEX64.test(b.sha256)) return null;
    return {
        sha256: b.sha256.toLowerCase(),
        title: typeof b.title === 'string' ? b.title.slice(0, 200) : undefined,
        proofMode: b.proofMode === 'shareable' ? 'shareable' : 'private',
        visibility:
            b.visibility === 'public' ? 'public' :
            b.visibility === 'unlisted' ? 'unlisted' : 'private',
        metadataJson: typeof b.metadataJson === 'string' ? b.metadataJson.slice(0, 4096) : undefined,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const log = makeLogger('cert-issue');
    res.setHeader('x-request-id', log.ctx.reqId);

    if (!methodGuard(req, res, ['POST'])) return;

    try {
        const user = await requireUser(req);
        const body = parseBody(req.body);
        if (!body) throw new HttpError(400, 'invalid_body');

        const admin = getAdminClient();

        // 1) plan_tier を 1 回だけ取得
        const { data: profile, error: profileErr } = await admin
            .from('profiles')
            .select('plan_tier')
            .eq('id', user.id)
            .maybeSingle();
        if (profileErr) throw new HttpError(500, `profile_lookup_failed:${profileErr.message}`);
        const planTier = (profile?.plan_tier ?? 'free') as string;

        // 2) Redis INCR (Free のみ)。ここを通過しない限り DB は触らない。
        const gate = await incrementAndCheckCertIssue({ userId: user.id, planTier });
        if (gate.ok === false) {
            log.info({
                event: 'cert-issue.quota_blocked',
                userId: user.id,
                used: gate.used,
                quota: gate.quota,
            });
            res.setHeader('X-RateLimit-Limit', String(gate.quota));
            res.setHeader('X-RateLimit-Remaining', '0');
            res.setHeader('X-RateLimit-Reset', gate.resetAt);
            // 429 が真。クライアントはこれを受けて UpgradeModal を必ずマウントする。
            return json(res, 429, {
                error: 'quota_exceeded',
                used: gate.used,
                quota: gate.quota,
                resetAt: gate.resetAt,
                upgrade: { plan: 'creator', href: '/pricing#creator' },
                reqId: log.ctx.reqId,
            });
        }

        if ('used' in gate && gate.used > 0) {
            res.setHeader('X-RateLimit-Limit', String(gate.quota));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, gate.remaining)));
            if ('resetAt' in gate) res.setHeader('X-RateLimit-Reset', gate.resetAt);
        }

        // 3) DB への INSERT (Redis 通過後にだけ実行)
        const { data: inserted, error: insertErr } = await admin
            .from('certificates')
            .insert({
                user_id: user.id,
                sha256: body.sha256,
                title: body.title ?? null,
                proof_mode: body.proofMode,
                visibility: body.visibility,
                metadata: body.metadataJson ? safeJsonParse(body.metadataJson) : null,
            })
            .select('id, sha256, created_at')
            .single();

        if (insertErr || !inserted) {
            // INSERT が転んだ → INCR を巻き戻して整合させる
            await rollbackIncrement({ userId: user.id, planTier });
            throw new HttpError(500, `insert_failed:${insertErr?.message ?? 'unknown'}`);
        }

        log.info({
            event: 'cert-issue.created',
            userId: user.id,
            certId: inserted.id,
            usedAfter: 'used' in gate ? gate.used : null,
        });

        return json(res, 201, {
            certificate: inserted,
            quota: 'used' in gate
                ? { used: gate.used, remaining: Math.max(0, gate.remaining), quota: gate.quota }
                : { used: null, remaining: null, quota: FREE_MONTHLY_QUOTA, bypassed: true },
            reqId: log.ctx.reqId,
        });
    } catch (err) {
        if (err instanceof HttpError) {
            return json(res, err.status, { error: err.message, reqId: log.ctx.reqId });
        }
        log.error({ event: 'cert-issue.error', message: String((err as Error)?.message ?? err) });
        return json(res, 500, { error: 'internal_error', reqId: log.ctx.reqId });
    }
}

function safeJsonParse(s: string): Record<string, unknown> | null {
    try {
        const v = JSON.parse(s);
        return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}
