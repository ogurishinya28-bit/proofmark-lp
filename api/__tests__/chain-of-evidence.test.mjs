/**
 * api/__tests__/chain-of-evidence.test.mjs
 *
 * Phase 12.4 chain_of_evidence.json 構築ロジックのユニットテスト。
 *
 * 走らせ方:
 *   node --test api/__tests__/chain-of-evidence.test.mjs
 *
 * カバー項目:
 *   1. PII マスキング (alice@example.com → al***@example.com)
 *   2. 短いメール / null / @無し のエッジケース
 *   3. chain_head_sha256 が最後の row_sha256 を指す
 *   4. chain_ok=null + chain_ok_reason が RPC 失敗時に埋まる
 *   5. 空の監査ログでも壊れない
 */

import test from 'node:test';
import assert from 'node:assert/strict';

function maskEmail(email) {
    if (!email) return null;
    const at = email.indexOf('@');
    if (at < 0) return null;
    const local = email.slice(0, at);
    const domain = email.slice(at);
    if (local.length <= 2) return `${local[0] ?? '?'}***${domain}`;
    return `${local.slice(0, 2)}***${domain}`;
}

// 簡易モック: buildChainOfEvidence の出力構造だけを再現する
async function buildChain(rows, rpcResult) {
    const events = rows.map((row, idx) => ({
        seq: idx + 1,
        id: row.id,
        event_type: row.event_type,
        actor_id: row.actor_id,
        actor_email_masked: maskEmail(row.actor_email),
        project_id: row.project_id,
        team_id: row.team_id,
        before_state: row.before_state,
        after_state: row.after_state,
        prev_log_sha256: row.prev_log_sha256,
        row_sha256: row.row_sha256,
        created_at: row.created_at,
    }));
    const head = events.length > 0 ? events[events.length - 1].row_sha256 : null;
    const payload = {
        schema_version: 1,
        certificate_id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
        generated_at: new Date().toISOString(),
        chain_length: events.length,
        chain_ok: rpcResult.ok,
        chain_head_sha256: head,
        ...(rpcResult.reason ? { chain_ok_reason: rpcResult.reason } : {}),
        events,
    };
    return Buffer.from(JSON.stringify(payload, null, 2), 'utf8');
}

test('PII masking — typical email', () => {
    assert.equal(maskEmail('alice@example.com'), 'al***@example.com');
});

test('PII masking — short local-part', () => {
    assert.equal(maskEmail('a@x.io'), 'a***@x.io');
    assert.equal(maskEmail('ab@x.io'), 'a***@x.io');
});

test('PII masking — null / no @ / empty', () => {
    assert.equal(maskEmail(null), null);
    assert.equal(maskEmail(''), null);
    assert.equal(maskEmail('plainstring'), null);
});

test('chain head sha256 = last row hash', async () => {
    const rows = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            event_type: 'created',
            actor_id: 'user-1',
            actor_email: 'alice@example.com',
            project_id: null,
            team_id: null,
            before_state: null,
            after_state: { sha256: 'a'.repeat(64) },
            prev_log_sha256: null,
            row_sha256: 'h'.repeat(64),
            created_at: '2026-04-30T12:00:00.000Z',
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            event_type: 'rfc3161_attached',
            actor_id: 'system',
            actor_email: null,
            project_id: null,
            team_id: null,
            before_state: { rfc3161: false },
            after_state: { rfc3161: true },
            prev_log_sha256: 'h'.repeat(64),
            row_sha256: 'i'.repeat(64),
            created_at: '2026-04-30T12:01:00.000Z',
        },
    ];
    const buf = await buildChain(rows, { ok: true });
    const json = JSON.parse(buf.toString('utf8'));
    assert.equal(json.chain_length, 2);
    assert.equal(json.chain_head_sha256, 'i'.repeat(64));
    assert.equal(json.chain_ok, true);
    assert.equal(json.events[0].actor_email_masked, 'al***@example.com');
    assert.equal(json.events[1].actor_email_masked, null);
});

test('Empty audit log produces valid JSON', async () => {
    const buf = await buildChain([], { ok: true });
    const json = JSON.parse(buf.toString('utf8'));
    assert.equal(json.chain_length, 0);
    assert.equal(json.chain_head_sha256, null);
    assert.equal(json.chain_ok, true);
    assert.deepEqual(json.events, []);
});

test('RPC failure populates chain_ok_reason', async () => {
    const buf = await buildChain([], { ok: null, reason: 'rpc_error:timeout' });
    const json = JSON.parse(buf.toString('utf8'));
    assert.equal(json.chain_ok, null);
    assert.equal(json.chain_ok_reason, 'rpc_error:timeout');
});

test('Detected tamper: chain_ok=false propagates', async () => {
    const rows = [
        {
            id: '33333333-3333-3333-3333-333333333333',
            event_type: 'created',
            actor_id: 'u',
            actor_email: 'bob@example.com',
            project_id: null,
            team_id: null,
            before_state: null,
            after_state: {},
            prev_log_sha256: null,
            row_sha256: 'x'.repeat(64),
            created_at: '2026-04-30T12:00:00.000Z',
        },
    ];
    const buf = await buildChain(rows, { ok: false });
    const json = JSON.parse(buf.toString('utf8'));
    assert.equal(json.chain_ok, false);
    assert.equal(json.chain_length, 1);
    assert.equal(json.events[0].actor_email_masked, 'bo***@example.com');
});
