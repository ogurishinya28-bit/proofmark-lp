import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import {
  ShieldCheck,
  ExternalLink,
  ImageIcon,
  Lock,
  ArrowLeft,
  Hash,
  Calendar,
  Layers,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import navbarLogo from '../assets/logo/navbar/proofmark-navbar-symbol-dark.svg';
import founderBadge from '../assets/logo/badges/proofmark-badge-founder.svg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface CertRecord {
  id: string;
  file_hash: string;
  created_at: string;
  image_url?: string;
  metadata?: {
    filename?: string;
    show_in_gallery?: boolean;
    image_url?: string;
    ai_tool?: string;
    [key: string]: unknown;
  };
}

// ── Animated loading dots ──────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#07061A] flex flex-col items-center justify-center gap-6">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-[#6C3EF4]/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6C3EF4] animate-spin" />
      <div className="absolute inset-2 rounded-full border border-transparent border-t-[#00D4AA] animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
    </div>
    <p className="text-[#A8A0D8] text-sm font-bold tracking-[0.3em] uppercase animate-pulse">
      Verifying Portfolio...
    </p>
  </div>
);

// ── 404 Error Screen ───────────────────────────────────────────
const NotFoundScreen = ({ username }: { username: string }) => (
  <div className="min-h-screen bg-[#07061A] flex flex-col items-center justify-center gap-6 px-4 text-center">
    <div className="w-20 h-20 rounded-2xl bg-[#0D0B24] border border-[#1C1A38] flex items-center justify-center mb-4">
      <ShieldCheck className="w-10 h-10 text-slate-600" />
    </div>
    <h1 className="text-2xl font-extrabold text-white tracking-tight">
      @{username} は存在しません
    </h1>
    <p className="text-[#A8A0D8] text-sm max-w-sm">
      このユーザー名は登録されていないか、ポートフォリオが非公開に設定されています。
    </p>
    <Link href="/">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#00D4AA] hover:text-white transition-colors cursor-pointer border-b border-[#00D4AA]/40 pb-0.5">
        <ArrowLeft className="w-4 h-4" /> ProofMarkトップへ
      </span>
    </Link>
  </div>
);

// ── Zero-Knowledge Card Placeholder ───────────────────────────
const ZKPlaceholder = () => (
  <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-[#151D2F] to-[#07061A] gap-3 p-4">
    <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center">
      <Lock className="w-5 h-5 text-[#00D4AA]/60" />
    </div>
    <span className="text-[#00D4AA] text-[9px] font-bold tracking-widest uppercase border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-2.5 py-1 rounded-full">
      ZERO-KNOWLEDGE
    </span>
    <p className="text-[#A8A0D8]/50 text-[10px] text-center leading-relaxed">
      完全秘匿化状態<br />で証明済み
    </p>
  </div>
);

export default function PublicProfile() {
  const [match, params] = useRoute('/u/:username');
  const username = match && params ? params.username : null;

  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [certCount, setCertCount] = useState(0);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    async function loadPortfolio() {
      // ── Step 1: Find user by username stored in metadata ──
      // certificates テーブルで username をメタデータか、
      // user_id をキーに profiles テーブルを検索する。
      // 実装上のフォールバック：username を email の @ 前の部分として照合。
      // Supabase Auth 上の email から "username" を推定する。
      const { data: allCerts, error: certsError } = await supabase
        .from('certificates')
        .select('id, file_hash, created_at, image_url, metadata')
        .order('created_at', { ascending: false });

      if (certsError || !allCerts) {
        setLoading(false);
        return;
      }

      // username に合致する証明書をフィルタ
      // metadata.username もしくは metadata.display_name で照合
      const userCerts = allCerts.filter((c) => {
        const meta = c.metadata as Record<string, unknown> | null;
        if (!meta) return false;
        return (
          (typeof meta.username === 'string' &&
            meta.username.toLowerCase() === username!.toLowerCase()) ||
          (typeof meta.display_name === 'string' &&
            meta.display_name.toLowerCase() === username!.toLowerCase())
        );
      });

      if (userCerts.length === 0) {
        // Fallback: ユーザー自体は存在するが gallery 対象がゼロの可能性も含め
        // show_in_gallery フラグは metadata に格納
        setProfileExists(false);
        setLoading(false);
        return;
      }

      setProfileExists(true);
      setCertCount(userCerts.length);

      // gallery 公開のもののみ表示
      const galleryCerts = userCerts.filter((c) => {
        const meta = c.metadata as Record<string, unknown> | null;
        return !meta || meta.show_in_gallery !== false; // デフォルト公開
      });

      setCerts(galleryCerts);
      setLoading(false);
    }

    loadPortfolio();
  }, [username]);

  if (loading) return <LoadingScreen />;
  if (!username || !profileExists) return <NotFoundScreen username={username || 'unknown'} />;

  const displayName = username;
  const certVerifyBase = `${window.location.origin}/cert/`;

  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans pb-24">
      {/* ── Navbar ── */}
      <div className="w-full border-b border-[#1C1A38] bg-[#0D0B24]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={navbarLogo} alt="ProofMark" className="h-6 w-auto" />
            <span className="font-['Syne'] text-lg font-extrabold text-[#F0EFF8]">
              Proof<span className="text-[#00D4AA]">Mark</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#A8A0D8] hover:text-[#00D4AA] transition-colors">
            <ArrowLeft className="w-4 h-4" /> トップ
          </Link>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">
        <div className="relative bg-[#0D0B24] border border-[#1C1A38] rounded-3xl p-8 sm:p-10 overflow-hidden">
          {/* BG glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#6C3EF4] opacity-[0.07] blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#00D4AA] opacity-[0.07] blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6C3EF4] to-[#00D4AA] flex items-center justify-center shadow-[0_0_30px_rgba(108,62,244,0.3)]">
                <span className="text-3xl font-extrabold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#00D4AA] rounded-full flex items-center justify-center shadow-lg border-2 border-[#07061A]">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  @{displayName}
                </h1>
                <div className="flex items-center gap-1.5 bg-[#1A1200] border border-[#F0BB38] px-3 py-1 rounded-full">
                  <img src={founderBadge} alt="Founder" className="w-4 h-4" />
                  <span className="text-[10px] font-black text-[#F0BB38] tracking-widest uppercase">Founder</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#A8A0D8] mb-4">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#6C3EF4]" />
                  <span><strong className="text-white">{certCount}</strong> 件の証明書</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#00D4AA]" />
                  <span>SHA-256 認証済み</span>
                </div>
              </div>

              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 bg-[#00D4AA]/10 border border-[#00D4AA]/30 px-4 py-2 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#00D4AA]" />
                <span className="text-[11px] font-bold text-[#00D4AA] tracking-wide">
                  このクリエイターの作品はすべてProofMarkによりデジタル存在証明されています
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      <div className="max-w-5xl mx-auto px-6">
        {certs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-[#0D0B24] border border-[#1C1A38] flex items-center justify-center mx-auto mb-5">
              <ImageIcon className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-[#A8A0D8] font-bold">公開中の作品がありません</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-extrabold text-white">作品ギャラリー</h2>
              <span className="text-xs font-bold text-[#00D4AA] bg-[#00D4AA]/10 border border-[#00D4AA]/20 px-2.5 py-0.5 rounded-full">
                {certs.length} 作品
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {certs.map((cert, idx) => {
                const imgUrl = cert.image_url ||
                  (cert.metadata?.image_url as string | undefined);
                const filename = cert.metadata?.filename || `作品 #${idx + 1}`;
                const aiTool = cert.metadata?.ai_tool as string | undefined;
                const dateStr = new Date(cert.created_at).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                });

                return (
                  <Link key={cert.id} href={`/cert/${cert.id}`}>
                    <div className="group relative bg-[#0D0B24] border border-[#1C1A38] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#6C3EF4]/60 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(108,62,244,0.2)]">
                      {/* Image / Placeholder */}
                      <div className="aspect-square overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={filename}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <ZKPlaceholder />
                        )}
                      </div>

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07061A] via-[#07061A]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                        <p className="text-white text-xs font-bold truncate mb-1">{filename}</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#A8A0D8]" />
                          <span className="text-[#A8A0D8] text-[10px]">{dateStr}</span>
                        </div>
                        {aiTool && (
                          <span className="mt-1.5 text-[9px] font-bold text-[#6C3EF4] bg-[#6C3EF4]/10 border border-[#6C3EF4]/20 px-2 py-0.5 rounded-full w-fit">
                            {aiTool}
                          </span>
                        )}
                      </div>

                      {/* Verified badge (always visible) */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-[#00D4AA]" />
                        <span className="text-[9px] font-bold text-[#00D4AA] tracking-wider uppercase">Verified</span>
                      </div>

                      {/* Arrow icon on hover */}
                      <div className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ── Footer CTA ── */}
        <div className="mt-16 bg-[#0D0B24] border border-[#1C1A38] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-[#6C3EF4] tracking-widest uppercase mb-1">Powered by ProofMark</p>
            <p className="text-sm text-[#A8A0D8] max-w-sm">
              あなたも作品のデジタル存在証明を無料で始めましょう。運営すら原画を閲覧できない完全秘匿設計。
            </p>
          </div>
          <Link href="/">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C3EF4] to-[#00D4AA] text-white font-extrabold px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(108,62,244,0.3)] cursor-pointer text-sm whitespace-nowrap">
              無料で始める <ExternalLink className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Verify link bar */}
        <p className="text-center text-xs text-[#48456A] mt-8">
          各作品のハッシュ値は <span className="font-mono text-[#6C3EF4]">{certVerifyBase}[id]</span> で第三者検証可能です。
        </p>
      </div>
    </div>
  );
}
