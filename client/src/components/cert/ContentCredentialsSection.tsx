/**
 * ContentCredentialsSection — final ProofMark-native C2PA section.
 *
 * Styled like the RFC3161 area instead of a generic alert banner.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Cpu,
  ExternalLink,
  FileImage,
  Fingerprint,
  Layers3,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  formatAiUsageLabel,
  formatValidityLabel,
  getC2paSummary,
} from '../../lib/c2pa-schema';

interface Props {
  manifest: unknown;
  compact?: boolean;
}

export function ContentCredentialsSection({ manifest, compact = false }: Props) {
  const summary = getC2paSummary(manifest);
  const tone = !summary.present
    ? { color: '#A8A0D8', border: 'rgba(168,160,216,0.30)', bg: 'rgba(168,160,216,0.08)', Icon: Fingerprint }
    : summary.valid === false
    ? { color: '#FF7B7B', border: 'rgba(255,123,123,0.38)', bg: 'rgba(255,123,123,0.10)', Icon: ShieldAlert }
    : summary.aiUsed === true
    ? { color: '#00D4AA', border: 'rgba(0,212,170,0.40)', bg: 'rgba(0,212,170,0.10)', Icon: Wand2 }
    : { color: '#6C3EF4', border: 'rgba(108,62,244,0.38)', bg: 'rgba(108,62,244,0.10)', Icon: BadgeCheck };
  const Icon = tone.Icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-labelledby="content-credentials-title"
      className="relative overflow-hidden rounded-[calc(0.65rem+6px)] border border-[#1C1A38] bg-[#0D0B24] shadow-[0_18px_60px_rgba(4,8,20,0.35)]"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(108,62,244,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(0,212,170,0.10),transparent_40%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(108,62,244,0.7),rgba(0,212,170,0.7),transparent)]" />

      <header className={`relative px-5 sm:px-6 ${compact ? 'pt-4 pb-3' : 'pt-5 pb-4'} border-b border-[#1C1A38]`}>
        <div className="flex items-start gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(0.65rem-1px)]"
            style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}
            >
              <Layers3 className="h-3 w-3" aria-hidden="true" />
              Internal Provenance Vault
            </p>
            <h2 id="content-credentials-title" className="mt-2 font-display text-[20px] font-extrabold leading-tight text-white">
              Content Credentials
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[#A8A0D8]">
              外部の RFC3161 タイムスタンプと並ぶ、画像内の内部由来情報です。署名が壊れていても RFC3161 フローは継続し、ここではその状態を明示します。
            </p>
          </div>
        </div>
      </header>

      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <VaultMetric icon={<ShieldCheck className="h-4 w-4" />} label="署名状態" value={formatValidityLabel(summary.validity)} color={tone.color} />
          <VaultMetric icon={<Wand2 className="h-4 w-4" />} label="AI usage" value={formatAiUsageLabel(summary)} color={summary.aiUsed === true ? '#00D4AA' : '#A8A0D8'} />
          <VaultMetric icon={<BadgeCheck className="h-4 w-4" />} label="Issuer" value={summary.issuer ?? '未開示'} color="#6C3EF4" />
          <VaultMetric icon={<Cpu className="h-4 w-4" />} label="Software" value={summary.software ?? '未開示'} color="#FFD966" />
        </div>

        {summary.present ? (
          <>
            <div className="mt-4 rounded-[calc(0.65rem+2px)] border border-[#2a2a4e] bg-[linear-gradient(180deg,rgba(10,14,39,0.85),rgba(21,29,47,0.85))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8A0D8]">ProofMark reading</p>
                  <h3 className="mt-1 text-sm font-bold text-white">
                    {summary.aiUsed === true
                      ? 'AI generation / edit history was declared in the embedded manifest.'
                      : summary.aiUsed === false
                      ? 'The embedded manifest does not declare generative AI usage.'
                      : 'The embedded manifest exists, but AI usage could not be determined.'}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#A8A0D8]">
                    {summary.issuer ? `Issuer: ${summary.issuer}. ` : ''}
                    {summary.aiProvider ? `Provider: ${summary.aiProvider}. ` : ''}
                    {summary.device ? `Device: ${summary.device}. ` : ''}
                    {summary.manifestLabel ? `Manifest: ${summary.manifestLabel}.` : ''}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {summary.valid === false ? 'Fractured but recorded' : summary.aiUsed === true ? 'AI trace embedded' : 'Vault aligned'}
                </span>
              </div>
            </div>

            {summary.valid === false && summary.reason && (
              <div className="mt-4 flex items-start gap-2 rounded-[calc(0.65rem+2px)] border border-[#FF7B7B]/35 bg-[#FF7B7B]/10 px-3.5 py-3 text-[12px] text-[#FFD0D0]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  <span className="font-semibold">署名注意:</span> {summary.reason}
                </p>
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[calc(0.65rem+2px)] border border-[#2a2a4e] bg-[#151d2f]/70 p-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A8A0D8]">
                  <FileImage className="h-3.5 w-3.5" aria-hidden="true" />
                  Assertion summary
                </p>
                {summary.assertionsCount > 0 ? (
                  <p className="text-[12px] leading-relaxed text-[#D8D4F5]">
                    この作品には {summary.assertionsCount} 件の assertion が含まれます。Certificate Page では最小限の公開情報だけを表示し、サムネイルやバイナリは送信・保存しません。
                  </p>
                ) : (
                  <p className="text-[12px] leading-relaxed text-[#A8A0D8]">表示可能な assertion はありません。</p>
                )}
              </div>

              <div className="rounded-[calc(0.65rem+2px)] border border-[#2a2a4e] bg-[#151d2f]/70 p-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A8A0D8]">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                  Ingredient trace
                </p>
                <p className="text-[12px] leading-relaxed text-[#D8D4F5]">
                  由来素材: {summary.ingredientsCount} 件
                  {summary.aiProvider ? ` · Provider ${summary.aiProvider}` : ''}
                  {summary.device ? ` · Device ${summary.device}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[#A8A0D8]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a4e] bg-[#151d2f]/60 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00D4AA]" aria-hidden="true" />
                RFC3161 と独立して記録
              </span>
              {summary.present && (
                <a
                  href="https://contentcredentials.org/verify"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a4e] bg-[#151d2f]/60 px-3 py-1.5 transition-colors hover:border-[#00D4AA]/40 hover:text-white"
                >
                  外部 C2PA verify
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-[calc(0.65rem+2px)] border border-[#2a2a4e] bg-[#151d2f]/70 p-4 text-[12px] leading-relaxed text-[#A8A0D8]">
            この作品には Content Credentials は埋め込まれていません。ProofMark は RFC3161 タイムスタンプによる外部証明を維持しつつ、C2PA が存在する場合のみ内部由来情報を静かに統合します。
          </div>
        )}
      </div>
    </motion.section>
  );
}

function VaultMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[calc(0.65rem+2px)] border border-[#2a2a4e] bg-[#151d2f]/70 p-3.5">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8A0D8]">
        <span style={{ color }}>{icon}</span>
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-snug text-white">{value}</p>
    </div>
  );
}
