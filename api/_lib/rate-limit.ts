/**
 * api/_lib/rate-limit.ts — Phase 12.3
 *
 * Free プランの月次上限を Upstash Redis で物理ロックする。
 *
 * 設計の核:
 *   1. **DB を一切叩かない**: count(*) アンチパターンを根絶。Redis の
 *      INCR がアトミックに「現在何件目」を返す唯一の真実。
 *   2. **JST 月次キー**: サーバ (UTC) と日本ユーザー (JST) の月初ズレを
 *      回避するため、キーは必ず Asia/Tokyo の YYYY_MM で生成。
 *   3. **Fail-open**: Upstash がダウンしてもサービスを止めない。Redis
 *      接続エラーは catch して `{ allowed: true, fallback: true }` を返す。
 *      この場合のみ呼び出し側が Supabase の count フォールバックに切替可。
 *   4. **Bypass for paid**: plan_tier ∈ {creator, studio, business, light, admin}
 *      は Redis にすら触れない (latency 0)。
 *   5. **TTL は 40 日**: 翌月の月初リセットで自然消滅。Cron 不要。
 *
 * このモジュールは:
 *   - Upstash REST API を `fetch` で直接叩く (新規 SDK 依存ゼロ)
 *   - 1 リクエストあたり最大 1 ラウンドトリップ (INCR + EXPIRE 同梱の pipeline)
 *   - ENV: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

import { optionalEnv } from './server.js';

export const FREE_MONTHLY_QUOTA = 30;

const PAID_TIERS: ReadonlySet<string> = new Set([
    'creator', 'studio', 'business', 'light', 'admin',
]);

const KEY_TTL_SECONDS = 40 * 24 * 60 * 60; // 40 days
const REDIS_FETCH_TIMEOUT_MS = 1500;       // hot path budget

export interface RateLimitInput {
    userId: string;
    planTier: string | null | undefined;
}

export type RateLimitResult =
    | { ok: true; bypassed: true; plan: 'paid' }
    | { ok: true; bypassed: false; used: number; remaining: number; quota: number; resetAt: string }
    | { ok: false; reason: 'quota_exceeded'; used: number; quota: number; resetAt: string }
    | { ok: true; bypassed: false; used: -1; remaining: -1; quota: number; resetAt: string; fallback: 'redis_unavailable' };

/**
 * JST 基準で「現在の月初 (00:00) → 翌月の月初 (00:00)」を計算する。
 * UTC 計算に 9 時間オフセットを足し戻すアプローチ (DST 不要なので安全)。
 */
function jstMonthRange(now = new Date()): { ym: string; resetAtIso: string } {
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
    const y = jstNow.getUTCFullYear();
    const m = jstNow.getUTCMonth(); // 0-11
    const ym = `${y}_${String(m + 1).padStart(2, '0')}`;
    // 翌月初 (JST 00:00) を UTC に戻す
    const nextMonthJstUtc = Date.UTC(y, m + 1, 1, 0, 0, 0, 0);
    const resetUtcMs = nextMonthJstUtc - JST_OFFSET_MS;
    return { ym, resetAtIso: new Date(resetUtcMs).toISOString() };
}

export function buildRateLimitKey(userId: string, ym: string): string {
    return `rate_limit:${userId}:cert_issue_${ym}`;
}

interface UpstashConfig {
    url: string;
    token: string;
}

function getUpstashConfig(): UpstashConfig | null {
    const url = optionalEnv('UPSTASH_REDIS_REST_URL');
    const token = optionalEnv('UPSTASH_REDIS_REST_TOKEN');
    if (!url || !token) return null;
    return { url, token };
}

/**
 * Pipeline で `INCR key` と `EXPIRE key 3456000 NX` を 1 ラウンドトリップ
 * で実行する。NX を付けるので、既存の TTL は上書きしない (= ユーザーの
 * 累計に影響を与えない)。
 *
 * Upstash REST `pipeline` は配列で複数コマンドを返す。
 */
async function upstashIncrementWithExpire(
    cfg: UpstashConfig,
    key: string,
): Promise<number> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error('upstash_timeout')), REDIS_FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`${cfg.url}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${cfg.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', key],
                ['EXPIRE', key, String(KEY_TTL_SECONDS), 'NX'],
            ]),
            signal: ac.signal,
        });
        if (!res.ok) {
            throw new Error(`upstash_http_${res.status}`);
        }
        const data = (await res.json()) as Array<{ result?: number; error?: string }>;
        const incrResult = data?.[0];
        if (!incrResult || typeof incrResult.result !== 'number') {
            throw new Error('upstash_unexpected_response');
        }
        return incrResult.result;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Read-only にカウントを覗く (`GET key`)。UI 用。
 * 失敗しても 0 を返してサービスは止めない。
 */
async function upstashGet(cfg: UpstashConfig, key: string): Promise<number | null> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error('upstash_timeout')), REDIS_FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${cfg.token}` },
            signal: ac.signal,
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { result?: string | number | null };
        if (data.result === null || data.result === undefined) return 0;
        const n = typeof data.result === 'number' ? data.result : Number(data.result);
        return Number.isFinite(n) ? n : 0;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * 発行直前に呼び出す。INCR を伴うので副作用あり。
 * 31 件目以降は ok:false, reason:'quota_exceeded' を返す。
 */
export async function incrementAndCheckCertIssue(
    input: RateLimitInput,
): Promise<RateLimitResult> {
    const tier = String(input.planTier ?? 'free').toLowerCase();
    if (PAID_TIERS.has(tier)) {
        return { ok: true, bypassed: true, plan: 'paid' };
    }

    const { ym, resetAtIso } = jstMonthRange();
    const key = buildRateLimitKey(input.userId, ym);
    const cfg = getUpstashConfig();

    if (!cfg) {
        // Configured-out: behave as fail-open (operator misconfig).
        return {
            ok: true,
            bypassed: false,
            used: -1,
            remaining: -1,
            quota: FREE_MONTHLY_QUOTA,
            resetAt: resetAtIso,
            fallback: 'redis_unavailable',
        };
    }

    let count: number;
    try {
        count = await upstashIncrementWithExpire(cfg, key);
    } catch {
        // Redis 故障 → サービス停止せず通す (Fail-open)
        return {
            ok: true,
            bypassed: false,
            used: -1,
            remaining: -1,
            quota: FREE_MONTHLY_QUOTA,
            resetAt: resetAtIso,
            fallback: 'redis_unavailable',
        };
    }

    if (count > FREE_MONTHLY_QUOTA) {
        return {
            ok: false,
            reason: 'quota_exceeded',
            used: count,
            quota: FREE_MONTHLY_QUOTA,
            resetAt: resetAtIso,
        };
    }

    return {
        ok: true,
        bypassed: false,
        used: count,
        remaining: FREE_MONTHLY_QUOTA - count,
        quota: FREE_MONTHLY_QUOTA,
        resetAt: resetAtIso,
    };
}

/**
 * UI 用の read-only 照会 (GET /api/cert-issue/usage).
 * 副作用なし。失敗しても sensible default を返す。
 */
export async function peekCertIssueUsage(
    input: RateLimitInput,
): Promise<{ used: number; quota: number; remaining: number; resetAt: string; bypassed: boolean }> {
    const { ym, resetAtIso } = jstMonthRange();
    const tier = String(input.planTier ?? 'free').toLowerCase();
    if (PAID_TIERS.has(tier)) {
        return { used: 0, quota: 0, remaining: Infinity as unknown as number, resetAt: resetAtIso, bypassed: true };
    }
    const cfg = getUpstashConfig();
    if (!cfg) {
        return { used: 0, quota: FREE_MONTHLY_QUOTA, remaining: FREE_MONTHLY_QUOTA, resetAt: resetAtIso, bypassed: false };
    }
    const key = buildRateLimitKey(input.userId, ym);
    const used = (await upstashGet(cfg, key)) ?? 0;
    return {
        used,
        quota: FREE_MONTHLY_QUOTA,
        remaining: Math.max(0, FREE_MONTHLY_QUOTA - used),
        resetAt: resetAtIso,
        bypassed: false,
    };
}

/**
 * 発行が DB レベルで失敗した場合に巻き戻すヘルパ (DECR).
 * INCR 後に `certificates` への INSERT が転んだ場合だけ呼ぶ。
 * 失敗しても無視 — 翌月リセットで自然回復。
 */
export async function rollbackIncrement(input: RateLimitInput): Promise<void> {
    const tier = String(input.planTier ?? 'free').toLowerCase();
    if (PAID_TIERS.has(tier)) return;
    const cfg = getUpstashConfig();
    if (!cfg) return;
    const { ym } = jstMonthRange();
    const key = buildRateLimitKey(input.userId, ym);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error('upstash_timeout')), REDIS_FETCH_TIMEOUT_MS);
    try {
        await fetch(`${cfg.url}/decr/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${cfg.token}` },
            signal: ac.signal,
        }).catch(() => undefined);
    } finally {
        clearTimeout(timer);
    }
}

// Internal exports for tests
export const __test__ = { jstMonthRange };
