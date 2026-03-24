# ProofMark 環境変数ガイド

## 概要

ProofMark では「ブラウザで参照する公開キー」と「サーバーのみで使う秘匿キー」を明確に分離しています。

---

## キー一覧と設定場所

| 環境変数名 | 種別 | `.env.local` | Vercel | 説明 |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | 🌐 公開 | ✅ | ✅ | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | 🌐 公開 | ✅ | ✅ | Supabase anon key（RLS で保護済み） |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 **秘匿** | ✅ | ✅ | **RLS をバイパス。絶対に `VITE_` を付けない** |
| `RESEND_API_KEY` | 🔒 **秘匿** | ✅ | ✅ | Resend メール送信キー |
| `VITE_ANALYTICS_ENDPOINT` | 🌐 公開 | ✅ | ✅ | Analytics エンドポイント（任意） |
| `VITE_ANALYTICS_WEBSITE_ID` | 🌐 公開 | ✅ | ✅ | Analytics サイト ID（任意） |

> [!CAUTION]
> **`SUPABASE_SERVICE_ROLE_KEY` に絶対に `VITE_` プレフィックスを付けないでください。**
> `VITE_` を付けると Vite がバンドルに含め、ブラウザに公開されます。
> この キーが漏洩すると RLS を完全にバイパスされ、全データにアクセス可能になります。

---

## ローカル開発セットアップ

```bash
# 1. テンプレートをコピー
cp .env.local.example .env.local

# 2. .env.local を編集して実際の値を入力
# Supabase ダッシュボード > Settings > API から取得
```

`.env.local` は `.gitignore` に登録してください（プロジェクトに既存の `.gitignore` を確認）。

---

## Vercel デプロイ設定

1. [Vercel ダッシュボード](https://vercel.com) を開く
2. プロジェクト > **Settings** > **Environment Variables** を選択
3. 上記のキー一覧を参考に、すべての変数を追加する
4. **Environment** は `Production` + `Preview` + `Development` すべてにチェック

> [!NOTE]
> `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` は Vite のビルド時に埋め込まれるため、
> クライアントサイドで参照されます。これは設計通りの動作です（anon key は公開しても安全）。

---

## Supabase キーの取得方法

1. [Supabase ダッシュボード](https://app.supabase.com) を開く
2. プロジェクトを選択 > **Settings** > **API**
3. **Project URL** → `VITE_SUPABASE_URL` に設定
4. **anon (public)** → `VITE_SUPABASE_ANON_KEY` に設定
5. **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY` に設定（絶対に `VITE_` を付けない）

---

## Storage バケット設定（手動作業が必要）

SQL スクリプト (`supabase/migrations/001_initial_schema.sql`) でバケットの作成を試みますが、
Supabase の RLS ポリシーの制約により、ダッシュボードからの確認が推奨されます。

### ダッシュボード確認手順

1. Supabase ダッシュボード > **Storage**
2. `originals` バケット → **Public**: OFF（非公開）
3. `certificates` バケット → **Public**: ON（公開）

バケットが存在しない場合は **New Bucket** から手動作成してください。
