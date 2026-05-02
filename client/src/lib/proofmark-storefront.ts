/**
 * proofmark-storefront.ts — storefront SSOT tokens with native C2PA support.
 */

import {
  DELIVERY_STATUS_TOKENS,
  type DeliveryStatus,
  type StatusToken,
} from './proofmark-ops';
import { formatAiUsageLabel, getC2paSummary, type C2paVisualSummary } from './c2pa-schema';

export { DELIVERY_STATUS_TOKENS };
export type { DeliveryStatus, StatusToken };
export { formatAiUsageLabel, getC2paSummary };
export type { C2paVisualSummary };

export type VerifiedTier = 'unverified' | 'pending' | 'verified';
export interface VerifiedBadgeToken {
  tier: VerifiedTier;
  label: string;
  sublabel: string;
  color: string;
  border: string;
  bg: string;
  description: string;
}

export const VERIFIED_TOKENS: Record<VerifiedTier, VerifiedBadgeToken> = {
  verified: {
    tier: 'verified',
    label: 'Verified Studio',
    sublabel: 'ProofMark 認証済',
    color: '#00D4AA',
    border: 'rgba(0,212,170,0.45)',
    bg: 'rgba(0,212,170,0.10)',
    description: '監査チェーンと公開プロフィールが整合した Studio プロフィール。',
  },
  pending: {
    tier: 'pending',
    label: 'Verification Pending',
    sublabel: '認証手続き中',
    color: '#F0BB38',
    border: 'rgba(240,187,56,0.40)',
    bg: 'rgba(240,187,56,0.10)',
    description: '認証が進行中です。',
  },
  unverified: {
    tier: 'unverified',
    label: 'Self-managed',
    sublabel: '本人管理',
    color: '#A8A0D8',
    border: 'rgba(168,160,216,0.30)',
    bg: 'rgba(168,160,216,0.08)',
    description: '本人管理の公開プロフィールです。',
  },
};

export type NdaMode = 'open' | 'masked' | 'hidden';
export const NDA_TOKENS: Record<NdaMode, { label: string; description: string }> = {
  open: { label: '公開実績', description: '作品画像と概要を公開しています。' },
  masked: { label: 'NDA 進行中', description: '画像は秘匿しつつ暗号学的な証明だけを表示します。' },
  hidden: { label: '非公開', description: '公開プロフィールには表示しません。' },
};

export type TsaTier = 'cross' | 'trusted' | 'beta' | 'pending';
export interface TsaTierToken {
  tier: TsaTier;
  label: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  rank: number;
  description: string;
}

export const TSA_TIER_TOKENS: Record<TsaTier, TsaTierToken> = {
  cross: {
    tier: 'cross', label: 'Cross-anchored', short: 'CROSS', color: '#FFD966',
    bg: 'rgba(255,217,102,0.10)', border: 'rgba(255,217,102,0.40)', rank: 0,
    description: '複数の外部アンカーを持つ最上位の証明。',
  },
  trusted: {
    tier: 'trusted', label: 'Trusted TSA', short: 'TRUSTED', color: '#00D4AA',
    bg: 'rgba(0,212,170,0.10)', border: 'rgba(0,212,170,0.40)', rank: 1,
    description: '主要 TSA による RFC3161 タイムスタンプ。',
  },
  beta: {
    tier: 'beta', label: 'Beta TSA', short: 'BETA', color: '#9BA3D4',
    bg: 'rgba(155,163,212,0.08)', border: 'rgba(155,163,212,0.30)', rank: 2,
    description: 'β系 TSA での RFC3161 タイムスタンプ。',
  },
  pending: {
    tier: 'pending', label: 'Issuing', short: 'PENDING', color: '#A8A0D8',
    bg: 'rgba(168,160,216,0.06)', border: 'rgba(168,160,216,0.25)', rank: 3,
    description: 'タイムスタンプ発行待ち。',
  },
};

const TRUSTED_PROVIDERS = new Set(['digicert', 'globalsign', 'seiko', 'sectigo', 'certum']);
export function deriveTsaTier(input: { tsa_provider?: string | null; has_timestamp?: boolean | null; cross_anchors?: number }): TsaTierToken {
  if (!input.has_timestamp) return TSA_TIER_TOKENS.pending;
  if ((input.cross_anchors ?? 0) >= 1) return TSA_TIER_TOKENS.cross;
  return TRUSTED_PROVIDERS.has((input.tsa_provider ?? '').toLowerCase())
    ? TSA_TIER_TOKENS.trusted
    : TSA_TIER_TOKENS.beta;
}

export function shortenHashBlocks(hash: string): string {
  if (!hash || hash.length < 16) return hash || '—';
  const h = hash.toLowerCase();
  return `${h.slice(0, 4)} ${h.slice(4, 8)} … ${h.slice(-8, -4)} ${h.slice(-4)}`;
}

export function formatProofTime(iso?: string | null): { absolute: string; relative: string } {
  if (!iso) return { absolute: '—', relative: '—' };
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { absolute: iso, relative: '—' };
  const d = new Date(iso);
  const absolute = d.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const delta = (Date.now() - t) / 1000;
  const relative =
    delta < 60 ? 'たった今' :
      delta < 3600 ? `${Math.floor(delta / 60)}分前` :
        delta < 86400 ? `${Math.floor(delta / 3600)}時間前` :
          delta < 86400 * 30 ? `${Math.floor(delta / 86400)}日前` :
            delta < 86400 * 365 ? `${Math.floor(delta / 86400 / 30)}ヶ月前` :
              `${Math.floor(delta / 86400 / 365)}年前`;
  return { absolute, relative };
}

export type StorefrontAiFilter = 'all' | 'ai-generated' | 'not-generated';
export const STOREFRONT_AI_FILTERS: Array<{ value: StorefrontAiFilter; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'ai-generated', label: 'AI generated / edited' },
  { value: 'not-generated', label: 'AI generated ではない' },
];

export function matchesAiFilter(rawManifest: unknown, filter: StorefrontAiFilter): boolean {
  if (filter === 'all') return true;
  const summary = getC2paSummary(rawManifest);
  if (filter === 'ai-generated') return summary.aiUsed === true;
  return summary.present && summary.aiUsed === false;
}

export interface C2paVaultTone {
  label: string;
  color: string;
  border: string;
  bg: string;
  gem: string;
  description: string;
}

export function deriveC2paVault(rawManifest: unknown): C2paVaultTone {
  const summary = getC2paSummary(rawManifest);
  if (!summary.present) {
    return {
      label: 'No C2PA',
      color: '#A8A0D8',
      border: 'rgba(168,160,216,0.28)',
      bg: 'rgba(168,160,216,0.08)',
      gem: 'Void',
      description: 'Content Credentials は埋め込まれていません。',
    };
  }
  if (summary.valid === false) {
    return {
      label: 'Broken Signature',
      color: '#FF7B7B',
      border: 'rgba(255,123,123,0.38)',
      bg: 'rgba(255,123,123,0.10)',
      gem: 'Fractured',
      description: '署名は破損していますが RFC3161 フローは継続します。',
    };
  }
  if (summary.aiUsed === true) {
    return {
      label: 'AI Trace',
      color: '#00D4AA',
      border: 'rgba(0,212,170,0.42)',
      bg: 'rgba(0,212,170,0.10)',
      gem: 'Emerald',
      description: formatAiUsageLabel(summary),
    };
  }
  return {
    label: summary.valid === true ? 'Human-first Trace' : 'C2PA Present',
    color: '#6C3EF4',
    border: 'rgba(108,62,244,0.40)',
    bg: 'rgba(108,62,244,0.10)',
    gem: 'Violet',
    description: summary.valid === true ? '署名整合済みの内部由来情報。' : 'Content Credentials を検出しました。',
  };
}
