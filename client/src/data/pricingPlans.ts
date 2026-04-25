/**
 * Pricing SSOT
 * Home.tsx と Pricing.tsx の値ズレ・特徴ズレを構造的に防ぐ。
 * Free PDF発行可否、Lightの内容、Spot価格などはこのファイルだけが正。
 */

export type PlanId = 'free' | 'spot' | 'creator' | 'studio' | 'business';

export interface PricingFeature {
  label: string;
  /** include: 含む / exclude: 含まない / planned: 提供予定 */
  state: 'include' | 'exclude' | 'planned';
  highlight?: 'accent' | 'gold' | 'primary';
}

export interface PricingPlan {
  id: PlanId;
  badge?: string;
  recommended?: boolean;
  name: string;
  tagline: string;
  priceLabel: string;
  priceUnit: string;
  audience: string;
  ctaLabel: { authed: string; guest: string };
  ctaHref: { authed: string; guest: string };
  features: PricingFeature[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'まずは無料で試したい方',
    priceLabel: '¥0',
    priceUnit: '/月',
    audience: 'ProofMarkを試したい個人クリエイター',
    ctaLabel: { authed: '管理画面へ進む', guest: '無料で始める' },
    ctaHref: { authed: '/dashboard', guest: '/auth?mode=signup' },
    features: [
      { label: 'Webタイムスタンプ証明（月30件）', state: 'include' },
      { label: '公開ポートフォリオ機能', state: 'include' },
      { label: '検証URLの発行・共有', state: 'include' },
      { label: 'PDF証明書の発行', state: 'exclude' },
      { label: 'Evidence Pack の納品形式ダウンロード', state: 'exclude' },
    ],
  },
  {
    id: 'spot',
    name: 'Spot',
    tagline: '必要な時だけ手軽に使いたい方',
    priceLabel: '¥100',
    priceUnit: '/回',
    audience: '単発で1件だけ証明を残したい方',
    ctaLabel: { authed: '今すぐ1件発行する', guest: '今すぐ1件発行する' },
    ctaHref: { authed: '/spot-issue', guest: '/spot-issue' },
    features: [
      { label: 'アカウント登録不要', state: 'include', highlight: 'accent' },
      { label: 'PDF証明書（1件発行）', state: 'include' },
      { label: 'Webタイムスタンプ証明', state: 'include' },
      { label: 'Evidence Pack（簡易版）ダウンロード', state: 'include' },
      { label: '公開ポートフォリオ保存', state: 'exclude' },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    tagline: '本気で納品信頼を運用したい個人',
    priceLabel: '¥980',
    priceUnit: '/月',
    audience: '受注クリエイター・有償案件を持つ個人',
    recommended: true,
    badge: 'おすすめ',
    ctaLabel: { authed: 'Creatorに切り替える', guest: '先行特典を予約する' },
    ctaHref: { authed: '/settings#plan', guest: '/auth?mode=signup&plan=creator' },
    features: [
      { label: 'PDF証明書 無制限', state: 'include', highlight: 'primary' },
      { label: 'Webタイムスタンプ証明 無制限', state: 'include', highlight: 'primary' },
      { label: 'Evidence Pack 納品形式ダウンロード', state: 'include', highlight: 'accent' },
      { label: '案件・クライアント単位の整理', state: 'include' },
      { label: 'クライアント提出用テンプレート', state: 'include' },
      { label: '公開ポートフォリオ + 埋め込みウィジェット', state: 'include' },
      { label: 'C2PAメタデータ読取', state: 'planned' },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'チームで案件信頼を運用するスタジオ向け',
    priceLabel: '¥3,980',
    priceUnit: '/月',
    audience: '小規模制作会社・チーム',
    ctaLabel: { authed: 'Studioに切り替える', guest: 'Studioを予約する' },
    ctaHref: { authed: '/settings#plan', guest: '/auth?mode=signup&plan=studio' },
    features: [
      { label: 'Creator のすべての機能', state: 'include' },
      { label: '複数席・権限管理', state: 'include' },
      { label: '監査ログ（改ざん検知付き）', state: 'include' },
      { label: 'Chain of Evidence（制作工程の連鎖証拠）', state: 'include' },
      { label: '案件単位のクライアント共有', state: 'include' },
      { label: 'メールサポート', state: 'include' },
    ],
  },
  {
    id: 'business',
    name: 'Business / API',
    tagline: 'API・SLA・商用TSAが必要な企業向け',
    priceLabel: 'お問い合わせ',
    priceUnit: '',
    audience: '制作会社・出版社・プラットフォーム',
    ctaLabel: { authed: '相談する', guest: '相談する' },
    ctaHref: { authed: '/contact', guest: '/contact' },
    features: [
      { label: 'API / Webhook', state: 'include' },
      { label: '商用TSA・SLA', state: 'include' },
      { label: '導入支援・DPA', state: 'include' },
      { label: '監査証跡 / 長期検証', state: 'include' },
    ],
  },
];

export const FOUNDER_OFFER = {
  text: '※ 先着100名はCreatorプラン3ヶ月無料 + 創設者バッジ',
  highlight: '#BC78FF',
};
