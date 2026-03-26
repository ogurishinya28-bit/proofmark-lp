import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as dotenv from 'dotenv';
import path from 'node:path';

// 1. 環境変数を強制ロード（これがないとバックエンドが死にます）
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// dotenv のあとに import する必要があります
import { supabaseAdmin } from "./lib/supabase-admin";
import { randomUUID } from "node:crypto";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/svg" // これも追加
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST requests are supported" });
  }

  try {
    const { filename, contentType, userId = "anon" } = req.body;

    // バリデーション
    if (!filename) return res.status(400).json({ success: false, error: "filename は必須です" });

    // SVGの判定を少し緩くする（image/svg+xml でも image/svg でも通るように）
    const isSvg = contentType?.includes("svg");
    if (!isSvg && (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType))) {
      return res.status(400).json({ success: false, error: `許可されていない形式です: ${contentType}` });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    const uuid = randomUUID();
    const storagePath = `${userId}/${uuid}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from("originals")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[upload-url] Supabase error:", error);
      return res.status(500).json({ success: false, error: "URL発行失敗" });
    }

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      storagePath: `originals/${storagePath}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal error" });
  }
}