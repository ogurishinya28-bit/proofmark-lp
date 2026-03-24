/**
 * Vercel Serverless Function: 署名付きアップロードURL 発行 API
 *
 * Endpoint: POST /api/upload-url
 *
 * リクエストボディ:
 *   { "filename": "artwork.png", "contentType": "image/png", "userId": "uuid" }
 *
 * 処理フロー:
 *   1. リクエスト検証（ファイル名・ContentType）
 *   2. Supabase Storage の "originals" バケットに署名付きURLを発行（有効期間 300秒）
 *   3. クライアントが直接 Storage へ PUT アップロードできるURLを返す
 *
 * ⚠️ アーキテクチャルール（絶対遵守）:
 *   - このエンドポイントは URL の発行のみを行う
 *   - 画像ファイルの中身はこの Vercel Function を経由しない（Direct Upload）
 *   - SUPABASE_SERVICE_ROLE_KEY はサーバーサイドのみで使用
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./lib/supabase-admin";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// 許可する MIME タイプ
// ---------------------------------------------------------------------------

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const SIGNED_URL_EXPIRES_IN_SECONDS = 300;

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface UploadUrlRequest {
  filename: string;
  contentType: string;
  /** 認証済みユーザーのUUID。未認証時は "anon" を指定 */
  userId?: string;
}

interface UploadUrlResponse {
  success: boolean;
  /** Supabase Storage への直接 PUT 用署名付きURL */
  signedUrl?: string;
  /** アップロード後に DB 参照や Edge Function が使用するストレージパス */
  storagePath?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

/**
 * ファイル名から拡張子を安全に取得する
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "bin";
  const ext = parts[parts.length - 1]?.toLowerCase() ?? "bin";
  // 英数字のみ許可（パストラバーサル対策）
  return /^[a-z0-9]+$/.test(ext) ? ext : "bin";
}

// ---------------------------------------------------------------------------
// メインハンドラー
// ---------------------------------------------------------------------------

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // POST のみ許可
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are supported",
    });
  }

  try {
    const {
      filename,
      contentType,
      userId = "anon",
    } = req.body as UploadUrlRequest;

    // ── バリデーション ──────────────────────────────────────────
    if (!filename || typeof filename !== "string") {
      return res.status(400).json({
        success: false,
        error: "filename は必須です",
      });
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({
        success: false,
        error: `許可されていない ContentType です。許可: ${[...ALLOWED_CONTENT_TYPES].join(", ")}`,
      });
    }

    // userId の簡易サニタイズ（英数字・ハイフン・underscoreのみ）
    const safeUserId = /^[a-zA-Z0-9\-_]+$/.test(userId) ? userId : "anon";

    // ── ストレージパス生成 ───────────────────────────────────────
    // 形式: originals/{user_id}/{uuid}.{ext}
    // Edge Function はこのパスから user_id を split('/') で抽出する
    const ext = getExtension(filename);
    const uuid = randomUUID();
    const storagePath = `${safeUserId}/${uuid}.${ext}`;

    // ── Supabase Storage 署名付きURL 発行 ───────────────────────
    const { data, error } = await supabaseAdmin.storage
      .from("originals")
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data) {
      console.error("[upload-url] Supabase createSignedUploadUrl error:", error);
      return res.status(500).json({
        success: false,
        error: "署名付きURLの発行に失敗しました",
      });
    }

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      storagePath: `originals/${storagePath}`,
    });
  } catch (err) {
    console.error("[upload-url] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
