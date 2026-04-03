import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, ShieldCheck, Image as ImageIcon, Copy } from 'lucide-react';
import navbarLogo from '../assets/logo/navbar/proofmark-navbar-symbol-dark.svg';
import founderBadge from '../assets/logo/badges/proofmark-badge-founder.svg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── 印刷用スタイル（✨ ペーパー・エディション：白背景/黒文字） ──
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 0 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #FFFFFF !important; /* 白背景を強制 */
      color: #000000 !important; /* 黒文字を強制 */
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100vw !important;
      height: 100vh !important;
    }
    #root, .min-h-screen {
      height: 100vh !important;
      min-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      background-color: #FFFFFF !important;
      display: block !important;
    }
    
    /* 印刷コンテナ：白背景の美しいA4キャンバス */
    .print-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 15mm 20mm !important;
      background-color: #FFFFFF !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      page-break-inside: avoid !important;
    }
    
    .print-flex-row {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      gap: 2.5rem !important;
    }
    .print-w-left {
      width: 38% !important;
      flex: none !important;
    }
    .print-w-right {
      width: 62% !important;
      flex: none !important;
    }

    /* 紙面用の文字色オーバーライド（視認性重視） */
    .print-title { color: #000000 !important; font-size: 28pt !important; line-height: 1.1 !important; }
    .print-subtitle { color: #4B5563 !important; font-size: 11pt !important; }
    .print-label { color: #6B7280 !important; }
    .print-data { color: #111827 !important; }

    /* 紙面用のバッジ（白背景に映えるデザイン） */
    .print-badge-verified {
      background-color: #ECFDF5 !important;
      border: 1.5px solid #059669 !important;
      color: #059669 !important;
    }
    .print-badge-founder {
      background-color: #FFFBEB !important;
      border: 1.5px solid #D97706 !important;
      color: #D97706 !important;
    }

    /* 紙面用のデータボックス（薄いグレー） */
    .print-databox {
      background-color: #F9FAFB !important;
      border: 1px solid #E5E7EB !important;
      border-radius: 12px !important;
      padding: 16px !important;
    }

    /* 紙面用のZero-Knowledgeボックス（破線で書類感を演出） */
    .print-zk-box {
      background-color: #FFFFFF !important;
      border: 2px dashed #D1D5DB !important;
      border-radius: 12px !important;
    }
    .print-zk-text { color: #374151 !important; }
    .print-zk-badge { 
      background-color: #F3F4F6 !important; 
      border: 1px solid #D1D5DB !important; 
      color: #4B5563 !important; 
    }

    .no-print {
      display: none !important;
    }
  }
`;

export default function CertificatePage() {
    const [match, params] = useRoute('/cert/:id');
    const id = match && params ? params.id : null;
    const [, setLocation] = useLocation();

    const [cert, setCert] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchCertificate() {
            if (!id) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('certificates')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setCert(data);
            }
            setLoading(false);
        }
        fetchCertificate();
    }, [id]);

    const handleCopy = () => {
        if (cert?.file_hash) {
            navigator.clipboard.writeText(cert.file_hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#07061A] text-[#00D4AA] flex justify-center items-center font-bold tracking-widest">VERIFYING...</div>;
    }

    if (!cert) {
        return (
            <div className="min-h-screen bg-[#07061A] text-white flex flex-col justify-center items-center gap-6">
                <ShieldCheck className="w-16 h-16 text-slate-600" />
                <h1 className="text-xl font-bold tracking-widest">証明書が見つかりません</h1>
                <button onClick={() => setLocation('/')} className="text-[#00D4AA] hover:text-white transition-colors border-b border-[#00D4AA] pb-1">トップに戻る</button>
            </div>
        );
    }

    const verifyUrl = `${window.location.origin}/cert/${cert.id}`;

    return (
        <>
            <style>{printStyles}</style>
            <div className="min-h-screen bg-[#07061A] text-[#F0EFF8] flex flex-col items-center py-10 px-4 sm:px-8 font-sans">

                <div className="no-print w-full max-w-5xl mb-8 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 text-decoration-none">
                        <img src={navbarLogo} alt="ProofMark Logo" className="h-7 w-auto" />
                        <span className="font-['Syne'] text-xl font-extrabold text-[#F0EFF8]">
                            Proof<span className="text-[#00D4AA]">Mark</span>
                        </span>
                    </a>
                </div>

                <div className="print-container w-full max-w-5xl bg-[#0D0B24] border border-[#1C1A38] rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(108,62,244,0.1)] relative overflow-hidden">

                    <div className="no-print absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#6C3EF4] opacity-10 blur-[100px] rounded-full"></div>
                        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#00D4AA] opacity-10 blur-[100px] rounded-full"></div>
                    </div>

                    <div className="w-full">
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-[#1C1A38] pb-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tighter mb-2 leading-tight print-title">
                                    CERTIFICATE OF<br />AUTHENTICITY
                                </h1>
                                <p className="text-[#A8A0D8] font-bold text-sm tracking-widest uppercase print-subtitle">ProofMark Digital Existence Certificate</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="print-badge-verified flex items-center gap-1.5 bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase">
                                    <ShieldCheck className="w-4 h-4" /> VERIFIED
                                </div>
                                <div className="print-badge-founder flex items-center gap-1.5 bg-[#1A1200] border border-[#F0BB38] text-[#F0BB38] px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase">
                                    <img src={founderBadge} alt="Founder" className="w-4 h-4 no-print" />
                                    <span className="hidden print:inline-block w-4 h-4 text-center leading-4">👑</span>
                                    FOUNDER
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-10 print-flex-row">

                            <div className="w-full md:w-2/5 flex-shrink-0 print-w-left">
                                <div className="print-zk-box aspect-square w-full rounded-2xl border border-[#1C1A38] bg-[#07061A] flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                                    {cert.image_url ? (
                                        <img src={cert.image_url} alt="Artwork" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6 flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-[#151D2F] to-[#07061A] print:bg-none print:bg-white">
                                            <ImageIcon className="w-10 h-10 text-[#6C3EF4]/40 mb-3 print:text-gray-400" />
                                            <span className="print-zk-badge text-[#00D4AA] text-[10px] sm:text-xs font-bold tracking-widest border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-3 py-1 rounded-full mb-2">
                                                ZERO-KNOWLEDGE
                                            </span>
                                            <p className="print-zk-text text-[#A8A0D8] text-xs sm:text-sm font-bold mb-1">Image Data Hidden</p>
                                            <p className="print-zk-text text-[#A8A0D8]/60 text-[10px] sm:text-xs leading-relaxed max-w-[200px] opacity-80">
                                                運営すら原画を見られない<br />完全秘匿化状態で証明されています
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full md:w-3/5 flex flex-col justify-center space-y-6 print-w-right">

                                <div>
                                    <p className="print-label text-[10px] sm:text-xs font-bold text-[#A8A0D8] uppercase tracking-widest mb-1">Certificate ID</p>
                                    <p className="print-data font-mono text-xs sm:text-sm text-white/80">{cert.id}</p>
                                </div>

                                <div className="print-databox p-4 sm:p-5 rounded-2xl border border-[#00D4AA]/20 bg-gradient-to-r from-[#00D4AA]/10 to-transparent relative group">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-[#00D4AA] print:text-gray-600" />
                                        <h2 className="print-label text-[10px] sm:text-xs font-bold text-[#00D4AA] uppercase tracking-widest">SHA-256 Hash Signature</h2>
                                    </div>
                                    <p className="print-data font-mono text-[#F0EFF8] text-[10px] sm:text-xs break-all pr-8 leading-relaxed">{cert.file_hash}</p>
                                    <button
                                        onClick={handleCopy}
                                        className="no-print absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-lg bg-[#00D4AA]/10 hover:bg-[#00D4AA]/20 transition-colors"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-[#00D4AA]" /> : <Copy className="w-4 h-4 text-[#00D4AA]" />}
                                    </button>
                                </div>

                                <div className="flex flex-row gap-6 items-center justify-between border-t border-[#1C1A38] print:border-gray-300 pt-6">

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-[#F0BB38] print:text-gray-600" />
                                            <h2 className="print-label text-[10px] sm:text-xs font-bold text-[#F0BB38] uppercase tracking-widest">Digital Timestamp (JST)</h2>
                                        </div>
                                        <p className="print-data text-xl sm:text-2xl font-bold text-white tracking-tight">
                                            {new Date(cert.created_at).toLocaleString('ja-JP')}
                                        </p>
                                        <p className="print-label text-[10px] sm:text-xs text-[#A8A0D8] mt-1">改ざん不能な技術で真正性が担保されています</p>
                                    </div>

                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg border border-gray-100">
                                            <QRCodeSVG
                                                value={verifyUrl}
                                                size={70}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"M"}
                                                includeMargin={false}
                                            />
                                        </div>
                                        <span className="print-label text-[8px] sm:text-[10px] font-bold text-[#A8A0D8] tracking-widest uppercase">Scan to Verify</span>
                                    </div>

                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="no-print w-full max-w-5xl mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.print()}
                        className="bg-gradient-to-r from-[#6C3EF4] to-[#8B61FF] hover:from-[#5A2BD4] hover:to-[#7948FF] text-white px-8 py-4 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(108,62,244,0.4)] hover:scale-105"
                    >
                        PDFとして保存・印刷
                    </button>
                    <button
                        onClick={() => setLocation('/')}
                        className="bg-[#151D2F] border border-[#1C1A38] hover:bg-[#1C263E] text-white px-8 py-4 rounded-full font-bold transition-all"
                    >
                        トップに戻る
                    </button>
                </div>

                <div className="no-print w-full max-w-5xl mt-16 bg-[#0D0B24] p-6 sm:p-8 rounded-2xl border border-[#1C1A38]">
                    <h3 className="text-[#00D4AA] font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">💡</span> クライアント・提出先向け 説明テンプレート
                    </h3>
                    <p className="text-sm text-[#A8A0D8] mb-6">以下のテキストをコピーして、納品時やSNSでの作品公開時にご活用ください。</p>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm text-white font-bold mb-2">▼ 納品時・コンテスト提出時</p>
                            <div className="bg-[#07061A] p-4 rounded-xl border border-[#1C1A38] text-sm text-[#D4D0F4] leading-relaxed cursor-text">
                                納品データ一式をお送りいたします。本作品は、AIによる生成過程から当方での加筆修正を含め、制作日時とオリジナルデータを『ProofMark』にて保全・証明しております。証明書URL: {verifyUrl}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}