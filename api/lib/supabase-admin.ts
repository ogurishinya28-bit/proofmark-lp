/**
 * Supabase Admin クライアント（サーバーサイド専用）
 *
 * ⚠️ セキュリティルール（絶対遵守）:
 *   - このファイルは api/ ディレクトリ（Vercel Serverless Functions）専用
 *   - フロントエンド（client/src/）から import してはいけない
 *   - SUPABASE_SERVICE_ROLE_KEY は Vercel 環境変数にのみ設定
 *   - VITE_ プレフィックスは絶対に使用しない（ブラウザに漏洩するため）
 *
 * SERVICE_ROLE_KEY は RLS をバイパスできるため、
 * サーバーサイドの信頼済みコードでのみ使用する。
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[ProofMark Admin] Supabase 管理者用環境変数が未設定です。\n" +
      "  VITE_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を\n" +
      "  Vercel ダッシュボードの環境変数に設定してください。"
  );
}

/**
 * サーバーサイド専用 Supabase クライアント
 * RLS をバイパスして全テーブルにアクセス可能
 * ⚠️ このクライアントはサーバーサイドのみで使用すること
 */
export const supabaseAdmin = createClient(
  supabaseUrl ?? "",
  serviceRoleKey ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
