import React from "react";
import { Scale, Check, Plus, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import SEO from "../components/SEO";

export default function CompareC2PA() {
  const comparisonData = [
    {
      feature: "主な目的",
      proofmark: "デジタルコンテンツの「特定日時における存在証明」と「非改ざん証明」",
      c2pa: "デジタルコンテンツの「来歴（来し方）」と「真正性」の検証",
      highlight: true
    },
    {
      feature: "証明の対象",
      proofmark: "コンテンツのSHA-256ハッシュ値とタイムスタンプ",
      c2pa: "コンテンツに埋め込まれたメタデータ（作成者、編集履歴など）"
    },
    {
      feature: "技術的基盤",
      proofmark: "SHA-256ハッシュ、RFC3161準拠タイムスタンプ",
      c2pa: "暗号技術を用いたコンテンツクレデンシャル（メタデータ）の埋め込み"
    },
    {
      feature: "プライバシー",
      proofmark: "作品データそのものはサーバーに保存せず、ブラウザ内でハッシュ値を計算。",
      c2pa: "コンテンツにメタデータが埋め込まれるため、共有時に情報が含まれる。",
      highlight: true
    },
    {
      feature: "独立性",
      proofmark: "ファイル形式やプラットフォームに依存せず、あらゆるデジタルコンテンツに対応。",
      c2pa: "C2PA対応ツールやプラットフォームでの利用が前提。",
      highlight: true
    },
    {
      feature: "法的証拠力",
      proofmark: "RFC3161準拠のタイムスタンプにより、法的証拠力を持つ。",
      c2pa: "来歴の信頼性向上に寄与するが、直接的な法的証明とは異なる。",
      highlight: true
    },
    {
      feature: "クリエイターメリット",
      proofmark: "「いつ作品が存在したか」を客観的に証明し、著作権紛争時の強力な証拠となる。",
      c2pa: "作品の透明性を高め、信頼できる情報源からのコンテンツであることを示す。"
    }
  ];

  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] pt-32 pb-24 px-6 md:px-12">
      <SEO 
        title="C2PAとProofMarkの違い | AIクリエイターに最適な権利保護とは？"
        description="デジタルコンテンツの信頼性確保において、ProofMarkとC2PAはどう違うのか？特徴を比較し、AIクリエイターの権利保護に最適な方法を解説します。"
        url="https://proofmark.jp/compare-c2pa"
      />
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] text-xs font-bold tracking-widest uppercase mb-6">
            Comparison
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            ProofMark vs C2PA
          </h1>
          <p className="text-[#A8A0D8] text-lg max-w-3xl mx-auto leading-relaxed">
            デジタルコンテンツの信頼性確保において、ProofMarkとC2PAは異なるアプローチで貢献します。<br className="hidden md:block" />
            それぞれの特徴を理解し、あなたのニーズに最適な選択を見つけましょう。
          </p>
        </header>

        <section className="mb-24 p-10 rounded-3xl bg-[#0D0B24]/50 border border-[#1C1A38] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#6C3EF4]" />
            C2PA (Coalition for Content Provenance and Authenticity) とは？
          </h2>
          <p className="text-[#D4D0F4] leading-relaxed text-lg">
            C2PAは、コンテンツの来歴と真正性を検証するためのオープンな技術標準です。画像や動画などのデジタルコンテンツに、その作成者、編集履歴、使用されたツールなどのメタデータを付与することで、コンテンツの「来歴」を追跡可能にし、フェイクコンテンツ対策に貢献します。Adobe、Microsoft、Intelなどが参加する業界団体によって推進されています。
          </p>
        </section>

        <section className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">ProofMarkとC2PAの比較</h2>
          
          <div className="overflow-x-auto rounded-3xl border border-[#1C1A38] bg-[#0D0B24]/40 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1C1A38] bg-white/[0.02]">
                  <th className="p-8 text-sm font-black text-[#6C3EF4] uppercase tracking-widest">特徴</th>
                  <th className="p-8 text-xl font-black text-white bg-primary/5">ProofMark</th>
                  <th className="p-8 text-xl font-black text-white/60">C2PA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1A38]">
                {comparisonData.map((row, index) => (
                  <tr key={index} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="p-8 font-bold text-white w-1/4 align-top">{row.feature}</td>
                    <td className={`p-8 w-3/8 align-top relative ${row.highlight ? "text-[#00D4AA]" : "text-[#D4D0F4]"}`}>
                      {row.highlight && <div className="absolute inset-y-4 left-2 w-1 bg-[#00D4AA] rounded-full shadow-[0_0_15px_#00D4AA]" />}
                      <div className="flex gap-2">
                        {row.highlight && <Check className="w-5 h-5 flex-shrink-0 mt-1" />}
                        <p className="font-semibold leading-relaxed">{row.proofmark}</p>
                      </div>
                    </td>
                    <td className="p-8 w-3/8 align-top text-[#A8A0D8] leading-relaxed italic opacity-80">
                      {row.c2pa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="p-12 rounded-[2.5rem] bg-gradient-to-br from-[#0D0B24] to-[#0D0B24]/50 border border-[#1C1A38] relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
              <Plus className="w-8 h-8 text-[#00D4AA]" />
              ProofMarkとC2PAは補完し合う関係
            </h2>
            <div className="space-y-6 text-[#D4D0F4] text-lg leading-relaxed">
              <p>
                ProofMarkとC2PAは、デジタルコンテンツの信頼性という共通の目標を持ちながらも、異なる側面からアプローチします。C2PAがコンテンツの「来歴」を重視するのに対し、ProofMarkはコンテンツの「特定日時における存在」と「非改ざん性」に特化しています。
              </p>
              <p>
                理想的には、両者を組み合わせることで、デジタル作品の信頼性をより強固なものにできます。例えば、C2PAメタデータで作品の作成履歴を記録しつつ、ProofMarkでその作品が特定の日時に存在したことを証明することで、多角的な信頼性を確立することが可能です。
              </p>
              <p className="p-6 rounded-2xl bg-[#6C3EF4]/5 border border-[#6C3EF4]/20 font-bold text-white italic">
                ProofMarkは、特にAI生成作品のように「いつ、誰が、どのように作ったか」が曖昧になりがちなコンテンツにおいて、「いつ、その作品が存在したか」という揺るぎない事実を確立する上で、極めて重要な役割を果たします。
              </p>
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/auth?mode=signup">
                <button className="px-12 py-5 rounded-full bg-gradient-to-r from-[#6C3EF4] to-[#8B61FF] text-white font-black text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(108,62,244,0.4)]">
                  無料で存在証明を開始する
                </button>
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-20 text-center">
          <Link href="/" className="inline-flex items-center text-[#6C3EF4] font-bold hover:text-[#00D4AA] transition-colors gap-2">
            ← トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
