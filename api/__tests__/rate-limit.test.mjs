/**
 * api/__tests__/rate-limit.test.mjs
 *
 * Phase 12.3 Rate Limit ロジックのユニットテスト (Node 20+ / Zero-Dep)。
 *
 * 走らせ方:
 *   node --test api/__tests__/rate-limit.test.mjs
 *
 * カバー項目:
 *   1. JST 月初リセット計算が UTC オフセット 9h を吸収する。
 *   2. 月の境界 (UTC 月末 15:00 = JST 翌月 00:00) で ym が翌月に切替わる。
 *   3. 12月 → 1月 をまたいだロールオーバー計算。
 *   4. Key 生成のフォーマット (`rate_limit:<uid>:cert_issue_YYYY_MM`)。
 *   5. JST 月内の任意点で resetAt が翌月 1日 00:00 (JST) を指す。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// 検証用に同じロジックを再現 (副作用のない pure 関数)
function jstMonthRange(now) {
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
    const y = jstNow.getUTCFullYear();
    const m = jstNow.getUTCMonth();
    const ym = `${y}_${String(m + 1).padStart(2, '0')}`;
    const nextMonthJstUtc = Date.UTC(y, m + 1, 1, 0, 0, 0, 0);
    const resetUtcMs = nextMonthJstUtc - JST_OFFSET_MS;
    return { ym, resetAtIso: new Date(resetUtcMs).toISOString() };
}

function buildKey(userId, ym) {
    return `rate_limit:${userId}:cert_issue_${ym}`;
}

test('JST month range — typical mid-month UTC time', () => {
    // 2026-05-15 03:00 UTC = 2026-05-15 12:00 JST → ym = 2026_05
    const r = jstMonthRange(new Date('2026-05-15T03:00:00.000Z'));
    assert.equal(r.ym, '2026_05');
    // resetAt = 2026-05-31 15:00 UTC (= 2026-06-01 00:00 JST)
    assert.equal(r.resetAtIso, '2026-05-31T15:00:00.000Z');
});

test('UTC month-end 15:00 → JST already next month', () => {
    // 2026-05-31 15:00 UTC = 2026-06-01 00:00 JST → ym = 2026_06
    const r = jstMonthRange(new Date('2026-05-31T15:00:00.000Z'));
    assert.equal(r.ym, '2026_06');
    assert.equal(r.resetAtIso, '2026-06-30T15:00:00.000Z');
});

test('UTC month-end 14:59 → JST still current month', () => {
    // JST 2026-05-31 23:59 → ym = 2026_05 (まだ5月扱い)
    const r = jstMonthRange(new Date('2026-05-31T14:59:00.000Z'));
    assert.equal(r.ym, '2026_05');
    assert.equal(r.resetAtIso, '2026-05-31T15:00:00.000Z');
});

test('December → January rollover', () => {
    // 2026-12-31 16:00 UTC = 2027-01-01 01:00 JST → ym = 2027_01
    const r = jstMonthRange(new Date('2026-12-31T16:00:00.000Z'));
    assert.equal(r.ym, '2027_01');
    assert.equal(r.resetAtIso, '2027-01-31T15:00:00.000Z');
});

test('Key format is stable', () => {
    const key = buildKey('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '2026_05');
    assert.equal(key, 'rate_limit:aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa:cert_issue_2026_05');
});

test('First day of JST month uses correct ym', () => {
    // 2026-04-30 15:00 UTC = 2026-05-01 00:00 JST → ym = 2026_05
    const r = jstMonthRange(new Date('2026-04-30T15:00:00.000Z'));
    assert.equal(r.ym, '2026_05');
});

test('Leap year February → March (2028)', () => {
    // 2028-02-29 12:00 UTC → JST 21:00 → ym=2028_02
    const a = jstMonthRange(new Date('2028-02-29T12:00:00.000Z'));
    assert.equal(a.ym, '2028_02');
    assert.equal(a.resetAtIso, '2028-02-29T15:00:00.000Z');
    // boundary: 2028-02-29 15:00 UTC → 2028-03-01 00:00 JST
    const b = jstMonthRange(new Date('2028-02-29T15:00:00.000Z'));
    assert.equal(b.ym, '2028_03');
});
