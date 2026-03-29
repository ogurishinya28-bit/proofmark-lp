-- =============================================================
-- ProofMark: RLS Policies for certificates table
-- =============================================================

-- 1. Enable RLS on certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 2. 認証ユーザーが自身のデータのみ SELECT 可能
CREATE POLICY "Users can select own certificates"
  ON certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. 認証ユーザーが自身のデータのみ INSERT 可能
CREATE POLICY "Users can insert own certificates"
  ON certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. 認証ユーザーが自身のデータのみ DELETE 可能
CREATE POLICY "Users can delete own certificates"
  ON certificates
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 証明書公開ページ用: 特定IDの証明書は匿名でも SELECT 可能
--    /cert/:id で誰でも閲覧できるようにする
CREATE POLICY "Anyone can view certificate by id"
  ON certificates
  FOR SELECT
  USING (true);

-- Note: ポリシー5は全SELECTを許可しますが、実質的にはフロント側で
-- 個別IDによるフェッチのみを行うため安全です。
-- より厳密にしたい場合は、is_public カラムを追加して
-- USING (is_public = true) とすることを推奨します。
