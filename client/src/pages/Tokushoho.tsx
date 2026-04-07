import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { fadeInVariants, staggerContainer } from "@/lib/animations";
import { Briefcase, User, MapPin, Tag, CreditCard, Clock, Package, RefreshCcw, Info } from "lucide-react";

export default function Tokushoho() {
  const { user, signOut } = useAuth();

  const details = [
    { label: "販売業者", value: "ProofMark運営事務局", icon: <Briefcase className="w-4 h-4" /> },
    { label: "運営統括責任者", value: "(未記載または匿名)", icon: <User className="w-4 h-4" /> },
    { label: "所在地", value: "(未記載または匿名)", icon: <MapPin className="w-4 h-4" /> },
    { label: "商品価格", value: "各商品ページに記載", icon: <Tag className="w-4 h-4" /> },
    { label: "支払方法", value: "クレジットカード決済（Stripe）", icon: <CreditCard className="w-4 h-4" /> },
    { label: "支払時期", value: "クレジットカード決済：商品購入時またはサービス利用開始時", icon: <Clock className="w-4 h-4" /> },
    { label: "商品の引渡時期", value: "デジタルコンテンツおよびサービス：決済完了後、即時利用可能", icon: <Package className="w-4 h-4" /> },
    { label: "返品・交換について", value: "デジタルコンテンツおよびサービスの性質上、購入後の返品・交換は原則としてお受けできません。", icon: <RefreshCcw className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] font-sans selection:bg-[#F0BB38]/30">
      <Navbar user={user} signOut={signOut} />
      
      <main className="relative pt-32 pb-24 px-6">
        {/* 背景装飾 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#F0BB38]/10 to-transparent pointer-events-none" />
        
        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInVariants} className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0BB38]/10 border border-[#F0BB38]/20 text-[#F0BB38] text-xs font-bold mb-4 uppercase tracking-widest">
              Commercial Disclosure
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">特定商取引法に基づく表記</h1>
            <p className="text-[#A8A0D8] text-sm">Legal Information for Paid Services</p>
          </motion.div>

          <motion.div variants={fadeInVariants} className="overflow-hidden rounded-3xl border border-[#2a2a4e] bg-[#15132D]/50 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a4e]">
                  <th className="px-6 py-5 text-sm font-bold text-[#A8A0D8] bg-[#1A1200]/20 w-1/3 md:w-1/4">項目</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#F0EFF8] bg-[#1A1200]/10">内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a4e]">
                {details.map((item, index) => (
                  <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-[#F0EFF8] flex items-center gap-2">
                       <span className="text-[#F0BB38]">{item.icon}</span>
                       {item.label}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#A8A0D8] leading-relaxed">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div variants={fadeInVariants} className="mt-12 p-8 rounded-2xl bg-[#1A1200] border border-[#F0BB38]/20 flex items-center gap-4">
             <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F0BB38]/10 flex items-center justify-center">
               <Info className="w-6 h-6 text-[#F0BB38]" />
             </div>
             <p className="text-sm md:text-base text-[#F0BB38]/90 leading-relaxed font-medium">
               本サービスは個人開発による提供のため、特定商取引法に基づく開示請求があった場合は、遅滞なく情報を開示いたします。
             </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
