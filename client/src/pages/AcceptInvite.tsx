/**
 * /invite?token=...
 *
 * Mission 2 — Studio team sharing
 *  • Reads the `token` query parameter.
 *  • Requires the user to be signed in.
 *  • Calls POST /api/teams/accept-invite (atomic RPC fn_accept_team_invite).
 *  • Renders explicit, actionable errors for the four known failure modes:
 *      - invitation_email_mismatch (409) → show "logged-in email differs",
 *        offer **logout & re-login** link so the user can sign in with the
 *        invited email.
 *      - invitation_expired (410), invitation_not_found (404), max_seats_reached (409)
 *  • On success → redirect to /dashboard?team=<id>.
 *
 * No legal/marketing absolutes (lint:copy compliant).
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, LogOut, Mail, Clock, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';

type Phase = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

type ErrorCode =
  | 'invitation_email_mismatch'
  | 'invitation_expired'
  | 'invitation_not_found'
  | 'max_seats_reached'
  | 'no_token'
  | 'not_authenticated'
  | 'network_error'
  | 'unknown';

interface AcceptResponse {
  ok?: boolean;
  teamId?: string | null;
  role?: string | null;
  error?: string;
  reqId?: string;
}

function getTokenFromQuery(): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  return token && token.length >= 16 ? token : null;
}

export default function AcceptInvite() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const token = useMemo(() => getTokenFromQuery(), []);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorCode, setErrorCode] = useState<ErrorCode>('unknown');
  const [reqId, setReqId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // ── Auto-run when token + auth ready ────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setPhase('error');
      setErrorCode('no_token');
      return;
    }
    if (!user) {
      // Send to /auth and come back here after sign-in.
      const next = `/invite?token=${encodeURIComponent(token)}`;
      setLocation(`/auth?next=${encodeURIComponent(next)}`);
      return;
    }
    setPhase('ready');
  }, [authLoading, user, token, setLocation]);

  async function handleAccept() {
    if (!token || !user) return;
    setPhase('submitting');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setErrorCode('not_authenticated');
        setPhase('error');
        return;
      }

      const r = await fetch('/api/teams/accept-invite', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      const body = (await r.json().catch(() => ({}))) as AcceptResponse;
      setReqId(body.reqId ?? null);

      if (r.ok && body.ok) {
        setTeamId(body.teamId ?? null);
        setPhase('success');
        // Soft redirect after a short pause so the success state is readable.
        setTimeout(() => {
          setLocation(`/dashboard${body.teamId ? `?team=${body.teamId}` : ''}`);
        }, 1200);
        return;
      }

      const code = (body.error as ErrorCode) || 'unknown';
      setErrorCode(code);
      setPhase('error');
    } catch (err) {
      console.error('[invite] network error', err);
      setErrorCode('network_error');
      setPhase('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#6C3EF4]/30">
      <SEO
        title="チーム招待を受諾 | ProofMark"
        description="ProofMark Studio プランのチーム招待を受諾するページ"
        url="https://www.proofmark.jp/invite"
        noIndex
      />
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0E0B26]/80 p-8 shadow-[0_0_60px_-30px_rgba(108,62,244,0.5)] backdrop-blur"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C3EF4]/30 to-[#00D4AA]/20 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#00D4AA]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">チーム招待</h1>
              <p className="text-sm text-white/60">Studio プランのワークスペースに参加</p>
            </div>
          </div>

          {phase === 'loading' && (
            <div className="flex items-center gap-3 text-white/70" role="status" aria-live="polite">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>確認中…</span>
            </div>
          )}

          {phase === 'ready' && user && (
            <ReadyView email={user.email ?? ''} onAccept={handleAccept} />
          )}

          {phase === 'submitting' && (
            <div className="flex items-center gap-3 text-white/70" role="status" aria-live="polite">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>招待を処理しています…</span>
            </div>
          )}

          {phase === 'success' && (
            <SuccessView teamId={teamId} />
          )}

          {phase === 'error' && (
            <ErrorView
              code={errorCode}
              currentEmail={user?.email ?? null}
              token={token}
              reqId={reqId}
              onRetry={() => setPhase('ready')}
              onLogout={async () => {
                await signOut();
                if (token) setLocation(`/auth?next=${encodeURIComponent(`/invite?token=${token}`)}`);
              }}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-views
// ─────────────────────────────────────────────────────────────────────────────

function ReadyView({ email, onAccept }: { email: string; onAccept: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-white/60 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-white/80">
            現在のサインイン:&nbsp;
            <span className="font-mono text-[#00D4AA]">{email}</span>
            <p className="text-xs text-white/50 mt-1">
              招待メールを受け取ったメールアドレスでサインインしている必要があります。
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onAccept}
        className="w-full rounded-xl bg-gradient-to-r from-[#6C3EF4] to-[#00D4AA] py-3 text-sm font-semibold text-[#07061A] hover:opacity-95 active:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0B26] focus-visible:ring-[#00D4AA]"
        type="button"
      >
        招待を受諾してチームに参加
      </button>

      <p className="text-xs text-white/50">
        受諾すると、招待トークンは即時に無効化され、再利用できません。
      </p>
    </div>
  );
}

function SuccessView({ teamId }: { teamId: string | null }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#00D4AA]/15 border border-[#00D4AA]/40 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#00D4AA]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold">チームに参加しました</h2>
          <p className="text-xs text-white/60">ダッシュボードへ移動します…</p>
        </div>
      </div>
      <Link
        href={`/dashboard${teamId ? `?team=${teamId}` : ''}`}
        className="inline-flex items-center gap-2 text-sm text-[#00D4AA] hover:underline"
      >
        ダッシュボードを開く →
      </Link>
    </div>
  );
}

interface ErrorViewProps {
  code: ErrorCode;
  currentEmail: string | null;
  token: string | null;
  reqId: string | null;
  onRetry: () => void;
  onLogout: () => Promise<void>;
}

function ErrorView({ code, currentEmail, token, reqId, onRetry, onLogout }: ErrorViewProps) {
  const map: Record<ErrorCode, { icon: JSX.Element; title: string; body: string; cta?: 'retry' | 'logout' | 'none' }> = {
    invitation_email_mismatch: {
      icon: <Mail className="w-5 h-5 text-[#FFB020]" aria-hidden="true" />,
      title: 'サインイン中のメールアドレスが招待先と異なります',
      body:
        '招待メールを受け取ったメールアドレスでサインインし直してください。現在のセッションをログアウトしたうえで、招待先のメールでサインインすると受諾できます。',
      cta: 'logout',
    },
    invitation_expired: {
      icon: <Clock className="w-5 h-5 text-[#FFB020]" aria-hidden="true" />,
      title: '招待リンクの有効期限が切れています',
      body: 'チーム管理者に新しい招待リンクの発行を依頼してください。',
      cta: 'none',
    },
    invitation_not_found: {
      icon: <AlertTriangle className="w-5 h-5 text-[#E74C3C]" aria-hidden="true" />,
      title: '招待リンクが見つかりません',
      body:
        'リンクが既に使用済みか、取り消された可能性があります。チーム管理者に確認してください。',
      cta: 'none',
    },
    max_seats_reached: {
      icon: <Users className="w-5 h-5 text-[#FFB020]" aria-hidden="true" />,
      title: 'チームの席数上限に達しています',
      body:
        'Studio プランのシート上限に達しているため、新しいメンバーを追加できません。プラン変更または既存メンバーの整理が必要です。',
      cta: 'none',
    },
    no_token: {
      icon: <AlertTriangle className="w-5 h-5 text-[#E74C3C]" aria-hidden="true" />,
      title: '招待トークンがURLに含まれていません',
      body: '招待メール内のリンクからアクセスし直してください。',
      cta: 'none',
    },
    not_authenticated: {
      icon: <AlertTriangle className="w-5 h-5 text-[#E74C3C]" aria-hidden="true" />,
      title: '認証セッションが見つかりません',
      body: '一度サインインしてから、招待リンクを再度開いてください。',
      cta: 'retry',
    },
    network_error: {
      icon: <RefreshCw className="w-5 h-5 text-[#FFB020]" aria-hidden="true" />,
      title: '通信エラーが発生しました',
      body: 'ネットワーク接続を確認のうえ、もう一度お試しください。',
      cta: 'retry',
    },
    unknown: {
      icon: <AlertTriangle className="w-5 h-5 text-[#E74C3C]" aria-hidden="true" />,
      title: '招待を受諾できませんでした',
      body: 'しばらく待ってから再度お試しください。問題が続く場合はサポートまでご連絡ください。',
      cta: 'retry',
    },
  };

  const m = map[code];

  return (
    <div className="space-y-5" role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          {m.icon}
        </div>
        <div>
          <h2 className="text-base font-semibold">{m.title}</h2>
          <p className="text-sm text-white/70 mt-1 leading-relaxed">{m.body}</p>
        </div>
      </div>

      {code === 'invitation_email_mismatch' && currentEmail && (
        <div className="rounded-lg border border-[#FFB020]/30 bg-[#FFB020]/5 p-3 text-xs text-white/75">
          現在のサインイン: <span className="font-mono">{currentEmail}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {m.cta === 'logout' && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            ログアウトして招待先メールでサインイン
          </button>
        )}
        {m.cta === 'retry' && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            もう一度試す
          </button>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 transition"
        >
          ダッシュボードへ戻る
        </Link>
      </div>

      {(reqId || token) && (
        <details className="text-xs text-white/40">
          <summary className="cursor-pointer hover:text-white/60">技術的な詳細</summary>
          <div className="mt-2 space-y-1 font-mono">
            {reqId && <div>request-id: {reqId}</div>}
            {token && <div>token: {token.slice(0, 8)}…{token.slice(-4)}</div>}
            <div>code: {code}</div>
          </div>
        </details>
      )}
    </div>
  );
}
