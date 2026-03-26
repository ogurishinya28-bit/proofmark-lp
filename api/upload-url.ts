import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// URLの末尾に万が一スラッシュ(/)があっても削る
const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseUrl = rawUrl.trim().replace(/\/$/, "");
const serviceRoleKey = rawKey.trim();

const supabaseAdmin = createClient(
  supabaseUrl || "https://dummy.supabase.co",
  serviceRoleKey || "dummy",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif"
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POSTのみ対応" });

  try {
    const { filename, contentType, userId = "anon" } = req.body;

    if (!filename) return res.status(400).json({ error: "filename は必須です" });
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({ error: `許可されていない形式です: ${contentType}` });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "サーバーの設定エラー（環境変数）" });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    const uuid = randomUUID();
    const storagePath = `${userId}/${uuid}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from("originals")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      // 🚨 ここがポイント！Supabaseの生のエラーをそのままブラウザに返します
      return res.status(500).json({
        error: "アップロードURLの発行に失敗しました",
        supabase_error: error,
        debug_url: supabaseUrl
      });
    }

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      storagePath: `originals/${storagePath}`,
    });

  } catch (err: any) {
    return res.status(500).json({
      error: "Internal Server Error",
      details: err?.message || String(err)
    });
  }
}