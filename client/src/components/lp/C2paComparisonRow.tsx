/**
 * C2paComparisonRow.tsx — Phase 11.B 戦略的ポジショニングセクション
 *
 * "ProofMark / C2PA / Blockchain" を 3 カラムで提示し、ProofMark を
 * 「C2PA を保護する強固なシェル」として位置付ける。
 *
 * 設計:
 *   • TrustSignalRow.tsx の DNA を継承 (motion / 角丸 / blur / hex tokens)。
 *   • Zero-Dependency: 既に存在する framer-motion + lucide-react のみ。
 *   • Apple-level の余白: 縦 96px / カード間 20px / md:24px。
 *   • アクセシビリティ: <table> ではなく <section> + 3 <article>。
 *     スクリーンリーダーには aria-label + role="list"/"listitem"。
 *   • 真ん中の ProofMark カラムは「中央 + 強調」。視覚的にこの製品が
 *     C2PA / Blockchain を包むシェルである立体感を与える。
 *   • dark theme 専用 — Manus DNA #00D4AA / #6C3EF4 / #BC78FF / #F0BB38。
 *   • prefers-reduced-motion に従い、in-view アニメは自動で抑制される。
 */

import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Layers3,
  Coins,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Link2,
} from 'lucide-react';

type Stance = 'covers' | 'partial' | 'gap';

interface Bullet {
  stance: Stance;
  text: string;
}

interface ColumnSpec {
  id: 'proofmark' | 'c2pa' | 'blockchain';
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  cardBorder: string;
  cardGlow: string;
  bullets: Bullet[];
  /** ProofMark カラムだけ true。中央 + 強調 + relation 帯を表示する。 */
  hero?: boolean;
}

const COLUMNS: ColumnSpec[] = [
  {
    id: 'c2pa',
    badge: 'C2PA · Content Credentials',
    badgeColor: '#BC78FF',
    badgeBg: 'rgba(108,62,244,0.10)',
    badgeBorder: 'rgba(108,62,244,0.40)',
    title: '来歴証明',
    subtitle: 'どう作られたか',
    Icon: Layers3,
    cardBorder: 'border-[#6C3EF4]/25 hover:border-[#6C3EF4]/55',
    cardGlow: 'bg-[#6C3EF4]/10',
    bullets: [
      { stance: 'covers', text: '生成 / 編集の来歴メタデータを画像内に埋め込み' },
      { stance: 'covers', text: 'Adobe / OpenAI など各社の標準フォーマット' },
      { stance: 'gap', text: 'SNS にアップロードするとメタデータが落とされる脆弱性' },
      { stance: 'gap', text: '署名が壊れると外部の検証ツールでは "信頼不可" となる' },
    ],
  },
  {
    id: 'proofmark',
    badge: 'ProofMark · Existence Layer',
    badgeColor: '#00D4AA',
    badgeBg: 'rgba(0,212,170,0.10)',
    badgeBorder: 'rgba(0,212,170,0.40)',
    title: '存在時点証明',
    subtitle: 'いつから存在するか',
    Icon: ShieldCheck,
    cardBorder: 'border-[#00D4AA]/35 hover:border-[#00D4AA]/65',
    cardGlow: 'bg-[#00D4AA]/15',
    hero: true,
    bullets: [
      { stance: 'covers', text: '改ざん不能な RFC3161 タイムスタンプ' },
      { stance: 'covers', text: 'SNS にアップロードした後も検証 URL で証明できる' },
      { stance: 'covers', text: 'C2PA を Evidence Pack に同梱して再配布する筒' },
      { stance: 'covers', text: '原画は預けず、ハッシュだけで存在を証明する' },
    ],
  },
  {
    id: 'blockchain',
    badge: 'Blockchain · NFT 系',
    badgeColor: '#F0BB38',
    badgeBg: 'rgba(240,187,56,0.10)',
    badgeBorder: 'rgba(240,187,56,0.40)',
    title: '台帳記録',
    subtitle: 'どこに記録したか',
    Icon: Coins,
    cardBorder: 'border-[#F0BB38]/25 hover:border-[#F0BB38]/55',
    cardGlow: 'bg-[#F0BB38]/10',
    bullets: [
      { stance: 'partial', text: '台帳に記録すれば改ざんは困難' },
      { stance: 'gap', text: 'ガス代の高騰で 1 件あたりのコストが安定しない' },
      { stance: 'gap', text: '主要国での法整備が追いついていない' },
      { stance: 'gap', text: 'チェーンの計算負荷で環境負荷の懸念がある' },
    ],
  },
];

const STANCE_ICON: Record<Stance, React.ComponentType<{ className?: string }>> = {
  covers: Check,
  partial: AlertTriangle,
  gap: X,
};

const STANCE_COLOR: Record<Stance, string> = {
  covers: '#00D4AA',
  partial: '#F0BB38',
  gap: '#FF7B7B',
};

const cardBase =
  'group relative overflow-hidden rounded-2xl border bg-[#0D0B24]/85 p-6 backdrop-blur-md transition-all duration-300';

export default function C2paComparisonRow() {
  const reducedMotion = useReducedMotion();

  const motionProps = (delay: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        };

  return (
    <section
      aria-label="ProofMark / C2PA / Blockchain の戦略的比較"
      className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28"
    >
      {/* ── ヘッダ ────────────────────────────────────────── */}
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{
            color: '#00D4AA',
            background: 'rgba(0,212,170,0.10)',
            border: '1px solid rgba(0,212,170,0.40)',
          }}
        >
          <Link2 className="h-3 w-3" aria-hidden="true" />
          C2PA × ProofMark · 補完関係
        </span>
        <h2 className="mt-5 font-display text-[28px] font-extrabold leading-tight text-white sm:text-[36px]">
          C2PA があれば ProofMark は不要、<br className="hidden sm:block" />
          ではありません。
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#A8A0D8] sm:text-[15px]">
          C2PA は<strong className="text-white">「どう作られたか」</strong>を語る来歴情報、
          ProofMark は<strong className="text-white">「いつから存在するか」</strong>を語る存在時点情報。
          私たちは C2PA を敵視せず、来歴メタデータを RFC3161 タイムスタンプの強固なシェルとして包み込みます。
        </p>
      </div>

      {/* ── 3 カラム比較 ───────────────────────────────────── */}
      <div
        role="list"
        className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
      >
        {COLUMNS.map((col, i) => {
          const Icon = col.Icon;
          return (
            <motion.article
              role="listitem"
              key={col.id}
              {...motionProps(0.06 * i)}
              className={[
                cardBase,
                col.cardBorder,
                col.hero ? 'md:scale-[1.04] md:shadow-[0_24px_60px_-30px_rgba(0,212,170,0.5)]' : '',
              ].join(' ')}
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${col.cardGlow} blur-2xl`}
              />
              {col.hero && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(108,62,244,0.7) 30%, rgba(0,212,170,0.7) 70%, transparent 100%)',
                  }}
                />
              )}

              <header className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: col.badgeColor }} aria-hidden="true" />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: col.badgeColor }}
                >
                  {col.badge}
                </span>
              </header>

              <h3 className="font-display text-[22px] font-extrabold leading-tight text-white">
                {col.title}
              </h3>
              <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-[#A8A0D8]">
                {col.subtitle}
              </p>

              <ul className="mt-5 space-y-3">
                {col.bullets.map((b, idx) => {
                  const StanceIcon = STANCE_ICON[b.stance];
                  return (
                    <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-[#D4D0F4]">
                      <span
                        aria-hidden="true"
                        className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{
                          color: STANCE_COLOR[b.stance],
                          background: `${STANCE_COLOR[b.stance]}1A`,
                          border: `1px solid ${STANCE_COLOR[b.stance]}55`,
                        }}
                      >
                        <StanceIcon className="h-2.5 w-2.5" />
                      </span>
                      <span>{b.text}</span>
                    </li>
                  );
                })}
              </ul>

              {col.hero && (
                <p className="mt-6 rounded-xl border border-[#00D4AA]/25 bg-[#00D4AA]/[0.06] px-3 py-2 text-[11px] leading-relaxed text-[#9DEAD6]">
                  C2PA の来歴情報を、ProofMark の RFC3161 タイムスタンプが強固なシェルとして保護します。
                </p>
              )}
            </motion.article>
          );
        })}
      </div>

      {/* ── 関係図（補完帯） ─────────────────────────────────── */}
      <motion.div
        {...motionProps(0.18)}
        className="relative mx-auto mt-14 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-[#1C1A38] bg-[#0D0B24]/85 px-6 py-5 text-center backdrop-blur-md sm:flex-row sm:gap-4 sm:text-left"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            color: '#00D4AA',
            background: 'rgba(0,212,170,0.12)',
            border: '1px solid rgba(0,212,170,0.45)',
          }}
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="flex-1 text-[13px] leading-relaxed text-[#D4D0F4]">
          <strong className="text-white">ProofMark × C2PA は相互補完関係です。</strong>{' '}
          C2PA の来歴情報は ProofMark の Evidence Pack に <code className="rounded bg-[#0a0e27] px-1.5 py-0.5 text-[11px] text-[#9DEAD6]">c2pa.json</code> として同梱され、
          RFC3161 タイムスタンプのシェルに包まれて再配布可能になります。
        </p>
        <a
          href="/c2pa-vs-proofmark"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#BC78FF] hover:text-white"
          aria-label="C2PA と ProofMark の関係をさらに読む"
        >
          技術比較ガイドへ
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </motion.div>
    </section>
  );
}
