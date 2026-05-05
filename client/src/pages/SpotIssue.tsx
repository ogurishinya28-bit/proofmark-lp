/**
 * SpotIssue.tsx — Phase 12.3 (429 Graceful Handling 対応版)
 *
 * Spot は本来 Free プラン制限の対象ではない (1案件購入フローで Stripe を経由する)。
 * しかし本ファイルは「ログイン済みユーザーが認証フローで Spot 画面に来た場合」も
 * 想定して、429 を受けたら UpgradeModal をマウントするハンドラを共通化する。
 *
 * 変更点:
 *   • UpgradeModal を import し、`upgradeOpen` で制御。
 *   • startCheckout の throw が `quota_exceeded` を含む / status 429 を伴う場合、
 *     エラートーストではなく UpgradeModal を強制展開する。
 *   • 既存の UI / コピーは一切退行させない。
 */

import { useCallback, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, ShieldCheck, FileText, Loader2, Lock, Sparkles, Upload, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import UpgradeModal from '../components/UpgradeModal';
import { useAuth } from '../hooks/useAuth';
import { startCheckout } from '../lib/checkout';

async function sha256FromFile(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

interface QuotaError {
    status: number;
    body?: { error?: string; quota?: number; used?: number; resetAt?: string };
}

function isQuotaError(err: unknown): err is QuotaError {
    if (!err || typeof err !== 'object') return false;
    const e = err as { status?: number; body?: { error?: string } };
    if (e.status === 429) return true;
    if (e.body?.error === 'quota_exceeded') return true;
    return false;
}

export default function SpotIssue() {
    const { user, signOut } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [sha256, setSha256] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Phase 12.3 — Graceful upsell
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [quotaContext, setQuotaContext] = useState<{ used?: number; quota?: number; resetAt?: string }>({});

    const onDrop = useCallback(async (accepted: File[]) => {
        if (!accepted[0]) return;
        setError(null);
        const f = accepted[0];
        setFile(f);
        setSha256(null);
        try {
            const hash = await sha256FromFile(f);
            setSha256(hash);
        } catch {
            setError('ファイルのハッシュ計算に失敗しました');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        maxSize: 50 * 1024 * 1024,
    });

    const isReady = useMemo(
        () => !!file && !!sha256 && agreed && !loading,
        [file, sha256, agreed, loading],
    );

    const handlePurchase = async () => {
        if (!isReady || !sha256 || !file) return;
        setLoading(true);
        setError(null);
        try {
            await startCheckout({
                plan: 'spot',
                sha256,
                filename: file.name,
                spotEmail: email || undefined,
            });
        } catch (err: unknown) {
            // Phase 12.3 — 429 は単純トーストではなく UpgradeModal で受け止める
            if (isQuotaError(err)) {
                const body = (err as QuotaError).body ?? {};
                setQuotaContext({
                    used: body.used,
                    quota: body.quota ?? 30,
                    resetAt: body.resetAt,
                });
                setUpgradeOpen(true);
            } else {
                const message = err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: string }).message)
                    : '決済の開始に失敗しました';
                setError(message);
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#00D4AA]/30">
            <SEO
                title="今この1案件だけ — Spot Evidence Pack | ProofMark"
                description="アカウント登録不要。1案件だけ、納品信頼つきの Evidence Pack を即時発行できる Spot プランです。Stripe決済 → ダウンロードまで最短2分。"
                url="https://proofmark.jp/spot-issue"
            />
            <Navbar user={user} signOut={signOut} />

            <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] text-xs font-bold tracking-widest uppercase mb-5">
                        <Sparkles className="w-3.5 h-3.5" /> Spot — 1案件だけ
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        アカウント登録不要。<br className="sm:hidden" />
                        1案件だけ、<span className="text-[#00D4AA]">Evidence Pack</span> を発行する。
                    </h1>
                    <p className="mt-5 text-[#A8A0D8] leading-relaxed">
                        ファイルをドロップするとブラウザ内で SHA-256 を計算します（原本は送信されません）。
                        決済完了後、PDF・タイムスタンプトークン・検証スクリプトをまとめた Evidence Pack を即時ダウンロードできます。
                        Spot のデータは <strong className="text-white">24時間で物理削除</strong> されます。
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-10 rounded-3xl border border-[#1C1A38] bg-[#0D0B24]/80 backdrop-blur-md p-6 sm:p-8"
                >
                    <div
                        {...getRootProps()}
                        className={`group flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragActive
                            ? 'border-[#00D4AA] bg-[#00D4AA]/5'
                            : 'border-[#2a2a4e] hover:border-[#00D4AA]/40 hover:bg-white/[0.02]'
                            }`}
                    >
                        <input {...getInputProps()} aria-label="ファイル選択" />
                        <Upload className="w-8 h-8 text-[#A8A0D8] group-hover:text-[#00D4AA] transition-colors" />
                        <p className="text-sm text-[#A8A0D8]">
                            {file ? (
                                <span className="flex items-center gap-2 text-white">
                                    <FileText className="w-4 h-4 text-[#00D4AA]" /> {file.name}{' '}
                                    <span className="text-xs text-[#A8A0D8]">({(file.size / 1024).toFixed(1)} KB)</span>
                                </span>
                            ) : isDragActive ? (
                                'ここにドロップ'
                            ) : (
                                <>
                                    ファイルをドロップ、または<span className="text-[#00D4AA] underline">クリックして選択</span>
                                    <span className="block mt-1 text-xs">最大50MBまで</span>
                                </>
                            )}
                        </p>
                        {sha256 && (
                            <div className="mt-3 px-3 py-2 rounded-lg bg-black/40 border border-[#1C1A38]">
                                <span className="text-[10px] tracking-widest text-[#00D4AA] font-bold uppercase">SHA-256 (計算済み)</span>
                                <p className="font-mono text-[11px] text-white/85 break-all">{sha256}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid gap-4">
                        <label className="block">
                            <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">
                                Eメール（任意・受領確認）
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white placeholder-[#48456A] focus:outline-none focus:border-[#00D4AA]"
                            />
                        </label>

                        <label className="flex items-start gap-3 text-sm text-[#A8A0D8] leading-relaxed cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-[#00D4AA]"
                            />
                            <span>
                                <strong className="text-white">同意:</strong> Spot プランのデータは発行から24時間で
                                <Link href="/trust-center#s4" className="text-[#00D4AA] underline mx-1">物理削除</Link>
                                されます。Evidence Pack のZIPはお手元で必ず保存してください。
                                <Link href="/terms" className="text-[#00D4AA] underline ml-2">利用規約</Link>と
                                <Link href="/privacy" className="text-[#00D4AA] underline ml-1">プライバシー</Link>に同意します。
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="mt-4 px-4 py-3 rounded-xl bg-[#3a1212] border border-[#FF4D4D]/40 text-[#FFB8B8] text-sm flex items-center gap-2">
                            <X className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePurchase}
                        disabled={!isReady}
                        className={`mt-6 w-full py-4 rounded-full font-black text-base transition-all flex items-center justify-center gap-2 ${isReady
                            ? 'bg-gradient-to-r from-[#6C3EF4] to-[#8B61FF] text-white shadow-[0_0_24px_rgba(108,62,244,0.45)] hover:scale-[1.02]'
                            : 'bg-[#1C1A38] text-[#A8A0D8] cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> 決済画面へ遷移中…
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5" /> ¥480 で Evidence Pack を発行する
                            </>
                        )}
                    </button>

                    <p className="mt-4 text-[11px] text-[#48456A] flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00D4AA]" />
                        Stripeによるセキュアな決済 / アカウント登録不要 / 24時間後にデータ削除
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-3 sm:grid-cols-3">
                    {[
                        { icon: <CheckCircle className="w-4 h-4 text-[#00D4AA]" />, text: 'PDF証明書（A4 提出用）' },
                        { icon: <FileText className="w-4 h-4 text-[#00D4AA]" />, text: 'RFC3161 タイムスタンプトークン' },
                        { icon: <ShieldCheck className="w-4 h-4 text-[#00D4AA]" />, text: 'OpenSSL 検証スクリプト' },
                    ].map((item) => (
                        <div key={item.text} className="rounded-xl border border-[#1C1A38] bg-[#0D0B24]/70 px-4 py-3 flex items-center gap-3 text-sm text-[#A8A0D8]">
                            {item.icon}
                            {item.text}
                        </div>
                    ))}
                </div>
            </main>

            {/* Phase 12.3 — 429 Graceful Upsell */}
            <UpgradeModal
                open={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                used={quotaContext.used}
                quota={quotaContext.quota ?? 30}
                resetAt={quotaContext.resetAt ?? null}
            />
        </div>
    );
}
