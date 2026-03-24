/**
 * useDirectUpload — Direct Upload フック（Supabase Storage 署名付きURL経由）
 *
 * フロー:
 *   1. POST /api/upload-url で署名付きURLとストレージパスを取得
 *   2. 取得した signedUrl に対し fetch PUT で直接 Supabase Storage へアップロード
 *   3. アップロード完了後に storagePath（Edge Function が使用）を返す
 *
 * ⚠️ アーキテクチャルール（絶対遵守）:
 *   - 画像ファイルの中身は Vercel API を一切経由しない
 *   - ハッシュ計算はクライアントでは行わない（Edge Function に委ねる）
 */

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface UploadUrlApiResponse {
  success: boolean;
  signedUrl?: string;
  storagePath?: string;
  error?: string;
}

export interface DirectUploadState {
  uploading: boolean;
  /** 0–100 の進捗率（XHR を使わない fetch では完了時に 100 になる） */
  progress: number;
  error: string | null;
  /** アップロード完了後のストレージパス（例: originals/user_id/uuid.png） */
  storagePath: string | null;
}

export interface UseDirectUploadReturn extends DirectUploadState {
  uploadFile: (file: File, userId?: string) => Promise<string | null>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const UPLOAD_URL_ENDPOINT = "/api/upload-url";

const INITIAL_STATE: DirectUploadState = {
  uploading: false,
  progress: 0,
  error: null,
  storagePath: null,
};

// ---------------------------------------------------------------------------
// フック
// ---------------------------------------------------------------------------

export function useDirectUpload(): UseDirectUploadReturn {
  const [state, setState] = useState<DirectUploadState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * ファイルを Supabase Storage に Direct Upload する
   * @param file  アップロード対象のファイル
   * @param userId  認証済みユーザーのUUID（未認証は "anon"）
   * @returns アップロード完了後の storagePath、失敗時は null
   */
  const uploadFile = useCallback(
    async (file: File, userId = "anon"): Promise<string | null> => {
      setState({ uploading: true, progress: 0, error: null, storagePath: null });

      try {
        // ── Step 1: 署名付きURL + ストレージパスを取得 ───────────────
        setState((prev) => ({ ...prev, progress: 10 }));

        const urlRes = await fetch(UPLOAD_URL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            userId,
          }),
        });

        if (!urlRes.ok) {
          const body: unknown = await urlRes.json().catch(() => ({}));
          const errorMsg =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof (body as Record<string, unknown>).error === "string"
              ? (body as Record<string, string>).error
              : `署名付きURL取得に失敗しました (${urlRes.status})`;
          throw new Error(errorMsg);
        }

        const urlData: UploadUrlApiResponse = await urlRes.json();

        if (!urlData.success || !urlData.signedUrl || !urlData.storagePath) {
          throw new Error(urlData.error ?? "署名付きURL のレスポンスが不正です");
        }

        const { signedUrl, storagePath } = urlData;

        // ── Step 2: Supabase Storage へ直接 PUT アップロード ─────────
        setState((prev) => ({ ...prev, progress: 30 }));

        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error(
            `Supabase Storage へのアップロードに失敗しました (${putRes.status})`
          );
        }

        // ── Step 3: 完了 ────────────────────────────────────────────
        setState({
          uploading: false,
          progress: 100,
          error: null,
          storagePath,
        });

        return storagePath;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "アップロード中に不明なエラーが発生しました";
        setState({
          uploading: false,
          progress: 0,
          error: message,
          storagePath: null,
        });
        return null;
      }
    },
    []
  );

  return { ...state, uploadFile, reset };
}
