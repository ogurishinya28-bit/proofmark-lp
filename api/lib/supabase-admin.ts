/**
 * Supabase Admin クライアント（サーバーサイド専用）
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import path from 'node:path';

// 【重要】ローカル開発環境で Vercel CLI が .env.local を読み込まない問題を強制解決
// プロジェクトのルートにある .env.local を直接読みに行きます
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

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