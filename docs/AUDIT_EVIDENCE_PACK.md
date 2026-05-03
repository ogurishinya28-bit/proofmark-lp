# Phase 11.B — Evidence Pack 静的監査レポート

対象: `api/generate-evidence-pack.ts` (Phase 11.B 改修版)
評価軸: Memory Leak Guard / Empty State Handling / Client Letter 動的生成

## 1. メモリ経路マップ (heap allocation のすべて)

| 経路 | サイズ上限 | heap に常駐するか | 備考 |
|------|------------|----------------|------|
| `hash.txt` | < 100B | 一時 string | `archive.append(string, ...)` 直後に gc 候補 |
| `timestamp.tsr` (auth) | 通常 ≤ 2KB | 一時 Buffer | DB の base64 を `Buffer.from(...)` で 1 度だけ確保 |
| `c2pa.json` | ≤ 10KB | 一時 string | `safeC2paJson` で再検証してから append |
| `CLIENT_LETTER.txt` | 数 KB | 一時 string | 動的構築 (c2pa 有無で本文差分) |
| `verify.sh` / `verify.py` | < 4KB 各 | 一時 string | 静的テンプレ |
| `metadata.json` | < 2KB | 一時 string | DB の小さなフィールドだけ |
| `original/<file>` | 任意 (実体は数十 MB 想定) | **None** | `Readable.fromWeb(...)` で **stream**。Buffer 化しない |
| `freetsa-ca.crt` / `tsa.crt` | 各数 KB | 一時 Buffer (process キャッシュ) | `tsaCaCache` で 6h 共有 |

結論: heap に「同時に」滞留する最大量は、おおよそ
`tsr (2KB) + c2pa.json (10KB) + CA pair (~10KB) + metadata/letter (4KB) ≈ 30KB`。
原画はストリーム経由で archiver の zlib 圧縮ウィンドウに乗るだけで、Vercel Node の 1024MB 上限に対し 4 桁オーダーの余裕がある。

## 2. OOM 経路チェックリスト

- [x] `Buffer.concat`、`response.arrayBuffer()`、`stream.toArray()` のいずれも使っていない
- [x] 原画は `Readable.fromWeb(fetch.body)` でストリーム結合 (`archive.append(stream, …)`)
- [x] TSA CA バンドルは process 内 1 エントリ TTL キャッシュで重複 fetch を抑止
- [x] c2pa.json は DB 制約 (10KB) と server 側 `safeC2paJson` の二重ガード
- [x] `archiver.zlib.level: 6` (デフォルト)、`highWaterMark` は触らない
- [x] エラー時 / `res.close` 時はすべての upstream を AbortController で中断

## 3. Empty State Handling

### 3.1 C2PA を含まない画像

- DB の `c2pa_manifest` が `null` の場合、`safeC2paJson(null)` は `null` を返す
- `c2paIncluded = false` で `CLIENT_LETTER.txt` が「`open c2pa.json` を含まない 3 ステップ手順」に動的整形される
- `c2pa.json` は ZIP に **同梱されない**
- 既存の `hash.txt` / `timestamp.tsr` / `verify.sh` / `verify.py` / `metadata.json` フローは無修正

ユニットテスト `CLIENT_LETTER includes c2pa.json instructions only when c2paIncluded=true` で常時担保。

### 3.2 c2pa_manifest が >10KB の異常データ

- `safeC2paJson` が `null` を返し、`c2paIncluded = false` で扱う
- ZIP は通常の RFC3161 のみで成立する (アーカイブが壊れない)
- ログに `evidence-pack.c2pa_attached` が**出ない** = 監視で異常検知可能

### 3.3 `timestamp_token` が無い

- `timestamp.MISSING.txt` で「未発行」と明示。CLIENT_LETTER の検証手順は変更されない

### 3.4 Spot 経路 (常に C2PA なし)

- `buildSpotClientLetter(false)` を使用、C2PA 文言は混入しない
- Spot 用 `metadata.json` も `c2pa_present: false` を明示

## 4. Client Letter 動的生成の検証ポイント

| 入力 | 出力に "open c2pa.json" を含むか |
|------|----------------------------------|
| `cert.c2pa_manifest = null` | ✗ (含まない) |
| `cert.c2pa_manifest = {valid manifest, ≤10KB}` | ✓ |
| `cert.c2pa_manifest = {valid manifest, >10KB}` | ✗ (DB ガードと server ガードで安全側に倒す) |
| Spot flow | ✗ |

→ ユニットテストで pass を確認。

## 5. ストリーム整合性 (壊れた ZIP を返さないこと)

- `archive.on('error')` で upstream を中断し、ヘッダ未送出なら `500`、送出済みなら `res.end()` で安全に閉じる
- `res.on('close')` で client disconnect を検知し、`archive.abort()` + upstream `AbortController.abort()`
- `archive.finalize()` 後に `PK\x05\x06` (EOCD) が必ず出力されることをユニットテストで検証
- `scripts/load-test-evidence-pack.mjs` で 100 並列時の Local File Header / EOCD 同時整合性を計測

## 6. 残課題と非スコープ

- C2PA の発行・署名は引き続き **完全スコープ外**
- Vercel Edge Runtime 化は不要 (Node のストリーミングが Edge より優位)
- archiver は CPU バウンドな zlib 圧縮を行う。並列 100 を超える場合は別インスタンスへ分散する想定 (現アーキで対応可)

## 7. 監視に追加すべきログイベント

- `evidence-pack.streamed` (既存)
- `evidence-pack.c2pa_attached` (新設、`bytes` 付き)
- `evidence-pack.client_disconnect` (新設、socket starve 検知)
- `auth.original_stream_failed` (新設、画像取得失敗時)
- `spot.tsr_missing` (既存、メッセージ拡充)
