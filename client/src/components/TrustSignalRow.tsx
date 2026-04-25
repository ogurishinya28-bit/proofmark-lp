import { Link } from 'wouter';
import { ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { PROOFMARK_COPY } from '../lib/proofmark-copy';

/**
 * ヒーロー直下に固定表示する3カード。
 * レポート指摘の「ヒーロー直下に証明する/しない/現在TSA」をそのまま実装。
 * UI言語と Trust Center / FAQ の表現を一致させるため、本コンポーネントは
 * proofmark-copy.ts (SSOT) のテキストだけを使う。
 */
export default function TrustSignalRow() {
  const c = PROOFMARK_COPY;

  return (
    <section
      aria-label="ProofMarkの整合性ステータス"
      className="relative z-10 mx-auto -mt-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#00D4AA]/25 bg-[#0A0F1F]/85 p-6 backdrop-blur-md shadow-[0_10px_60px_rgba(0,212,170,0.10)]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D4AA]">
            <ShieldCheck className="h-3.5 w-3.5" />
            証明すること
          </div>
          <h3 className="text-base font-bold text-white">{c.proves.title}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#C8C2EA]">
            {c.proves.bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D4AA]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#F0BB38]/25 bg-[#0A0F1F]/85 p-6 backdrop-blur-md shadow-[0_10px_60px_rgba(240,187,56,0.08)]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F0BB38]/30 bg-[#F0BB38]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F0BB38]">
            <ShieldAlert className="h-3.5 w-3.5" />
            証明しないこと
          </div>
          <h3 className="text-base font-bold text-white">{c.notProves.title}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#C8C2EA]">
            {c.notProves.bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F0BB38]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#6C3EF4]/30 bg-[#0A0F1F]/85 p-6 backdrop-blur-md shadow-[0_10px_60px_rgba(108,62,244,0.10)]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6C3EF4]/30 bg-[#6C3EF4]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#BC78FF]">
            <Activity className="h-3.5 w-3.5" />
            現在のTSAステータス
          </div>
          <h3 className="text-base font-bold text-white">{c.trust.title}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#C8C2EA]">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BC78FF]" aria-hidden />
              <span>{c.trust.rfc3161}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BC78FF]" aria-hidden />
              <span>{c.trust.privateProof}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BC78FF]" aria-hidden />
              <span>{c.trust.independent}</span>
            </li>
          </ul>
          <Link
            href={c.trust.tsaLinkHref}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#00D4AA] hover:text-white transition-colors"
          >
            {c.trust.tsaLinkLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}
