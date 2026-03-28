/**
 * useDirectUpload — Direct Upload フック（Supabase Storage 署名付きURL経由）
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
  /** 0–100 の進捗率 */
  progress: number;
  error: string | null;
  /** アップロード完了後の証明書ID（storagePathから変更） */
  certificateId: string | null;
}

export interface UseDirectUploadReturn extends DirectUploadState {
  // 返り値を string (証明書ID) に変更
  uploadFile: (file: File, userId?: string) => Promise<string | null>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const UPLOAD_URL_ENDPOINT = "/api/upload-url";
const SAVE_CERT_ENDPOINT = "/api/save-certificate";

const INITIAL_STATE: DirectUploadState = {
  uploading: false,
  progress: 0,
  error: null,
  certificateId: null, // 名前を変更
};

// ---------------------------------------------------------------------------
// フック
// ---------------------------------------------------------------------------

export function useDirectUpload(): UseDirectUploadReturn {
  const [state, setState] = useState<DirectUploadState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const uploadFile = useCallback(
    async (file: File, userId = "anon"): Promise<string | null> => {
      setState({ uploading: true, progress: 0, error: null, certificateId: null });

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
          const body: any = await urlRes.json().catch(() => ({}));
          throw new Error(body?.error || `署名付きURL取得に失敗しました (${urlRes.status})`);
        }

        const urlData: UploadUrlApiResponse = await urlRes.json();

        if (!urlData.success || !urlData.signedUrl || !urlData.storagePath) {
          throw new Error(urlData.error ?? "署名付きURL のレスポンスが不正です");
        }

        const { signedUrl, storagePath } = urlData;

        // ── Step 2: Supabase Storage へ直接 PUT アップロード ─────────
        setState((prev) => ({ ...prev, progress: 40 }));

        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error(`ストレージへのアップロードに失敗しました (${putRes.status})`);
        }

        // ── Step 3: データベースに証明書を保存 ────────────
        setState((prev) => ({ ...prev, progress: 80 }));

        const saveRes = await fetch(SAVE_CERT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storagePath, userId }),
        });

        const saveData = await saveRes.json(); // 🌟 レスポンスの中身を取得

        if (!saveRes.ok || !saveData.success) {
          throw new Error(saveData?.error || `データベースへの保存に失敗しました (${saveRes.status})`);
        }

        // 🌟 成功したら、レスポンスから証明書のIDを取り出す
        const certId = saveData.certificate.id;

        // ── Step 4: 完了 ────────────────────────────────────────────
        setState({
          uploading: false,
          progress: 100,
          error: null,
          certificateId: certId, // パスではなくIDを保存
        });

        return certId; // 🌟 パスではなくIDを返す！

      } catch (err) {
        const message =
          err instanceof Error ? err.message : "アップロード中に不明なエラーが発生しました";
        setState({
          uploading: false,
          progress: 0,
          error: message,
          certificateId: null,
        });
        return null;
      }
    },
    []
  );

  return { ...state, uploadFile, reset };
}