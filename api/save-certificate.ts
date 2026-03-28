import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

// 環境変数のトリムとスラッシュ削除
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

// Vercel安定化オプション付きクライアント
const supabaseAdmin = createClient(
    supabaseUrl || "https://dummy.supabase.co",
    serviceRoleKey || "dummy",
    {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: (...args) => fetch(...args) }
    }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Only POST allowed" });
    }

    try {
        const { storagePath, userId = "anon" } = req.body;

        if (!storagePath) {
            return res.status(400).json({ success: false, error: "storagePath は必須です" });
        }

        if (!supabaseUrl || !serviceRoleKey) {
            return res.status(500).json({ success: false, error: "サーバーの設定エラー（環境変数）" });
        }

        const filePath = storagePath.startsWith("originals/")
            ? storagePath.replace("originals/", "")
            : storagePath;

        // 1. ファイルをダウンロード
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from("originals")
            .download(filePath);

        if (downloadError || !fileData) {
            console.error("[save-certificate] Download error:", downloadError);
            return res.status(500).json({ success: false, error: "ストレージからのファイル取得に失敗しました" });
        }

        // 2. サーバーサイドで SHA-256 ハッシュ計算
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = createHash("sha256").update(buffer).digest("hex");

        // 3. データベース保存
        const safeUserId = userId === "anon" ? null : userId;

        const { data: insertData, error: dbError } = await supabaseAdmin
            .from("certificates")
            .insert({
                user_id: safeUserId,
                file_hash: fileHash,
                storage_path: storagePath,
            })
            .select()
            .single();

        if (dbError) {
            console.error("[save-certificate] DB insert error:", dbError);
            if (dbError.code === "23505") {
                return res.status(409).json({
                    success: false,
                    error: "この作品は既に著作権証明が発行されています（重複）"
                });
            }
            return res.status(500).json({ success: false, error: "データベースへの保存に失敗しました" });
        }

        // 4. 成功レスポンス（フロントエンドで遷移に使う id を含む）
        return res.status(200).json({
            success: true,
            message: "証明書の保存が完了しました",
            certificate: insertData, // ここに id が入っています
        });

    } catch (err: any) {
        console.error("[save-certificate] Unexpected error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}