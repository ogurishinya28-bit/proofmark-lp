import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileImage, CheckCircle, Shield, Upload, Download } from 'lucide-react';
type Phase = 'idle' | 'dragging' | 'hovering' | 'dropped' | 'processing' | 'complete' | 'resetting';
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/* ── macOS-style pointer cursor (SVG) ── */
const Cursor = () => (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M2.8 0.5L16.2 10.2L10.4 12L7.6 19.8L2.8 0.5Z"
            fill="#1e293b"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
    </svg>
);
/* ── Ripple ring on drop ── */
const Ripple = () => (
    <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0.5, scale: 0.97 }}
        animate={{ opacity: 0, scale: 1.04 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ border: '2px solid rgba(0,212,170,0.45)' }}
    />
);
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* HeroMockup – 4-second looping product demo
*
* ファイル → ドロップ → 証明 → Evidence Pack の
* 一連のフローを Apple 品質のマイクロアニメーションで
* 自動再生ループさせる。Hero 直下に配置する想定。
* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function HeroMockup() {
    const [phase, setPhase] = useState<Phase>('idle');
    /* ── タイムライン: 合計 ~3.9s でループ ── */
    const runCycle = useCallback(async () => {
        setPhase('idle');        // 0.00s  待機
        await wait(350);
        setPhase('dragging');    // 0.35s  カーソルがファイルを掴んで移動
        await wait(650);
        setPhase('hovering');    // 1.00s  ドロップゾーンに近づく → 磁石フィードバック
        await wait(350);
        setPhase('dropped');     // 1.35s  ドロップ瞬間 → スナップ + リップル
        await wait(400);
        setPhase('processing');  // 1.75s  超高速 SHA-256 + TSA → プログレスバー
        await wait(500);
        setPhase('complete');    // 2.25s  チェックマーク + Evidence Pack ポップアップ
        await wait(900);
        setPhase('resetting');   // 3.15s  フェードアウト → 初期状態へ
        await wait(600);         // 3.75s  → ループ先頭
    }, []);
    useEffect(() => {
        let active = true;
        (async () => {
            while (active) {
                await runCycle();
                if (active) await wait(150);
            }
        })();
        return () => {
            active = false;
        };
    }, [runCycle]);
    const showCursor = ['idle', 'dragging', 'hovering', 'dropped'].includes(phase);
    const showDragFile = ['idle', 'dragging', 'hovering'].includes(phase);
    const isHover = phase === 'hovering' || phase === 'dropped';
    /* ── カーソル + ファイルカード座標 (right / top px) ── */
    const pos = (() => {
        switch (phase) {
            case 'idle':
                return { r: 24, t: 16 };
            case 'dragging':
                return { r: 170, t: 90 };
            case 'hovering':
                return { r: 210, t: 130 };
            case 'dropped':
                return { r: 210, t: 140 };
            default:
                return { r: 210, t: 140 };
        }
    })();
    return (
        <div
            className="relative w-full mx-auto select-none"
            style={{
                maxWidth: 540,
                height: 340,
                fontFamily: "'Inter', system-ui, sans-serif",
            }}
        >
            {/* ━━ ドロップゾーン（グラスモーフィズム） ━━ */}
            <motion.div
                className="absolute rounded-2xl flex flex-col items-center justify-center overflow-hidden"
                style={{
                    inset: '24px 32px 56px 32px',
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                }}
                animate={{
                    scale:
                        phase === 'hovering'
                            ? 1.02
                            : phase === 'dropped'
                                ? 0.98
                                : 1,
                    borderColor: isHover
                        ? 'rgba(0,212,170,0.5)'
                        : 'rgba(255,255,255,0.12)',
                    boxShadow: isHover
                        ? '0 0 48px rgba(0,212,170,0.12), 0 8px 32px rgba(0,0,0,0.08)'
                        : '0 4px 24px rgba(0,0,0,0.05)',
                }}
                transition={{
                    scale: { type: 'spring', stiffness: 400, damping: 25 },
                    borderColor: { duration: 0.25 },
                    boxShadow: { duration: 0.3 },
                }}
            >
                {/* リップル（着弾エフェクト） */}
                <AnimatePresence>{phase === 'dropped' && <Ripple />}</AnimatePresence>
                {/* ── 内部コンテンツ切替 ── */}
                <AnimatePresence mode="wait">
                    {/* IDLE / DRAG / HOVER → アップロードヒント */}
                    {['idle', 'dragging', 'hovering'].includes(phase) && (
                        <motion.div
                            key="hint"
                            className="flex flex-col items-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase === 'hovering' ? 0.5 : 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.12 } }}
                        >
                            <motion.div
                                animate={{ y: phase === 'hovering' ? -2 : 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <Upload className="w-7 h-7" style={{ color: '#94a3b8' }} />
                            </motion.div>
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#94a3b8',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                ファイルをドロップして証明
                            </p>
                            <div
                                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            >
                                <span style={{ fontSize: 10, color: '#64748b' }}>
                                    SHA-256 + RFC 3161
                                </span>
                            </div>
                        </motion.div>
                    )}
                    {/* DROPPED → ファイルがスナップ着弾 */}
                    {phase === 'dropped' && (
                        <motion.div
                            key="landed"
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, scale: 0.7, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <FileImage className="w-9 h-9" style={{ color: '#475569' }} />
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#cbd5e1',
                                }}
                            >
                                artwork_final.png
                            </span>
                        </motion.div>
                    )}
                    {/* PROCESSING → 超高速プログレスバー */}
                    {phase === 'processing' && (
                        <motion.div
                            key="proc"
                            className="flex flex-col items-center gap-4 w-full"
                            style={{ padding: '0 48px' }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
                            >
                                <Shield className="w-7 h-7" style={{ color: '#00D4AA' }} />
                            </motion.div>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#94a3b8',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                Certifying…
                            </span>
                            {/* Apple 風の極細プログレスバー */}
                            <div
                                className="w-full overflow-hidden rounded-full"
                                style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: 'linear-gradient(90deg, #00D4AA, #6C3EF4)',
                                    }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                />
                            </div>
                        </motion.div>
                    )}
                    {/* COMPLETE → チェックマーク モーフィング */}
                    {phase === 'complete' && (
                        <motion.div
                            key="done"
                            className="flex flex-col items-center gap-2.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.25 } }}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 22,
                                    delay: 0.04,
                                }}
                            >
                                <CheckCircle className="w-10 h-10" style={{ color: '#00D4AA' }} />
                            </motion.div>
                            <motion.span
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.12,
                                    duration: 0.25,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}
                            >
                                Certified ✓
                            </motion.span>
                        </motion.div>
                    )}
                    {/* RESETTING → 全要素フェードアウト */}
                    {phase === 'resetting' && (
                        <motion.div
                            key="reset"
                            className="flex flex-col items-center gap-2.5"
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.45 }}
                        >
                            <CheckCircle className="w-10 h-10" style={{ color: '#00D4AA' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            {/* ━━ ドラッグ中のファイルカード ━━ */}
            <AnimatePresence>
                {showDragFile && (
                    <motion.div
                        className="absolute z-20 flex items-center gap-2 rounded-lg"
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            boxShadow:
                                '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                        }}
                        animate={{
                            right: pos.r + 16,
                            top: pos.t + 8,
                            rotate:
                                phase === 'dragging'
                                    ? -4
                                    : phase === 'hovering'
                                        ? -1.5
                                        : 0,
                            scale: phase === 'hovering' ? 0.95 : 1,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.7,
                            transition: { duration: 0.15 },
                        }}
                        transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                    >
                        <FileImage className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#334155',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            artwork_final.png
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ━━ macOS カーソル ━━ */}
            <AnimatePresence>
                {showCursor && (
                    <motion.div
                        className="absolute z-30 pointer-events-none"
                        animate={{ right: pos.r, top: pos.t }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    >
                        <Cursor />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ━━ Evidence Pack ピル（macOS DL スタック風バウンス） ━━ */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        className="absolute z-20 left-1/2 flex items-center gap-2 rounded-full"
                        style={{
                            bottom: 12,
                            padding: '10px 20px',
                            background:
                                'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            border: '1px solid rgba(0,212,170,0.25)',
                            boxShadow:
                                '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(0,212,170,0.08)',
                        }}
                        initial={{ x: '-50%', y: 24, opacity: 0, scale: 0.85 }}
                        animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
                        exit={{
                            x: '-50%',
                            y: 12,
                            opacity: 0,
                            scale: 0.9,
                            transition: { duration: 0.25 },
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 22,
                            delay: 0.18,
                        }}
                    >
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: [0, -8, 8, 0] }}
                            transition={{ delay: 0.35, duration: 0.4, ease: 'easeInOut' }}
                        >
                            <Download className="w-4 h-4" style={{ color: '#00D4AA' }} />
                        </motion.div>
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#e2e8f0',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Evidence_Pack.zip
                        </span>
                        <span
                            className="rounded-full"
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#00D4AA',
                                background: 'rgba(0,212,170,0.12)',
                                padding: '2px 8px',
                                letterSpacing: '0.04em',
                            }}
                        >
                            READY
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
