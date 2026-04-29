import { useEffect, useMemo, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

interface SpotResultPayload {
    status: 'pending' | 'paid' | 'expired';
    staging_id?: string;
    download_url?: string;
    sha256?: string;
    paid_at?: string;
    email?: string | null;
}

const POLL_INTERVAL = 1500;
const POLL_MAX = 20;

export default function SpotIssueResult() {
    const search = useSearch();
    const sid = useMemo(() => new URLSearchParams(search).get('sid'), [search]);
    const { user, signOut } = useAuth();

    const [state, setState] = useState<SpotResultPayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [polls, setPolls] = useState(0);

    useEffect(() => {
        if (!sid) {
            setError('セッションIDが見つかりません。決済が完了していない可能性があります。');
            return;
        }
        let cancelled = false;
        let attempts = 0;
        const tick = async () => {
            attempts += 1;
            try {
                const resp = await fetch(`/api/spot-status?sid=${encodeURIComponent(sid)}`);
                if (resp.status === 404) {
                    if (attempts >= POLL_MAX) {
                        if (!cancelled) setError('決済情報を確認できませんでした。');
                        return;
                    }
                } else if (!resp.ok) {
                    throw new Error(`status HTTP ${resp.status}`);
                } else {
                    const data = (await resp.json()) as SpotResultPayload;
                    if (!cancelled) setState(data);
                    if (data.status === 'paid') return;
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'unknown error');
            } finally {
                if (!cancelled) setPolls(attempts);
                if (!cancelled && attempts < POLL_MAX) setTimeout(tick, POLL_INTERVAL);
            }
        };
        tick();
        return () => {
            cancelled = true;
        };
    }, [sid]);

    const downloadHref = state?.status === 'paid' && state.staging_id
        ? `/api/generate-evidence-pack?staging=${state.staging_id}&spot=${sid}`
        : null;

    return (
        <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#00D4AA]/30">
            <SEO
                title="Spot Evidence Pack — 受領 | ProofMark"
                description="Stripe決済が完了し、Spot Evidence Pack のダウンロード準備が整いました。"
                url="https://proofmark.jp/spot-issue/result"
                noIndex
            />
            <Navbar user={user} signOut={signOut} />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    {state?.status === 'paid' ? (
                        <CheckCircle2 className="w-12 h-12 mx-auto text-[#00D4AA]" />
                    ) : error ? (
                        <AlertTriangle className="w-12 h-12 mx-auto text-[#F0BB38]" />
                    ) : (
                        <Loader2 className="w-12 h-12 mx-auto text-[#A8A0D8] animate-spin" />
                    )}

                    <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
                        {state?.status === 'paid'
                            ? 'Evidence Pack の準備が整いました'
                            : error
                                ? '決済の確認に失敗しました'
                                : '決済結果を確認しています…'}
                    </h1>
                    <p className="mt-3 text-[#A8A0D8] leading-relaxed">
                        {state?.status === 'paid'
                            ? 'ZIPをダウンロードして、必ずお手元に保存してください。Spotデータは24時間で物理削除されます。'
                            : error
                                ? error
                                : 'Stripe からの確認を待っています。数秒お待ちください…'}
                    </p>
                </motion.div>

                {state?.status === 'paid' && downloadHref && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-[#1C1A38] bg-[#0D0B24]/80 backdrop-blur-md p-8"
                    >
                        <div className="grid gap-3 mb-6 text-sm">
                            <div className="flex justify-between gap-4 text-[#A8A0D8]"><span>ステータス</span><strong className="text-white">PAID</strong></div>
                            <div className="flex justify-between gap-4 text-[#A8A0D8]"><span>Staging ID</span><span className="font-mono text-white/80">{state.staging_id?.slice(0, 8)}…</span></div>
                            {state.email && (
                                <div className="flex justify-between gap-4 text-[#A8A0D8]"><span>メール</span><span className="text-white/85">{state.email}</span></div>
                            )}
                            {state.paid_at && (
                                <div className="flex justify-between gap-4 text-[#A8A0D8]"><span>決済時刻</span><span className="text-white/85">{new Date(state.paid_at).toLocaleString('ja-JP')}</span></div>
                            )}
                        </div>

                        <a
                            href={downloadHref}
                            className="block w-full py-4 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#3FE8C5] text-[#07061A] font-black text-center hover:scale-[1.02] transition-all shadow-[0_0_24px_rgba(0,212,170,0.35)]"
                        >
                            <Download className="inline w-5 h-5 mr-2 -mt-0.5" /> Evidence Pack をダウンロード
                        </a>

                        <p className="mt-4 text-xs text-[#48456A] flex items-center gap-2 justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00D4AA]" />
                            ProofMark に依存せず、OpenSSL 単体でも検証可能なZIPです。
                        </p>
                    </motion.div>
                )}

                {error && (
                    <div className="mt-8 text-center">
                        <Link href="/spot-issue" className="text-[#00D4AA] underline">もう一度試す</Link>
                        <span className="mx-3 text-[#48456A]">|</span>
                        <Link href="/contact" className="text-[#A8A0D8] underline">サポートに問い合わせる</Link>
                    </div>
                )}

                {!state && !error && (
                    <div className="mt-6 text-center text-xs text-[#48456A]">
                        poll {polls} / {POLL_MAX}
                    </div>
                )}
            </main>
        </div>
    );
}
