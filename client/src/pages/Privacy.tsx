import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { fadeInVariants, staggerContainer } from "@/lib/animations";
import { Shield, Eye, Lock, Database, Globe, Bell, Mail, Info, CheckCircle } from "lucide-react";

export default function Privacy() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#00D4AA]/30">
      <Navbar user={user} signOut={signOut} />
      
      <main className="relative pt-32 pb-24 px-6">
        {/* 背景装飾 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#00D4AA]/10 to-transparent pointer-events-none" />
        
        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInVariants} className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-bold mb-4 uppercase tracking-widest">
              Privacy Policy
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">プライバシーポリシー</h1>
            <p className="text-[#A8A0D8] text-sm">最終更新日: 2026年4月7日</p>
          </motion.div>

          <div className="space-y-12">
            {/* セクション1 */}
            <motion.section variants={fadeInVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#15132D] border border-[#2a2a4e] flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#00D4AA]" />
                </div>
                <h2 className="text-xl font-bold">セクション1: 個人情報の取得と利用目的</h2>
              </div>
              <div className="text-[#A8A0D8] leading-relaxed pl-13 space-y-4">
                <p>
                  ProofMark運営事務局は、お客様が本サービスを利用する際、メールアドレス、支払い情報、利用状況などの個人情報を取得することがあります。これらの情報は、サービスの提供、本人確認、カスタマーサポート、サービス向上、および必要に応じた通知のために利用されます。
                </p>
              </div>
            </motion.section>

            {/* セクション2 - Alert風デザイン */}
            <motion.section variants={fadeInVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#15132D] border border-[#2a2a4e] flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#6C3EF4]" />
                </div>
                <h2 className="text-xl font-bold">セクション2: 取得する情報</h2>
              </div>
              
              <div className="pl-13">
                <div className="bg-[#0D1524] border border-[#00D4AA]/30 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-24 h-24 text-[#00D4AA]" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-6 h-6 text-[#00D4AA]" />
                    <h2 className="text-xl font-bold text-[#00D4AA]">重要: お客様の作品データについて</h2>
                  </div>
                  <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#00D4AA]">
                    <p className="font-bold">
                      ProofMarkは、お客様がアップロードするデジタルコンテンツそのものをサーバーに保存しません。
                    </p>
                    <p className="opacity-90">
                      ブラウザ内でSHA-256ハッシュ値を計算し、そのハッシュ値とタイムスタンプのみを記録します。これにより、お客様のプライバシーと作品の機密性を最大限に保護します。（※Shareable Proofモードを選択した場合は除きます）
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* セクション3〜7 (標準的な内容) */}
            <motion.section variants={fadeInVariants} className="space-y-10 pt-8 border-t border-[#2a2a4e]">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 pl-13">
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-white"><Globe className="w-4 h-4 text-blue-400" /> セクション3: 第三者提供</h3>
                  <p className="text-sm text-[#A8A0D8] leading-relaxed">
                    法令に基づく場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。ただし、決済処理やメール配信などの外部サービスを利用する場合があります。
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-white"><Lock className="w-4 h-4 text-[#00D4AA]" /> セクション4: 安全管理</h3>
                  <p className="text-sm text-[#A8A0D8] leading-relaxed">
                    個人情報の漏洩、滅失または毀損の防止その他の安全管理のために、SSL暗号化通信やファイアウォールなどの技術的・組織的な措置を講じています。
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-white"><CheckCircle className="w-4 h-4 text-purple-400" /> セクション5: Cookieの利用</h3>
                  <p className="text-sm text-[#A8A0D8] leading-relaxed">
                    ユーザーの利便性向上や広告配信、アクセス解析のためにCookieを使用することがあります。ブラウザの設定によりCookieを無効にすることも可能です。
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-white"><Bell className="w-4 h-4 text-orange-400" /> セクション6: ポリシーの変更</h3>
                  <p className="text-sm text-[#A8A0D8] leading-relaxed">
                    個人情報保護法等の改正に伴い、本ポリシーを予告なく変更することがあります。重要な変更がある場合は、サイト上で告知いたします。
                  </p>
                </div>
              </div>

              <div className="bg-[#15132D] border border-[#2a2a4e] p-8 rounded-2xl pl-13 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-white mb-2 ml-[-3.25rem] pl-13 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#6C3EF4]" /> セクション7: お問い合わせ窓口
                  </h3>
                  <p className="text-sm text-[#A8A0D8]">
                    プライバシーに関するお問い合わせは、ダッシュボード内のお問い合わせフォームよりご連絡ください。
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
