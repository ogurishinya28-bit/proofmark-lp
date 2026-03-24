/**
 * Supabase Edge Function: process-hash
 *
 * トリガー: Supabase Storage Webhook（originals バケットへのオブジェクト追加）
 *
 * 処理フロー:
 *   1. Webhook ペイロードからストレージパスを取得
 *   2. パスを split('/') して user_id を抽出
 *      例: "originals/{user_id}/{uuid}.png" → parts[1] = user_id
 *   3. Storage からファイルをダウンロード（ArrayBuffer で取得）
 *   4. crypto.subtle.digest で SHA-256 ハッシュを計算
 *   5. certificates テーブルに upsert（file_hash, storage_path, user_id, status）
 *
 * ⚠️ アーキテクチャルール:
 *   - ハッシュ計算は必ずサーバーサイド（Edge Function）で行う
 *   - user_id は storage path から確実に抽出する（NOT NULL 制約対応）
 *   - メモリ効率のために ArrayBuffer 単位でファイルを処理する
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// 環境変数
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/**
 * Supabase Storage Webhook のペイロード型
 * https://supabase.com/docs/guides/storage/webhooks
 */
interface StorageWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    bucket_id: string;
    name: string;
    owner: string | null;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string | null;
    metadata: Record<string, unknown> | null;
  };
  schema: string;
  old_record: null | Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------

/**
 * storage path から user_id を抽出する
 *
 * パス形式: "originals/{user_id}/{uuid}.{ext}"
 * → split("/") → ["originals", "{user_id}", "{uuid}.{ext}"]
 * → parts[1] = user_id
 *
 * @throws {Error} パス形式が不正で user_id を抽出できない場合
 */
function extractUserIdFromPath(storagePath: string): string {
  // パスは Webhook の record.name フィールドに格納される
  // バケット名を含む場合と含まない場合に対応
  const normalized = storagePath.startsWith("originals/")
    ? storagePath
    : `originals/${storagePath}`;

  const parts = normalized.split("/");
  // parts[0] = "originals", parts[1] = user_id, parts[2] = filename
  if (parts.length < 3 || !parts[1] || parts[1] === "anon") {
    throw new Error(
      `storage path から有効な user_id を抽出できませんでした: "${storagePath}"`
    );
  }

  const userId = parts[1];
  // UUID 形式の簡易検証（英数字・ハイフン・underscoreのみ許可）
  if (!/^[a-zA-Z0-9\-_]+$/.test(userId)) {
    throw new Error(
      `抽出した user_id が不正な形式です: "${userId}"`
    );
  }

  return userId;
}

/**
 * ArrayBuffer を hex 文字列に変換する
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// メインハンドラー
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // OPTIONS（CORS プリフライト）への対応
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 環境変数チェック ─────────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[process-hash] 環境変数 SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── Webhook ペイロード解析 ──────────────────────────────────
    const payload: StorageWebhookPayload = await req.json();

    // INSERT イベントのみ処理する
    if (payload.type !== "INSERT") {
      return new Response(
        JSON.stringify({ message: `イベントタイプ "${payload.type}" はスキップします` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // originals バケットのみ処理する
    if (payload.record.bucket_id !== "originals") {
      return new Response(
        JSON.stringify({ message: `バケット "${payload.record.bucket_id}" はスキップします` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── ストレージパスと user_id の取得 ────────────────────────
    // record.name はバケット内のパス（例: "{user_id}/{uuid}.png"）
    const objectName = payload.record.name;
    // フルパス形式: "originals/{user_id}/{uuid}.png"
    const fullStoragePath = `originals/${objectName}`;

    console.log(`[process-hash] 処理開始: ${fullStoragePath}`);

    // パスから user_id を抽出（NOT NULL 制約対応）
    const userId = extractUserIdFromPath(fullStoragePath);
    console.log(`[process-hash] user_id 抽出成功: ${userId}`);

    // ── ファイルのダウンロード ──────────────────────────────────
    // メモリ効率のため ArrayBuffer で取得する
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("originals")
      .download(objectName);

    if (downloadError || !fileData) {
      throw new Error(
        `ファイルのダウンロードに失敗しました: ${downloadError?.message ?? "不明なエラー"}`
      );
    }

    // ── SHA-256 ハッシュ計算 ────────────────────────────────────
    // Deno の Web Crypto API を使用（メモリ効率: ArrayBuffer 単位で処理）
    const fileBuffer: ArrayBuffer = await fileData.arrayBuffer();
    const hashBuffer: ArrayBuffer = await crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );
    const fileHash = bufferToHex(hashBuffer);

    console.log(`[process-hash] SHA-256 計算完了: ${fileHash}`);

    // ── certificates テーブルへ upsert ─────────────────────────
    // 同一 storage_path の既存レコードがあれば更新、なければ挿入
    const { error: upsertError } = await supabase
      .from("certificates")
      .upsert(
        {
          user_id: userId,
          file_hash: fileHash,
          storage_path: fullStoragePath,
          status: "completed" as const,
          metadata: {
            original_filename: objectName.split("/").pop() ?? objectName,
            processed_at: new Date().toISOString(),
            bucket: "originals",
          },
        },
        {
          onConflict: "storage_path",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      throw new Error(
        `certificates テーブルへの upsert に失敗しました: ${upsertError.message}`
      );
    }

    console.log(`[process-hash] DB upsert 完了: user_id=${userId}, hash=${fileHash}`);

    return new Response(
      JSON.stringify({
        success: true,
        storagePath: fullStoragePath,
        fileHash,
        userId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    console.error("[process-hash] エラー:", message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
