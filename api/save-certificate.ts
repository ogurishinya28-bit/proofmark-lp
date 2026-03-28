import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
// 🌟 'node:crypto' のインポートはもう不要なので消しました！

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
        // 🌟 Step 1でブラウザから送られてきた `fileHash` をここで受け取る！
        const { storagePath, userId = "anon", fileHash } = req.body;

        // fileHash が送られてきていない場合はエラーを返す
        if (!storagePath || !fileHash) {
            return res.status(400).json({ success: false, error: "storagePath と fileHash は必須です" });
        }

        if (!supabaseUrl || !serviceRoleKey) {
            return res.status(500).json({ success: false, error: "サーバーの設定エラー（環境変数）" });
        }

        // 🌟 以前ここにあった「1. ファイルをダウンロード」「2. ハッシュ計算」の
        // 重たい処理はすべて削除しました！Vercelの負担が激減します。

        // 3. データベース保存
        const safeUserId = userId === "anon" ? null : userId;

        const { data: insertData, error: dbError } = await supabaseAdmin
            .from("certificates")
            .insert({
                user_id: safeUserId,
                file_hash: fileHash, // 🌟 受け取ったハッシュをそのままDBに保存
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

        // 4. 成功レスポンス
        return res.status(200).json({
            success: true,
            message: "証明書の保存が完了しました",
            certificate: insertData,
        });

    } catch (err: any) {
        console.error("[save-certificate] Unexpected error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}