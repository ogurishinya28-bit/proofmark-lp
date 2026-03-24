/**
 * CertificateUpload — 作品アップロードUIコンポーネント
 *
 * - ドラッグ&ドロップ + ファイル選択に対応
 * - useDirectUpload フックで Supabase Storage へ Direct Upload
 * - Framer Motion でアップロード中スピナー、完了アニメーション
 * - 成功時 toast.success、エラー時 toast.error
 *
 * ⚠️ アーキテクチャルール（絶対遵守）:
 *   - ハッシュ計算はクライアントで行わない（Edge Function に委ねる）
 *   - ファイルの中身は signedUrl へ直接 PUT され Vercel を経由しない
 */

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useDirectUpload } from "@/hooks/useDirectUpload";

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface CertificateUploadProps {
  /** アップロード完了後のコールバック（storagePath を受け取る） */
  onUploadComplete?: (storagePath: string) => void;
  /** 認証済みユーザーのUUID（未認証時は "anon"） */
  userId?: string;
  /** 追加の className */
  className?: string;
}

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------

export function CertificateUpload({
  onUploadComplete,
  userId = "anon",
  className = "",
}: CertificateUploadProps) {
  const { uploading, progress, error, storagePath, uploadFile, reset } =
    useDirectUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── バリデーション ────────────────────────────────────────────────
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return `対応していないファイル形式です。JPEG / PNG / GIF / WebP / AVIF / SVG のみ対応しています。`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `ファイルサイズが大きすぎます。${MAX_FILE_SIZE_MB}MB 以下のファイルを選択してください。`;
    }
    return null;
  }, []);

  // ── ファイル選択/ドロップ処理 ─────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setSelectedFile(file);

      const path = await uploadFile(file, userId);

      if (path) {
        toast.success("🎉 アップロード完了！証明書を生成中です...", {
          description: "ハッシュの計算が完了次第、証明書が発行されます。",
          duration: 5000,
        });
        onUploadComplete?.(path);
      } else {
        toast.error("アップロードに失敗しました", {
          description: "ネットワーク接続を確認して、再度お試しください。",
        });
      }
    },
    [uploadFile, userId, validateFile, onUploadComplete]
  );

  // ── ドラッグ&ドロップイベント ──────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(e.target.files);
      // 同じファイルを再選択できるようにリセット
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleReset = useCallback(() => {
    reset();
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [reset]);

  // ── 表示状態 ─────────────────────────────────────────────────────
  const isCompleted = storagePath !== null;

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence mode="wait">
        {/* ── 完了状態 ── */}
        {isCompleted ? (
          <motion.div
            key="completed"
            className="relative rounded-2xl border overflow-hidden p-8 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,212,170,0.12) 0%, rgba(21,29,47,0.95) 60%)",
              border: "2px solid rgba(0,212,170,0.45)",
              boxShadow: "0 0 40px rgba(0,212,170,0.15)",
              backdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </motion.div>
            <h3 className="text-lg font-bold mb-2">アップロード完了！</h3>
            <p className="text-sm text-muted mb-2">
              {selectedFile?.name}
            </p>
            <p className="text-xs text-muted/70 mb-6">
              サーバーサイドでSHA-256ハッシュを計算し、証明書を発行しています...
            </p>
            <motion.button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold"
              style={{
                borderColor: "rgba(0,212,170,0.35)",
                color: "#00d4aa",
              }}
              whileHover={{ background: "rgba(0,212,170,0.1)", scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Upload className="w-4 h-4" />
              別のファイルをアップロード
            </motion.button>
          </motion.div>
        ) : (
          /* ── アップロードゾーン ── */
          <motion.div
            key="dropzone"
            className="relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer"
            style={{
              background: isDragOver
                ? "rgba(108,62,244,0.1)"
                : "rgba(21,29,47,0.6)",
              borderColor: isDragOver
                ? "rgba(108,62,244,0.6)"
                : uploading
                ? "rgba(108,62,244,0.4)"
                : "rgba(42,42,78,0.7)",
              boxShadow: isDragOver
                ? "0 0 30px rgba(108,62,244,0.2)"
                : "none",
              backdropFilter: "blur(12px)",
              transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            role="button"
            aria-label="作品ファイルをドロップまたはクリックして選択"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !uploading) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            {/* ── アップロード中オーバーレイ ── */}
            <AnimatePresence>
              {uploading && (
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                  style={{
                    background: "rgba(10,14,39,0.85)",
                    backdropFilter: "blur(8px)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* スピナー */}
                  <motion.div
                    className="w-12 h-12 border-4 rounded-full mb-4"
                    style={{
                      borderColor: "rgba(108,62,244,0.2)",
                      borderTopColor: "#6c3ef4",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />

                  {/* プログレスバー */}
                  <div
                    className="w-48 h-1.5 rounded-full overflow-hidden mb-3"
                    style={{ background: "rgba(42,42,78,0.7)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #6c3ef4, #00d4aa)",
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    アップロード中... {progress}%
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Supabase Storage へ直接転送中
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── エラー表示 ── */}
            {error && !uploading && (
              <motion.div
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#f87171",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                エラー
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="ml-1 hover:opacity-70 transition-opacity"
                  aria-label="エラーをクリア"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {/* ── デフォルトコンテンツ ── */}
            <div className="p-10 flex flex-col items-center text-center">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(108,62,244,0.12)",
                  border: "1px solid rgba(108,62,244,0.25)",
                }}
                animate={isDragOver ? { scale: 1.12 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <FileImage className="w-8 h-8 text-primary" />
              </motion.div>

              <h3 className="text-base font-bold mb-2">
                作品ファイルをここにドロップ
              </h3>
              <p className="text-sm text-muted mb-4">
                または{" "}
                <span className="text-primary font-semibold underline underline-offset-2">
                  クリックして選択
                </span>
              </p>
              <p className="text-xs text-muted/60">
                JPEG / PNG / GIF / WebP / AVIF / SVG · 最大 {MAX_FILE_SIZE_MB}MB
              </p>

              {/* セキュリティバッジ */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {[
                  "🔒 Direct Upload（Vercel非経由）",
                  "🔐 SHA-256 サーバーサイドハッシュ",
                ].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(42,42,78,0.6)",
                      border: "1px solid rgba(42,42,78,0.8)",
                      color: "#a0a0c0",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* 非表示 file input */}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
