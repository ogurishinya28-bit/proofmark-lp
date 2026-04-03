import { Link } from 'wouter';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import navbarLogo from '../assets/logo/navbar/proofmark-navbar-symbol-dark.svg';

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-6">
            <ShieldCheck className="w-4 h-4" /> Privacy Policy
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">プライバシーポリシー</h1>
          <p className="text-[#A8A0D8] text-sm">最終更新日：2026年4月</p>
        </div>

        <div className="space-y-10 text-[#D4D0F4] text-sm md:text-base leading-loose">
          <section>
            <p>ProofMark（以下、「当サービス」といいます。）は、ユーザーの皆様の個人情報およびデータの取り扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第1条</span> 収集する情報</h2>
            <p>当サービスが収集する情報は以下の通りです。</p>
            <ul className="list-disc list-inside space-y-2 mt-3 ml-2 text-[#A8A0D8]">
              <li>アカウント登録時に入力いただく情報（メールアドレス、ユーザー名等）</li>
              <li>証明書発行時に記録される暗号化ハッシュ値（SHA-256）およびタイムスタンプ</li>
              <li>※ユーザーの元画像（原画）データはブラウザ上でハッシュ化されるため、当サーバーには一切送信されず、収集もいたしません。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第2条</span> 利用目的</h2>
            <p>当サービスは、収集した情報を以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-2 mt-3 ml-2 text-[#A8A0D8]">
              <li>デジタル存在証明書の発行および検証機能の提供</li>
              <li>ユーザーサポートおよびお問い合わせ対応</li>
              <li>サービスの改善および新機能の開発</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第3条</span> 第三者提供</h2>
            <p>当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc list-inside space-y-2 mt-3 ml-2 text-[#A8A0D8]">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
            </ul>
            <p className="mt-3">ただし、発行された証明書（公開ポートフォリオや検証ページ）に記載されるハッシュ値、タイムスタンプ、ユーザー名等は、サービスの性質上、公開情報として第三者が閲覧可能な状態となります。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#00D4AA]">第4条</span> プライバシーポリシーの変更</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。変更後のプライバシーポリシーは、当サイトに掲載したときから効力を生じるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
