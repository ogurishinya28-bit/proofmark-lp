/**
 * Vercel Serverless Function: 証明書データ保存 API
 *
 * Endpoint: POST /api/save-certificate
 *
 * 処理フロー:
 * 1. クライアントからアップロード完了後の storagePath を受け取る
 * 2. Supabase Storage からファイルを一時的にメモリへダウンロード
 * 3. サーバーサイドで安全に SHA-256 ハッシュを計算（改ざん防止）
 * 4. certificates テーブルにメタデータを保存
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as dotenv from 'dotenv';
import path from 'node:path';
import { createHash } from 'node:crypto';

// 恒例の環境変数強制ロード
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { supabaseAdmin } from "./lib/supabase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // POST のみ許可
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Only POST allowed" });
    }

    try {
        const { storagePath, userId = "anon" } = req.body;

        if (!storagePath) {
            return res.status(400).json({ success: false, error: "storagePath は必須です" });
        }

        // クライアントから "originals/xxx/yyy.ext" と送られてくる場合を考慮し、
        // ダウンロード用にバケット名（originals/）を取り除く
        const filePath = storagePath.startsWith("originals/")
            ? storagePath.replace("originals/", "")
            : storagePath;

        // ── 1. Storage からファイルをダウンロード ──────────────────────────
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from("originals")
            .download(filePath);

        if (downloadError || !fileData) {
            console.error("[save-certificate] Download error:", downloadError);
            return res.status(500).json({ success: false, error: "ストレージからのファイル取得に失敗しました" });
        }

        // ── 2. SHA-256 ハッシュの計算 ───────────────────────────────────
        // サーバーサイドで計算することで、クライアントの改ざんを完全に防ぐ
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const fileHash = createHash("sha256").update(buffer).digest("hex");

        // ── 3. データベース（certificates）へ保存 ───────────────────────
        // 未ログイン（anon）の場合は user_id を null にして、外部キー制約を回避する
        const safeUserId = userId === "anon" ? null : userId;

        const { data: insertData, error: dbError } = await supabaseAdmin
            .from("certificates")
            .insert({
                user_id: safeUserId, // ← ここが null になる
                file_hash: fileHash,
                storage_path: storagePath,
            })
            .select()
            .single();

        if (dbError) {
            console.error("[save-certificate] DB insert error:", dbError);

            // ユニーク制約違反（同じ画像が既にアップロードされている場合）の検知
            if (dbError.code === "23505") {
                return res.status(409).json({
                    success: false,
                    error: "この作品は既に著作権証明が発行されています（重複）"
                });
            }
            return res.status(500).json({ success: false, error: "データベースへの保存に失敗しました" });
        }

        // ── 4. 成功レスポンス ───────────────────────────────────────────
        return res.status(200).json({
            success: true,
            message: "証明書の保存が完了しました",
            certificate: insertData,
        });

    } catch (err) {
        console.error("[save-certificate] Unexpected error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}