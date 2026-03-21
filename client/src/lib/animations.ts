/**
 * ProofMark LP - Framer Motion アニメーション設定
 * manus-design.md に基づく Framer Motion variants
 */

import type { Variants } from "framer-motion";

// ── フェードイン ──────────────────────────────
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ── スライドイン（下から） ─────────────────────
export const slideInVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── スライドイン（左から） ─────────────────────
export const slideInFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── スライドイン（右から） ─────────────────────
export const slideInFromRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── スタガーコンテナ（子要素を順番にアニメーション） ──
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ── スケールホバー ────────────────────────────
export const scaleHoverVariants: Variants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};

// ── カードホバー（スケール + グロウ） ─────────────
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0px rgba(108, 62, 244, 0)",
    transition: { duration: 0.3 },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 0 20px rgba(108, 62, 244, 0.3)",
    transition: { duration: 0.2 },
  },
};

// ── ボタンホバー ──────────────────────────────
export const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.15 } },
  tap: { scale: 0.97 },
};

// ── フロートアニメーション（浮遊） ─────────────────
export const floatVariants: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ── グロウパルスアニメーション ────────────────────
export const glowPulseVariants: Variants = {
  animate: {
    boxShadow: [
      "0 0 5px rgba(108, 62, 244, 0.3)",
      "0 0 20px rgba(108, 62, 244, 0.6)",
      "0 0 5px rgba(108, 62, 244, 0.3)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ── ページトランジション ──────────────────────────
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// ── ヒーローテキストアニメーション ────────────────
export const heroTextVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // custom ease (easeOutExpo)
    },
  },
};

// ── 共通トランジション設定 ────────────────────────
export const transitions = {
  fast: { duration: 0.15 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  bounce: { type: "spring" as const, stiffness: 300, damping: 20 },
} as const;
