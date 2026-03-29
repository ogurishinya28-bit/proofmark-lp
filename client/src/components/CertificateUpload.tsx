/**
 * CertificateUpload — 作品アップロードUIコンポーネント
 */

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useDirectUpload } from "@/hooks/useDirectUpload";
import { useAuth } from "@/hooks/useAuth"; // 🌟 追加

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
  // "image/svg+xml", // 【コメントアウト】将来の拡張用に残す
] as const;

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface CertificateUploadProps {
  onUploadComplete?: (storagePath: string) => void;
  userId?: string;
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
  const { user } = useAuth(); // 🌟 追加

  // 🌟 storagePath の代わりに certificateId を受け取るように変更
  const { uploading, progress, error, certificateId, uploadFile, reset } =
    useDirectUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── バリデーション ────────────────────────────────────────────────
  const validateFile = useCallback((file: File): string | null => {
    // 🌟 追加: 未ログインチェック
    if (!user) {
      return "証明書を発行するにはログインが必要です。";
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return `対応していないファイル形式です。JPEG / PNG / GIF / WebP / AVIF のみ対応しています。`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `ファイルサイズが大きすぎます。${MAX_FILE_SIZE_MB}MB 以下のファイルを選択してください。`;
    }
    return null;
  }, [user]); // 🌟 修正: 依存配列に user を追加

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

      // 🌟 path ではなく certId (証明書ID) を受け取る。userIdは実際のuser.idを渡す。
      const certId = await uploadFile(file, user?.id);

      if (certId) {
        toast.success("🎉 証明書の発行が完了しました！", {
          description: "証明書ページへ移動します...",
          duration: 3000,
        });

        // 🌟 成功したら即座に証明書ページへジャンプ！
        window.location.href = `/cert/${certId}`;

      } else {
        toast.error("アップロードに失敗しました", {
          description: "ネットワーク接続を確認して、再度お試しください。",
        });
      }
    },
    [uploadFile, user?.id, validateFile] // 🌟 修正: 依存配列に user?.id を追加
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
  // 🌟 certificateId があれば完了状態とみなす
  const isCompleted = certificateId !== null;

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
            <h3 className="text-lg font-bold mb-2">証明書ページへ移動中...</h3>
            <p className="text-sm text-muted mb-6">
              少々お待ちください。
            </p>
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
            onClick={() => {
              // 🌟 追加: 未ログイン時はエラーを出し、クリックを無効化
              if (!user) {
                toast.error("ログインが必要です", { description: "証明書を発行するにはログインしてください。" });
                return;
              }
              if (!uploading) inputRef.current?.click();
            }}
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
                    処理中... {progress}%
                  </p>
                  <p className="text-xs text-muted mt-1">
                    ブラウザ内で安全にローカルハッシュを計算中...
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
                JPEG / PNG / GIF / WebP / AVIF · 最大 {MAX_FILE_SIZE_MB}MB
              </p>

              {/* 🌟 追加: 未ログイン時のUIヒント */}
              {!user && (
                <div className="mt-4 px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold">
                  証明書の発行にはログインが必要です
                </div>
              )}

              {/* セキュリティバッジ */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {[
                  "🔒 Direct Upload（Vercel非経由）",
                  "🔐 SHA-256 ブラウザ内ローカルハッシュ",
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