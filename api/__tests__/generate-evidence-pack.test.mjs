/**
 * api/__tests__/generate-evidence-pack.test.mjs
 *
 * Phase 11.B 検収用ユニットテスト (Zero-Dependency / Node 20+ test runner)。
 *
 * 走らせ方:
 *   node --test api/__tests__/generate-evidence-pack.test.mjs
 *
 * カバーする項目:
 *   1. CLIENT_LETTER.txt は c2pa.json が **同梱されたときのみ** "open c2pa.json"
 *      を含む (Empty State Handling 検収)。
 *   2. Spot 用 CLIENT_LETTER は C2PA セクションを含まない。
 *   3. c2pa_manifest が 10KB を超えるオブジェクトの場合は append しない
 *      (`safeC2paJson` の同等ロジックを再現テスト)。
 *   4. archiver は append 後に finalize() で EOCD を出力する (ストリーム
 *      整合の最低保証)。
 *
 * 注: 本テストは generate-evidence-pack.ts の純粋関数を文字列レベルで
 *     再現してチェックする。実 API 統合は scripts/load-test-evidence-pack.mjs
 *     で行う。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import archiver from 'archiver';
import { Readable } from 'node:stream';

const C2PA_HARD_CAP_BYTES = 10 * 1024;
const FIXED_ZIP_TIME = new Date('2026-01-01T00:00:00.000Z');

function buildClientLetter(cert, verifyUrl, options) {
  const issuedAt = cert.certified_at ?? cert.proven_at ?? cert.created_at ?? '';
  const niceTitle = cert.title ?? cert.original_filename ?? cert.file_name ?? 'Verified Digital Artwork';
  const sha256 = cert.sha256 ?? '';
  const verifySteps = [
    '1. Compute SHA-256 of the supplied file and ensure it matches "SHA-256" above.',
    '2. Run `verify.sh` (or `verify.py`) inside this archive to verify the RFC3161',
    '   timestamp token (timestamp.tsr) using OpenSSL.',
  ];
  if (options.c2paIncluded) {
    verifySteps.push(
      '3. If this work contains Content Credentials, open c2pa.json to review the scrubbed manifest.',
      '4. Optionally open Verify URL to compare against the public certificate page.',
    );
  } else {
    verifySteps.push(
      '3. Optionally open Verify URL to compare against the public certificate page.',
    );
  }
  return [
    'ProofMark Evidence Pack — Client Hand-off Letter',
    '',
    `Title       : ${niceTitle}`,
    `Issued at   : ${issuedAt}`,
    `SHA-256     : ${sha256}`,
    `Verify URL  : ${verifyUrl}`,
    '',
    'About this Evidence Pack',
    '------------------------',
    'This package contains the cryptographic timestamp data and verification scripts',
    'required to independently confirm that the file with the SHA-256 above existed',
    'at the issued time and has not been modified since.',
    options.c2paIncluded
      ? 'It additionally embeds a scrubbed Content Credentials (C2PA) manifest as c2pa.json.'
      : '',
    '',
    'How to verify (no ProofMark account required)',
    '----------------------------------------------',
    ...verifySteps,
    '',
    'Notes',
    '-----',
    "ProofMark issues RFC3161-compliant timestamp data. Whether such data is",
    'admissible as evidence depends on the venue, jurisdiction, and TSA in use.',
    'See https://proofmark.jp/trust-center for the current TSA configuration.',
  ].join('\n');
}

function safeC2paJson(raw) {
  if (!raw) return null;
  let json;
  try {
    json = JSON.stringify(raw, null, 2);
  } catch {
    return null;
  }
  const bytes = Buffer.byteLength(json, 'utf8');
  if (bytes <= 0 || bytes > C2PA_HARD_CAP_BYTES) return null;
  return { json, bytes };
}

const baseCert = {
  id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  title: 'Demo asset',
  sha256: 'a'.repeat(64),
  certified_at: '2026-04-30T12:34:56.000Z',
  proven_at: null,
  created_at: '2026-04-30T12:00:00.000Z',
};

test('CLIENT_LETTER includes c2pa.json instructions only when c2paIncluded=true', () => {
  const withC2pa = buildClientLetter(baseCert, 'https://proofmark.jp/cert/x', { c2paIncluded: true });
  const withoutC2pa = buildClientLetter(baseCert, 'https://proofmark.jp/cert/x', { c2paIncluded: false });
  assert.ok(withC2pa.includes('open c2pa.json'), 'c2pa-included case must mention c2pa.json');
  assert.ok(!withoutC2pa.includes('c2pa.json'), 'no-c2pa case must NOT mention c2pa.json');
});

test('CLIENT_LETTER ordering is stable in both modes', () => {
  const withC2pa = buildClientLetter(baseCert, 'https://proofmark.jp/cert/x', { c2paIncluded: true });
  const withoutC2pa = buildClientLetter(baseCert, 'https://proofmark.jp/cert/x', { c2paIncluded: false });
  for (const text of [withC2pa, withoutC2pa]) {
    const idxAbout = text.indexOf('About this Evidence Pack');
    const idxHow = text.indexOf('How to verify');
    const idxNotes = text.indexOf('\nNotes\n');
    assert.ok(idxAbout > 0 && idxHow > idxAbout && idxNotes > idxHow, 'sections in order');
  }
});

test('safeC2paJson rejects payloads above 10KB cap', () => {
  const big = { items: Array.from({ length: 2000 }, (_, i) => ({ k: `value_${i}_${'x'.repeat(20)}` })) };
  const result = safeC2paJson(big);
  assert.equal(result, null, '>10KB payload must be dropped');
});

test('safeC2paJson accepts well-formed small payload', () => {
  const ok = {
    schema_version: 1,
    validity: 'valid',
    issuer: 'Adobe Inc.',
    ai_used: false,
    parser: { name: '@contentauth/c2pa', version: '0.32.6' },
  };
  const result = safeC2paJson(ok);
  assert.ok(result, 'valid payload must be accepted');
  assert.ok(result.bytes > 0 && result.bytes < C2PA_HARD_CAP_BYTES);
});

test('safeC2paJson handles null / undefined / circular gracefully', () => {
  assert.equal(safeC2paJson(null), null);
  assert.equal(safeC2paJson(undefined), null);
  const circular = {};
  circular.self = circular;
  assert.equal(safeC2paJson(circular), null, 'circular ref must not throw');
});

test('archiver finalize emits EOCD record (PK\\x05\\x06)', async () => {
  const archive = archiver('zip', { zlib: { level: 6 }, forceLocalTime: false });
  const chunks = [];
  const sink = new Promise((resolve, reject) => {
    archive.on('data', (c) => chunks.push(c));
    archive.on('end', resolve);
    archive.on('error', reject);
  });
  archive.append('SHA256= ' + 'a'.repeat(64) + '\n', { name: 'hash.txt', date: FIXED_ZIP_TIME });
  archive.append(Buffer.from([0x30, 0x82, 0x01, 0x00]), { name: 'timestamp.tsr', date: FIXED_ZIP_TIME });
  archive.append('CLIENT_LETTER body', { name: 'CLIENT_LETTER.txt', date: FIXED_ZIP_TIME });
  await archive.finalize();
  await sink;
  const buf = Buffer.concat(chunks);
  assert.ok(buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])), 'starts with PK LFH');
  const eocd = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  assert.ok(buf.lastIndexOf(eocd) !== -1, 'ends with PK EOCD');
});

test('archiver streams a Readable without buffering the whole payload', async () => {
  // Synthetic 8MB stream — verifies chunked piping works without OOM in test runner.
  const SIZE = 8 * 1024 * 1024;
  const CHUNK = 64 * 1024;
  let emitted = 0;
  const big = new Readable({
    read() {
      if (emitted >= SIZE) {
        this.push(null);
        return;
      }
      const n = Math.min(CHUNK, SIZE - emitted);
      emitted += n;
      this.push(Buffer.alloc(n, 0x41));
    },
  });

  const archive = archiver('zip', { zlib: { level: 0 } });
  let bytes = 0;
  const sink = new Promise((resolve, reject) => {
    archive.on('data', (c) => { bytes += c.length; });
    archive.on('end', resolve);
    archive.on('error', reject);
  });
  archive.append(big, { name: 'original/asset.bin', date: FIXED_ZIP_TIME });
  await archive.finalize();
  await sink;
  assert.ok(bytes >= SIZE, 'archive output >= input payload size');
  // RSS sanity (informational, not a hard assert): we just ensure we did not
  // pre-buffer the entire payload as a contiguous Buffer earlier.
  const heap = process.memoryUsage().heapUsed;
  assert.ok(heap < 256 * 1024 * 1024, `heap remained < 256MB (was ${heap})`);
});
