/**
 * useDirectUpload — Direct Upload フック（Supabase Storage 署名付きURL経由 ＋ ブラウザ内ハッシュ計算）
 */

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";

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
  progress: number;
  error: string | null;
  certificateId: string | null;
}

export interface UseDirectUploadReturn extends DirectUploadState {
  uploadFile: (file: File, userId?: string, username?: string) => Promise<string | null>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 定数・ユーティリティ
// ---------------------------------------------------------------------------

const UPLOAD_URL_ENDPOINT = "/api/upload-url";
const SAVE_CERT_ENDPOINT = "/api/save-certificate";

const INITIAL_STATE: DirectUploadState = {
  uploading: false,
  progress: 0,
  error: null,
  certificateId: null,
};

// 🌟 【新規追加】ブラウザ内で安全にSHA-256ハッシュを計算する関数
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Web Crypto API を使用してハッシュを計算（ブラウザ標準機能なので安全・高速）
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// フック
// ---------------------------------------------------------------------------

export function useDirectUpload(): UseDirectUploadReturn {
  const [state, setState] = useState<DirectUploadState>(INITIAL_STATE);
  const { user } = useAuth();

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const uploadFile = useCallback(
    async (file: File, userId = "anon", username = "sinn"): Promise<string | null> => {
      setState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
        certificateId: null,
      }));

      try {
        // 🌟 Step 1: 署名付きURLを取得
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

        const urlData: UploadUrlApiResponse = await urlRes.json();
        if (!urlRes.ok || !urlData.signedUrl || !urlData.storagePath) {
          throw new Error(urlData.error || "署名付きURLの取得に失敗しました。");
        }

        const { signedUrl, storagePath } = urlData;

        // 🌟 Step 2: S3 (Supabase Storage) へ直接アップロード
        setState((prev) => ({ ...prev, progress: 30 }));
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("ファイルのアップロードに失敗しました。");
        }

        // ブラウザ側でハッシュ計算（整合性チェック & DB保存用）
        setState((prev) => ({ ...prev, progress: 60 }));
        const fileHash = await calculateSHA256(file);

        // ── Step 3: データベースに証明書を保存 ────────────
        setState((prev) => ({ ...prev, progress: 80 }));

        const saveRes = await fetch(SAVE_CERT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storagePath, userId, fileHash, filename: file.name, username }),
        });

        const saveData = await saveRes.json();

        if (!saveRes.ok || !saveData.success) {
          throw new Error(saveData?.error || `データベースへの保存に失敗しました (${saveRes.status})`);
        }

        const certId = saveData.certificate.id;

        // ── Step 4: 完了 ────────────────────────────────────────────
        setState({
          uploading: false,
          progress: 100,
          error: null,
          certificateId: certId,
        });

        return certId;

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