import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearch } from 'wouter';
import { Send, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

const TOPICS = [
    { id: 'studio-reservation', label: 'Studio プランの事前予約' },
    { id: 'business-api', label: 'Business / API / 商用TSAの相談' },
    { id: 'press', label: '取材・メディア' },
    { id: 'support', label: '既存ユーザーのサポート' },
    { id: 'other', label: 'その他' },
];

interface FormState {
    topic: string;
    name: string;
    email: string;
    company: string;
    message: string;
    // Honeypot
    website: string;
}

function pickInitialTopic(query: string): string {
    const t = new URLSearchParams(query).get('topic');
    return TOPICS.find((x) => x.id === t)?.id ?? TOPICS[0].id;
}

export default function Contact() {
    const search = useSearch();
    const { user, signOut } = useAuth();
    const initialTopic = useMemo(() => pickInitialTopic(search), [search]);

    const [form, setForm] = useState<FormState>({
        topic: initialTopic,
        name: '',
        email: '',
        company: '',
        message: '',
        website: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const r = await fetch('/api/send-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                throw new Error(data.error ?? `送信に失敗しました (HTTP ${r.status})`);
            }
            setDone(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : '送信に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#6C3EF4]/30">
            <SEO
                title="お問い合わせ・事前予約 | ProofMark"
                description="ProofMarkへのお問い合わせ。Studioプラン事前予約、Business/API・商用TSAの相談、メディア取材、ユーザーサポートを受け付けています。"
                url="https://proofmark.jp/contact"
            />
            <Navbar user={user} signOut={signOut} />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C3EF4]/10 border border-[#6C3EF4]/30 text-[#BC78FF] text-xs font-bold tracking-widest uppercase mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" /> Contact
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        事前予約 / 相談 / メディア取材
                    </h1>
                    <p className="mt-4 text-[#A8A0D8] leading-relaxed">
                        Studio プランの先行予約、Business / API・商用TSAのご相談、メディア取材の受付窓口です。
                        サービス内容・価格・運用ステータスは <Link href="/trust-center" className="text-[#00D4AA] underline">Trust Center</Link>{' '}
                        と <Link href="/pricing" className="text-[#00D4AA] underline">料金プラン</Link> も併せてご確認ください。
                    </p>
                </motion.div>

                {done ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 rounded-3xl border border-[#00D4AA]/30 bg-[#00D4AA]/5 p-8 text-center"
                    >
                        <CheckCircle2 className="w-12 h-12 text-[#00D4AA] mx-auto" />
                        <h2 className="mt-4 text-xl font-bold text-white">お問い合わせを受け付けました</h2>
                        <p className="mt-3 text-sm text-[#A8A0D8]">
                            内容を確認のうえ、登録メールアドレス宛てに担当よりご連絡いたします。返信は通常1〜3営業日以内です。
                        </p>
                        <div className="mt-6 flex justify-center gap-4 text-sm">
                            <Link href="/" className="text-[#00D4AA] underline">トップに戻る</Link>
                            <Link href="/dashboard" className="text-[#A8A0D8] underline">ダッシュボード</Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onSubmit={submit}
                        className="mt-12 grid gap-5 rounded-3xl border border-[#1C1A38] bg-[#0D0B24]/80 backdrop-blur-md p-6 sm:p-8"
                    >
                        <label className="block">
                            <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">用件</span>
                            <select
                                value={form.topic}
                                onChange={update('topic')}
                                className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white focus:outline-none focus:border-[#6C3EF4]"
                                required
                            >
                                {TOPICS.map((t) => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">お名前</span>
                                <input
                                    required
                                    value={form.name}
                                    onChange={update('name')}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white placeholder-[#48456A] focus:outline-none focus:border-[#6C3EF4]"
                                    placeholder="山田 太郎"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">会社・屋号（任意）</span>
                                <input
                                    value={form.company}
                                    onChange={update('company')}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white placeholder-[#48456A] focus:outline-none focus:border-[#6C3EF4]"
                                    placeholder="株式会社XXX"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">Eメール</span>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={update('email')}
                                className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white placeholder-[#48456A] focus:outline-none focus:border-[#6C3EF4]"
                                placeholder="you@example.com"
                            />
                        </label>

                        <label className="block">
                            <span className="block text-xs font-bold tracking-widest text-[#A8A0D8] uppercase mb-2">ご相談内容</span>
                            <textarea
                                required
                                value={form.message}
                                onChange={update('message')}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl bg-[#0F0E26] border border-[#2a2a4e] text-white placeholder-[#48456A] focus:outline-none focus:border-[#6C3EF4]"
                                placeholder="例：制作会社向けに API 連携を検討中。月間3,000件想定で、商用TSA・SLA・DPAの提供条件を伺いたい。"
                            />
                        </label>

                        {/* Honeypot */}
                        <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={form.website}
                            onChange={update('website')}
                            className="hidden"
                            aria-hidden="true"
                        />

                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-[#3a1212] border border-[#FF4D4D]/40 text-[#FFB8B8] text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C3EF4] to-[#8B61FF] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(108,62,244,0.35)]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> 送信中…
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" /> 送信する
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-[#48456A] leading-relaxed">
                            送信時に、IPアドレス・User-Agent をスパム対策の目的で記録します。詳細は
                            <Link href="/privacy" className="text-[#00D4AA] underline mx-1">プライバシーポリシー</Link>
                            をご参照ください。
                        </p>
                    </motion.form>
                )}
            </main>
        </div>
    );
}
