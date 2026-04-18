import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ProcessBundlePublic } from '../../lib/proofmark-types';

const stepLabels: Record<string, string> = {
  rough: 'Rough',
  lineart: 'Line',
  color: 'Color',
  final: 'Final',
  other: 'Step',
};

function formatShortHash(hash: string, prefix = 10, suffix = 8): string {
  if (!hash || hash.length <= prefix + suffix) return hash || '—';
  return `${hash.slice(0, prefix)}…${hash.slice(-suffix)}`;
}

export function ProofBundleTimelineCard({ bundle }: { bundle: ProcessBundlePublic }) {
  const orderedSteps = [...bundle.steps].sort((a, b) => a.step_index - b.step_index);
  const chain = bundle.chain_summary;

  return (
    <section className="w-full bg-[#0D0B24] border border-[#1C1A38] rounded-3xl p-6 shadow-[0_0_50px_rgba(108,62,244,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#A8A0D8]">Chain of Evidence</div>
          <h3 className="mt-2 text-2xl font-bold text-white">{bundle.title}</h3>
          {bundle.description ? (
            <p className="mt-2 max-w-2xl text-sm text-[#A8A0D8]">{bundle.description}</p>
          ) : null}
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            chain?.valid
              ? 'border-[#00D4AA]/20 bg-[#00D4AA]/10 text-[#00D4AA]'
              : 'border-[#F0BB38]/20 bg-[#F0BB38]/10 text-[#F0BB38]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {chain?.valid ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {chain?.valid ? 'Integrity verified' : 'Integrity needs review'}
          </div>
          <div className="mt-1 text-xs opacity-80">
            {bundle.evidence_mode ?? 'hash_chain_v1'} · {chain?.chainDepth ?? orderedSteps.length} linked steps
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <div className="space-y-4">
          {orderedSteps.map((step, index) => {
            const isBroken = !!chain?.mismatches?.includes(step.id);
            return (
              <article
                key={step.id}
                className="relative overflow-hidden rounded-2xl border border-[#1C1A38] bg-[#07061A]"
              >
                {/* Chain integrity indicator bar */}
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${
                    isBroken ? 'bg-[#F0BB38]' : 'bg-gradient-to-b from-[#6C3EF4] to-[#00D4AA]'
                  }`}
                />
                <div className="grid md:grid-cols-[200px_minmax(0,1fr)]">
                  {step.preview_url ? (
                    <img
                      src={step.preview_url}
                      alt={step.title}
                      className="aspect-square h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-sm text-[#A8A0D8] border-r border-[#1C1A38]">
                      No preview
                    </div>
                  )}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[#1C1A38] bg-[#0D0B24] px-2 py-1 text-[10px] uppercase tracking-widest text-[#00D4AA]">
                          {stepLabels[step.step_type] ?? stepLabels.other}
                        </span>
                        <span className="text-[11px] text-[#A8A0D8]">Step {index + 1}</span>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isBroken ? 'text-[#F0BB38]' : 'text-[#00D4AA]'
                        }`}
                      >
                        {isBroken ? (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {isBroken ? 'Mismatch detected' : 'Linked'}
                      </div>
                    </div>

                    <div>
                      <div className="text-base font-semibold text-white">{step.title}</div>
                      {step.description ? (
                        <p className="mt-2 text-sm text-[#A8A0D8]">{step.description}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <ChainMeta label="Asset SHA-256" value={formatShortHash(step.sha256, 14, 12)} mono />
                      <ChainMeta label="Chain SHA-256" value={formatShortHash(step.chain_sha256 || '', 14, 12)} mono />
                      <ChainMeta
                        label="Previous link"
                        value={step.prev_step_id ? 'Linked to previous step' : 'Chain root'}
                      />
                      <ChainMeta
                        label="Issued at"
                        value={
                          step.issued_at
                            ? new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(
                                new Date(step.issued_at)
                              )
                            : '—'
                        }
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#1C1A38] bg-[#07061A] p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#A8A0D8]">Evidence Summary</div>
            <dl className="mt-4 space-y-3">
              <SummaryRow label="Verification" value={chain?.valid ? 'Verified' : 'Needs review'} />
              <SummaryRow label="Root step" value={chain?.rootStepId ? formatShortHash(chain.rootStepId, 8, 6) : '—'} />
              <SummaryRow label="Head step" value={chain?.headStepId ? formatShortHash(chain.headStepId, 8, 6) : '—'} />
              <SummaryRow
                label="Head chain hash"
                value={chain?.headChainSha256 ? formatShortHash(chain.headChainSha256, 12, 10) : '—'}
                mono
              />
              <SummaryRow label="Stored chain depth" value={String(bundle.chain_depth ?? orderedSteps.length)} />
            </dl>
          </div>

          <div className="rounded-2xl border border-[#1C1A38] bg-[#07061A] p-5 text-sm text-[#A8A0D8]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#A8A0D8] mb-3">What is protected</div>
            <p className="leading-6">
              各工程は、ファイルハッシュだけでなく、タイトル・種別・説明・前工程のチェーンハッシュを含む canonical
              payload から再計算できます。途中の工程を1つでも差し替えると、後続工程の chain hash も一致しなくなります。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChainMeta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1C1A38] bg-[#0D0B24] p-3">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-[#A8A0D8]">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono text-white' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1C1A38] bg-[#0D0B24] p-3">
      <dt className="text-[10px] uppercase tracking-widest text-[#A8A0D8]">{label}</dt>
      <dd className={`mt-1 text-sm ${mono ? 'font-mono text-white' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
