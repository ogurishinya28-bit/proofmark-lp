/**
 * ProofMark Copy SSOT
 * すべての公開ページで共通の語彙・トーン・宣言文をここで一元管理する。
 * レポート指摘の「ページ間メッセージ不整合」「過剰な法的断定」「先取権」を構造的に防ぐ。
 */

export const PROOFMARK_COPY = {
  brandLong: 'ProofMark — AI時代の納品信頼インフラ',
  brandShort: 'ProofMark',
  tagline: '「どうせAIでしょ？」を、検証可能な事実で終わらせる。',
  taglineSecondary: '制作と納品を、客観証拠つきで運用するための SaaS。',
  metaDescription:
    'ProofMarkは、AIクリエイターと小規模スタジオのための納品信頼インフラ。SHA-256ハッシュをブラウザ内で計算し、RFC3161準拠のタイムスタンプを付与。ProofMarkに依存せず第三者が独立検証できる「制作事実の客観証拠」を、ワンクリックで Evidence Pack として納品できます。',
  hero: {
    eyebrow: 'EVIDENCE OPERATIONS',
    title1: '「どうせAIでしょ？」を、',
    title2: '検証可能な事実で終わらせる。',
    subtitle:
      'ファイルのSHA-256ハッシュをブラウザ内で計算し、RFC3161準拠のタイムスタンプを付与。ProofMarkに依存せず第三者が独立検証できる「制作事実の客観証拠」を、納品物にそのまま添付できます。',
    primaryCTA: '無料で始める',
    secondaryCTA: '1件だけ今すぐ証明する',
    micro: 'クレカ不要・いつでも解除OK',
  },
  proves: {
    title: 'ProofMarkが証明すること',
    bullets: [
      '特定のSHA-256ハッシュを持つファイルが、RFC3161タイムスタンプの発行時刻に存在していた事実',
      '発行後、そのファイルが1ビットも改変されていないこと（完全性）',
      'ProofMarkに依存せず、OpenSSL等で独立検証できること',
    ],
  },
  notProves: {
    title: 'ProofMarkが証明しないこと',
    bullets: [
      '著作権の帰属、作品の独自性、合法性',
      '世界で最初にその作品を作ったという事実',
      '特定の裁判・行政手続で証拠として採用されること（採否は事案・法域に依存）',
    ],
  },
  evidencePack: {
    label: 'Evidence Pack',
    title: '“信用を、納品できる状態にする”',
    description:
      'PDF証明書だけではない、SHA-256・タイムスタンプトークン・検証URL・OpenSSL検証手順・クライアント提出文面までを1パッケージで納品できる、ProofMarkのコア体験です。',
    cta: 'Evidence Pack の中身を見る',
    items: [
      'PDF証明書（A4・印刷想定）',
      'タイムスタンプトークン（.tsr / DER）',
      '原本SHA-256とメタデータ',
      'OpenSSL/独立検証スクリプト',
      'クライアント提出用カバーレター',
      '検証URL & 公開バッジ',
    ],
  },
  trust: {
    title: '現在の運用ステータス',
    rfc3161: 'RFC3161準拠 タイムスタンプ',
    privateProof: 'Private Proof: 原本はブラウザ外に出ません',
    independent: '独立検証可能（ProofMarkが消えても検証可）',
    tsaNoteLabel: 'TSA運用ポリシー',
    tsaNote:
      '現在β運用中の TSA 構成と最終更新日は Trust Center で随時公開しています。商用 TSA への切替条件・二重アンカー戦略も同ページに記載しています。',
    tsaLinkLabel: 'Trust Center で詳細を見る',
    tsaLinkHref: '/trust-center#s4',
  },
  legalTone: {
    safeAssertion:
      'ProofMarkが生成するのは、RFC3161準拠のタイムスタンプ付き証拠データであり、証拠としての価値は利用文脈・TSA・法域により異なります。',
    avoidedTerms: ['先取権を確定', '法的証拠力を持つ', '万能な権利保護'],
  },
  founderOffer: {
    label: '先着100名 限定オファー',
    description: 'Lightプラン3ヶ月無料 + 創設者バッジ + 優先サポート',
    badge: 'FOUNDER',
  },
} as const;

export type ProofmarkCopy = typeof PROOFMARK_COPY;
