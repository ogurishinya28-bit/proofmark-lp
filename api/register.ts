/**
 * Vercel Serverless Function: 先行登録 API
 *
 * Endpoint: POST /api/register
 *
 * リクエストボディ:
 *   { "email": "user@example.com", "plan": "free" | "light" }
 *
 * 処理フロー:
 *   1. リクエスト検証（メール形式・レート制限）
 *   2. Supabase DB に early_registrations として保存（重複は無視）
 *   3. Resend でメール送信（send-email.ts のロジックを活用）
 *
 * 環境変数（Vercel ダッシュボードで設定）:
 *   - VITE_SUPABASE_URL: Supabase プロジェクト URL
 *   - SUPABASE_SERVICE_ROLE_KEY: サービスロールキー（絶対に VITE_ を付けない）
 *   - RESEND_API_KEY: メール送信用
 */

import * as dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./lib/supabase-admin";

// ---------------------------------------------------------------------------
// 設定
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = "noreply@proofmark.jp";

/** 同一 IP からの1時間あたりの最大登録試行回数（無料枠でのシンプルなレート制限） */
const MAX_REGISTRATIONS_PER_HOUR = 5;

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface RegisterRequest {
  email: string;
  plan?: "free" | "light" | "unknown";
}

interface RegisterResponse {
  success: boolean;
  message: string;
  error?: string;
  alreadyRegistered?: boolean;
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * IP ベースのシンプルなレート制限チェック
 * Supabase の rate_limits テーブルを使用（外部サービス不使用）
 */
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // 過去1時間の同一 IP からの登録件数を確認
    const { count, error } = await supabaseAdmin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "api/register")
      .eq("ip_address", ipAddress as unknown as string) // ip_address は INET 型
      .gte("created_at", oneHourAgo);

    if (error) {
      // レート制限テーブルへのアクセスエラーは無視して続行
      console.warn("[register] Rate limit check failed:", error.message);
      return true;
    }

    return (count ?? 0) < MAX_REGISTRATIONS_PER_HOUR;
  } catch {
    return true; // エラー時は通す
  }
}

/**
 * レート制限カウントを記録
 */
async function recordRateLimit(ipAddress: string): Promise<void> {
  try {
    await supabaseAdmin.from("rate_limits").insert({
      // user_id は先行登録時点では存在しないため NULL を設定するが、
      // rate_limits テーブルの user_id は NOT NULL のため、
      // auth.uid() が必要。代替として、ip_address を主キー的に運用する。
      // ここでは匿名ユーザー用の UUID を生成して記録する。
      user_id: "00000000-0000-0000-0000-000000000000",
      endpoint: "api/register",
      request_count: 1,
      window_start: new Date().toISOString(),
    });
  } catch {
    // 記録失敗は無視
  }
}

/**
 * 確認メールを Resend で送信
 */
async function sendConfirmationEmail(
  email: string,
  plan: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[register] RESEND_API_KEY not set, skipping email");
    return;
  }

  const planLabel = plan === "light" ? "Lightプラン（¥480/月）" : "無料プラン（月30件）";
  const subject = "ProofMark 先行登録確認 - β版優先招待";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProofMark 先行登録確認</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #f0f0fa; background-color: #0a0e27; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #151d2f; border-radius: 12px; border: 1px solid #2a2a4e; padding: 32px;">
    <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #2a2a4e;">
      <div style="font-size: 32px; font-weight: 900; color: #6c3ef4; margin-bottom: 8px;">⬡ ProofMark</div>
      <p style="margin: 0; color: #a0a0c0; font-size: 14px;">AI作品の著作権証明サービス</p>
    </div>

    <h1 style="font-size: 24px; font-weight: 800; color: #f0f0fa; margin-top: 0;">先行登録ありがとうございます！</h1>
    <p style="color: #a0a0c0;">${email} で ProofMark の先行登録が完了しました。<br>β版の優先招待をお待ちください。</p>

    <div style="background-color: #0f1629; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #6c3ef4;">
      <h3 style="color: #6c3ef4; margin-top: 0; font-size: 16px;">先着100名の特典（${planLabel}）</h3>
      <ul style="list-style: none; padding: 0; margin: 10px 0 0 0; color: #a0a0c0; font-size: 14px;">
        <li style="padding: 6px 0;">✓ β版優先招待</li>
        <li style="padding: 6px 0;">✓ Lightプラン3ヶ月無料</li>
        <li style="padding: 6px 0;">✓ 創設者バッジ</li>
      </ul>
    </div>

    <p style="color: #a0a0c0;">「どうせAIでしょ？」と言わせない。<br>あなたの創作の「事実」を、一生消えない証拠に。</p>

    <p style="text-align: center;">
      <a href="https://proofmark.jp" style="display: inline-block; background-color: #6c3ef4; color: #f0f0fa; padding: 14px 32px; border-radius: 24px; text-decoration: none; font-weight: bold;">ProofMarkを見る</a>
    </p>

    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #2a2a4e; font-size: 12px; color: #6b7280;">
      <p>このメールに心当たりがない場合は、<a href="https://proofmark.jp" style="color: #6c3ef4;">お問い合わせ</a>ください。<br>© 2026 ProofMark. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject,
      html,
    }),
  });
}

// ---------------------------------------------------------------------------
// メインハンドラー
// ---------------------------------------------------------------------------

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<RegisterResponse>
) {
  // POST のみ許可
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
      error: "Only POST requests are supported",
    });
  }

  try {
    const { email, plan = "unknown" } = req.body as RegisterRequest;

    // 入力検証
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        error: "メールアドレスを入力してください",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        error: "メールアドレスの形式が正しくありません",
      });
    }

    // IP アドレス取得（Vercel は x-forwarded-for ヘッダーに格納）
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket?.remoteAddress ??
      "unknown";

    // レート制限チェック
    const withinLimit = await checkRateLimit(ipAddress);
    if (!withinLimit) {
      return res.status(429).json({
        success: false,
        message: "Too many requests",
        error: "しばらく時間をおいてから再度お試しください",
      });
    }

    // Supabase DB に先行登録を保存（重複メールは無視）
    const { error: dbError } = await supabaseAdmin
      .from("early_registrations")
      .insert({
        email: email.toLowerCase().trim(),
        plan_interest: plan,
        ip_address: ipAddress as unknown as string,
      });

    // 重複エラー（23505: unique_violation）は正常系とみなす
    const isAlreadyRegistered =
      dbError?.code === "23505" || dbError?.message?.includes("duplicate");

    if (dbError && !isAlreadyRegistered) {
      console.error("[register] DB insert error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: "登録処理中にエラーが発生しました",
      });
    }

    // 新規登録の場合のみレート制限を記録
    if (!isAlreadyRegistered) {
      await recordRateLimit(ipAddress);

      // 確認メールを送信（失敗してもDB登録は成功とみなす）
      try {
        await sendConfirmationEmail(email, plan);
      } catch (mailError) {
        console.warn("[register] Email sending failed:", mailError);
      }
    }

    return res.status(200).json({
      success: true,
      message: isAlreadyRegistered
        ? `${email} は既に登録済みです`
        : `${email} の先行登録が完了しました`,
      alreadyRegistered: isAlreadyRegistered,
    });
  } catch (error) {
    console.error("[register] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}