import React from "react";
import { Link } from "wouter";

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "'Space Mono', 'SF Mono', 'Fira Code', monospace", letterSpacing: "0.02em" }}>
    {children}
  </span>
);

export default function Privacy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>プライバシーポリシー</h1>
        <p style={styles.date}>最終更新日: <Mono>2026</Mono>年<Mono>3</Mono>月</p>
        <div style={styles.content}>
          <h2 style={styles.h2}>1. 収集する情報</h2>
          <p style={styles.p}>本サービスでは、アカウント登録のためのメールアドレス、アップロードされた画像データ、およびブラウザ内で生成された<Mono>SHA-256</Mono>ハッシュ値を収集・保管します。</p>
          <h2 style={styles.h2}>2. データの利用目的（<Mono>AI</Mono>学習への不使用）</h2>
          <p style={styles.p}>収集したデータは、デジタル存在証明の発行およびポートフォリオの表示目的のみに使用します。<strong style={{ color: "#00D4AA" }}>ユーザーの画像データを生成<Mono>AI</Mono>の学習（<Mono>Training</Mono>）データとして利用したり、第三者に販売することは一切ありません。</strong></p>
          <h2 style={styles.h2}>3. セキュリティ</h2>
          <p style={styles.p}>通信および保管時の暗号化（<Mono>Direct Upload</Mono>方式）を採用し、ユーザー本人以外の第三者が非公開データにアクセスできないよう、厳格なアクセス制御（<Mono>RLS: Row Level Security</Mono>）を実施しています。</p>
          <h2 style={styles.h2}>4. <Mono>Cookie</Mono>の利用</h2>
          <p style={styles.p}>本サービスでは認証状態の維持のために<Mono>Cookie</Mono>および<Mono>localStorage</Mono>を使用しています。これらは第三者への情報提供を目的とするものではありません。</p>
        </div>
        <Link href="/" style={styles.backLink}>← トップへ戻る</Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#07061A", color: "#F0EFF8", padding: "80px 20px", fontFamily: "'Syne', sans-serif" },
  container: { maxWidth: "800px", margin: "0 auto", background: "#0D0B24", padding: "48px", borderRadius: "20px", border: "1px solid #1C1A38" },
  title: { fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "#F0EFF8" },
  date: { fontSize: "14px", color: "#48456A", marginBottom: "40px" },
  content: { color: "#D4D0F4" },
  h2: { fontSize: "20px", fontWeight: 700, color: "#00D4AA", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid #1C1A38", paddingBottom: "8px" },
  p: { fontSize: "15px", lineHeight: 1.9, marginBottom: "24px" },
  backLink: { display: "inline-block", marginTop: "40px", color: "#6C3EF4", textDecoration: "none", fontWeight: 700 }
};
