import { Link } from 'wouter';
import { FileText, ArrowLeft } from 'lucide-react';
import navbarLogo from '../assets/logo/navbar/proofmark-navbar-symbol-dark.svg';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans pb-24">
      {/* ── Header ── */}
      <div className="w-full border-b border-[#1C1A38] bg-[#0D0B24]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-decoration-none">
            <img src={navbarLogo} alt="ProofMark" className="h-6 w-auto" />
            <span className="font-['Syne'] text-lg font-extrabold text-[#F0EFF8]">
              Proof<span className="text-[#00D4AA]">Mark</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#A8A0D8] hover:text-[#00D4AA] transition-colors">
            <ArrowLeft className="w-4 h-4" /> トップに戻る
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-6 pt-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-[#6C3EF4]/10 border border-[#6C3EF4]/30 text-[#6C3EF4] px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-6">
            <FileText className="w-4 h-4" /> Terms of Service
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">利用規約</h1>
          <p className="text-[#A8A0D8] text-sm">最終更新日：2026年4月</p>
        </div>

        <div className="space-y-10 text-[#D4D0F4] text-sm md:text-base leading-loose">
          <section>
            <p>この利用規約（以下、「本規約」といいます。）は、ProofMark（以下、「当サービス」といいます。）が提供するデジタル存在証明サービスおよびそれに関連するサービスの利用条件を定めるものです。ユーザーの皆様（以下、「ユーザー」といいます。）は、本規約に同意の上、当サービスをご利用ください。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第1条</span> 適用</h2>
            <p>本規約は、ユーザーと当サービスとの間の、サービスの利用に関わる一切の関係に適用されるものとします。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第2条</span> サービスの内容と秘匿性（Zero-Knowledge）</h2>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>当サービスは、ユーザーがブラウザ上で生成したデータのハッシュ値とタイムスタンプを記録し、その存在を証明する仕組みを提供します。</li>
              <li><strong>【完全秘匿性の保証】</strong>当サービスは「Zero-Knowledge（ゼロ知識証明）」のアプローチを採用しており、ユーザーの元画像（原画）データ自体を当サービスのサーバーに送信・保存・解析することは一切ありません。運営側がユーザーの作品内容を閲覧することは技術的に不可能です。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第3条</span> 禁止事項</h2>
            <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-2 mt-3 ml-2 text-[#A8A0D8]">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービス、他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>他人の著作物を、著作者の許可なく自身のものとして証明書を発行する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第4条</span> 免責事項</h2>
            <p>当サービスは、発行された証明書のハッシュ値およびタイムスタンプの技術的な正確性を保証するものであり、証明対象となるデータ（作品）の著作権の帰属、独自性、または法的な正当性を最終的に保証するものではありません。当サービスの利用により生じたユーザー間のトラブル等について、運営は一切の責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第5条</span> 規約の変更</h2>
            <p>当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
