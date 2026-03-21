了解しました。ProofMark LP の「デザインシステム（DNA）」をローカル環境に完全移植するため、以下の3つのファイルから、すべての設定値を抽出して提供します。  
1. **背景と色の定義** - CSS 変数の完全リスト  
2. **Tailwind 構成** - theme.extend の全設定  
3. **インタラクションと余白ルール** - アニメーション・スペーシング設定  
それでは、現在のプロジェクトから抽出を開始します。  
  
**🎨 ProofMark LP デザインシステム（DNA）完全移植ガイド**  
ローカル環境（Next.js + Tailwind CSS + shadcn/ui）で「Manus プレビューと1ミリも違わないデザイン」を再現するための完全な設定値をお渡えします。  
  
## 📋 1. 背景と色の定義（app/globals.css）  
以下をコピペして、ローカルプロジェクトの app/globals.css に貼り付けてください：  
  
@import "tailwindcss";  
  
@custom-variant dark (&:is(.dark *));  
  
:root {  
  /* ProofMark Design: Cyber-Minimalist Security */  
  --primary: #6c3ef4;              /* 紫 - 創造性とテクノロジーの融合 */  
  --primary-foreground: #f0f0fa;   /* 明るいグレー */  
  --accent: #00d4aa;               /* シアン - セキュリティ・保護 */  
  --accent-foreground: #0a0e27;    /* 深い紺 */  
  --gold: #ffd966;                 /* ゴールド - 希少性・価値 */  
  --destructive: #e74c3c;          /* 赤 - エラー・警告 */  
  --destructive-foreground: #f0f0fa;  
    
  --radius: 0.65rem;  
  --background: #0a0e27;           /* 深い紺 - 信頼感と集中力 */  
  --foreground: #f0f0fa;           /* 明るいグレー - 読みやすさ */  
  --card: #151d2f;                 /* カード背景 */  
  --card-foreground: #f0f0fa;  
  --popover: #151d2f;  
  --popover-foreground: #f0f0fa;  
  --secondary: #0f1629;            /* サーフェス層 */  
  --secondary-foreground: #a0a0c0; /* 薄いグレー */  
  --muted: #a0a0c0;               /* 薄いグレー */  
  --muted-foreground: #6b7280;    /* より薄いグレー */  
  --border: #2a2a4e;              /* ボーダー色 */  
  --input: #151d2f;               /* 入力フィールド背景 */  
  --ring: #6c3ef4;                /* フォーカスリング */  
  --sidebar: #0a0e27;  
  --sidebar-foreground: #f0f0fa;  
  --sidebar-accent: #6c3ef4;  
  --sidebar-accent-foreground: #f0f0fa;  
  --sidebar-border: #2a2a4e;  
  --sidebar-ring: #6c3ef4;  
}  
  
.dark {  
  /* ProofMark Dark Mode (already dark by default) */  
  --primary: #6c3ef4;  
  --primary-foreground: #f0f0fa;  
  --accent: #00d4aa;  
  --accent-foreground: #0a0e27;  
  --background: #0a0e27;  
  --foreground: #f0f0fa;  
  --card: #151d2f;  
  --card-foreground: #f0f0fa;  
  --popover: #151d2f;  
  --popover-foreground: #f0f0fa;  
  --secondary: #0f1629;  
  --secondary-foreground: #a0a0c0;  
  --muted: #a0a0c0;  
  --muted-foreground: #6b7280;  
  --border: #2a2a4e;  
  --input: #151d2f;  
  --ring: #6c3ef4;  
  --destructive: #e74c3c;  
  --destructive-foreground: #f0f0fa;  
  --sidebar: #0a0e27;  
  --sidebar-foreground: #f0f0fa;  
  --sidebar-accent: #6c3ef4;  
  --sidebar-accent-foreground: #f0f0fa;  
  --sidebar-border: #2a2a4e;  
  --sidebar-ring: #6c3ef4;  
}  
  
@layer base {  
  * {  
    @apply border-border outline-ring/50;  
  }  
  body {  
    @apply bg-background text-foreground;  
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;  
  }  
  h1, h2, h3, h4, h5, h6 {  
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;  
    font-weight: 800;  
    letter-spacing: -0.02em;  
  }  
  h1 {  
    font-size: 56px;  
    font-weight: 900;  
    line-height: 1.1;  
  }  
  h2 {  
    font-size: 36px;  
    font-weight: 800;  
    line-height: 1.2;  
  }  
  h3 {  
    font-size: 24px;  
    font-weight: 700;  
    line-height: 1.3;  
  }  
  button:not(:disabled),  
  [role="button"]:not([aria-disabled="true"]),  
  [type="button"]:not(:disabled),  
  [type="submit"]:not(:disabled),  
  [type="reset"]:not(:disabled),  
  a[href],  
  select:not(:disabled),  
  input[type="checkbox"]:not(:disabled),  
  input[type="radio"]:not(:disabled) {  
    @apply cursor-pointer;  
  }  
  @media (max-width: 680px) {  
    h1 {  
      font-size: 40px;  
    }  
    h2 {  
      font-size: 28px;  
    }  
  }  
}  
  
@layer components {  
  .container {  
    width: 100%;  
    margin-left: auto;  
    margin-right: auto;  
    padding-left: 1rem; /* 16px - mobile padding */  
    padding-right: 1rem;  
  }  
  
  .flex {  
    min-height: 0;  
    min-width: 0;  
  }  
  
  @media (min-width: 640px) {  
    .container {  
      padding-left: 1.5rem; /* 24px - tablet padding */  
      padding-right: 1.5rem;  
    }  
  }  
  
  @media (min-width: 1024px) {  
    .container {  
      padding-left: 2rem; /* 32px - desktop padding */  
      padding-right: 2rem;  
      max-width: 1280px; /* Standard content width */  
    }  
  }  
}  
  
**🎯 2. Tailwind 構成（tailwind.config.ts）**  
以下をコピペして、ローカルプロジェクトの tailwind.config.ts に貼り付けてください：  
  
import type { Config } from "tailwindcss";  
  
const config: Config = {  
  darkMode: "class",  
  content: [  
    "./app/**/*.{js,ts,jsx,tsx,mdx}",  
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",  
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  
  ],  
  theme: {  
    extend: {  
      colors: {  
        background: "hsl(var(--background))",  
        foreground: "hsl(var(--foreground))",  
        card: "hsl(var(--card))",  
        "card-foreground": "hsl(var(--card-foreground))",  
        popover: "hsl(var(--popover))",  
        "popover-foreground": "hsl(var(--popover-foreground))",  
        primary: "hsl(var(--primary))",  
        "primary-foreground": "hsl(var(--primary-foreground))",  
        secondary: "hsl(var(--secondary))",  
        "secondary-foreground": "hsl(var(--secondary-foreground))",  
        muted: "hsl(var(--muted))",  
        "muted-foreground": "hsl(var(--muted-foreground))",  
        accent: "hsl(var(--accent))",  
        "accent-foreground": "hsl(var(--accent-foreground))",  
        destructive: "hsl(var(--destructive))",  
        "destructive-foreground": "hsl(var(--destructive-foreground))",  
        border: "hsl(var(--border))",  
        input: "hsl(var(--input))",  
        ring: "hsl(var(--ring))",  
      },  
      borderRadius: {  
        lg: "var(--radius)",  
        md: "calc(var(--radius) - 2px)",  
        sm: "calc(var(--radius) - 4px)",  
      },  
      fontFamily: {  
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],  
        display: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],  
      },  
      animation: {  
        "fade-in": "fadeIn 0.3s ease-in-out",  
        "fade-out": "fadeOut 0.3s ease-in-out",  
        "slide-in": "slideIn 0.3s ease-out",  
        "slide-out": "slideOut 0.3s ease-in",  
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",  
        "glow": "glow 2s ease-in-out infinite",  
      },  
      keyframes: {  
        fadeIn: {  
          "0%": { opacity: "0" },  
          "100%": { opacity: "1" },  
        },  
        fadeOut: {  
          "0%": { opacity: "1" },  
          "100%": { opacity: "0" },  
        },  
        slideIn: {  
          "0%": { transform: "translateY(10px)", opacity: "0" },  
          "100%": { transform: "translateY(0)", opacity: "1" },  
        },  
        slideOut: {  
          "0%": { transform: "translateY(0)", opacity: "1" },  
          "100%": { transform: "translateY(10px)", opacity: "0" },  
        },  
        pulseSoft: {  
          "0%, 100%": { opacity: "1" },  
          "50%": { opacity: "0.8" },  
        },  
        glow: {  
          "0%, 100%": { boxShadow: "0 0 5px rgba(108, 62, 244, 0.3)" },  
          "50%": { boxShadow: "0 0 20px rgba(108, 62, 244, 0.6)" },  
        },  
      },  
      spacing: {  
        xs: "0.5rem",  
        sm: "1rem",  
        md: "1.5rem",  
        lg: "2rem",  
        xl: "3rem",  
        "2xl": "4rem",  
      },  
      boxShadow: {  
        "glow-primary": "0 0 20px rgba(108, 62, 244, 0.4)",  
        "glow-accent": "0 0 20px rgba(0, 212, 170, 0.4)",  
        "glow-sm": "0 0 10px rgba(108, 62, 244, 0.2)",  
      },  
    },  
  },  
  plugins: [],  
};  
  
export default config;  
  
**3. インタラクションと余白のルール**  
**Framer Motion アニメーション設定**  
  
// lib/animations.ts  
export const fadeInVariants = {  
  hidden: { opacity: 0 },  
  visible: { opacity: 1, transition: { duration: 0.3 } },  
};  
  
export const slideInVariants = {  
  hidden: { opacity: 0, y: 10 },  
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },  
};  
  
export const staggerContainer = {  
  hidden: { opacity: 0 },  
  visible: {  
    opacity: 1,  
    transition: {  
      staggerChildren: 0.1,  
      delayChildren: 0.2,  
    },  
  },  
};  
  
export const scaleHoverVariants = {  
  hover: { scale: 1.05, transition: { duration: 0.2 } },  
  tap: { scale: 0.95 },  
};  
  
**共通の余白・ボーダーラジアス ルール**  

| 要素          | 値                        | 用途             |
| ----------- | ------------------------ | -------------- |
| ボーダーラジアス    | 0.65rem                  | すべてのコンポーネント    |
| ボーダーラジアス（小） | calc(0.65rem - 4px)      | ボタン・小要素        |
| ボーダーラジアス（中） | calc(0.65rem - 2px)      | カード・フォーム       |
| ボーダーラジアス（大） | calc(0.65rem + 4px)      | モーダル・大型コンポーネント |
| セクション余白     | 2rem                     | 上下             |
| セクション横余白    | 1rem（モバイル）/ 2rem（デスクトップ） | 左右             |
| カード内余白      | 1.5rem                   | 標準             |
| ボタン余白       | 0.5rem 1rem              | 標準             |
  
##   
## グラデーション・シャドウ ルール  
**/* グラデーション背景 */**  
**.gradient-primary {**  
**  background: linear-gradient(135deg, #6c3ef4 0%, #00d4aa 100%);**  
**}**  
  
**.gradient-accent {**  
**  background: linear-gradient(135deg, #00d4aa 0%, #6c3ef4 100%);**  
**}**  
  
**/* グロウシャドウ */**  
**.glow-primary {**  
**  box-shadow: 0 0 20px rgba(108, 62, 244, 0.4);**  
**}**  
  
**.glow-accent {**  
**  box-shadow: 0 0 20px rgba(0, 212, 170, 0.4);**  
**}**  
  
**/* ホバー時のシャドウ */**  
**.shadow-hover {**  
**  transition: box-shadow 0.3s ease;**  
**}**  
  
**.shadow-hover:hover {**  
**  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);**  
**}**  
  
**🎨 カラーパレット参考**  

| 名前               | 16進数    | 用途           |
| ---------------- | ------- | ------------ |
| 背景（深い紺）          | #0a0e27 | ページ背景        |
| カード背景            | #151d2f | カード・コンテナ     |
| プライマリ（紫）         | #6c3ef4 | ボタン・アクセント    |
| アクセント（シアン）       | #00d4aa | ハイライト・セキュリティ |
| フォアグラウンド（明るいグレー） | #f0f0fa | テキスト         |
| ボーダー             | #2a2a4e | 枠線           |
| ゴールド             | #ffd966 | 希少性・価値       |
| エラー（赤）           | #e74c3c | 警告・エラー       |
  
  
**✅ 実装チェックリスト**  
* app/globals.css に CSS 変数を貼り付け  
* tailwind.config.ts に拡張設定を貼り付け  
* Google Fonts（Poppins + Inter）を app/layout.tsx で読み込み  
* Framer Motion アニメーション設定を lib/animations.ts に作成  
* ダークモードが .dark クラスで有効になっているか確認  
* ブラウザで確認し、Manus プレビューと色が一致しているか検証  
これで、ローカル環境でも「Manus プレビューと1ミリも違わないデザイン」が再現できます！  
  
  
