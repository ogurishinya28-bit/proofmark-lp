export const config = { runtime: 'edge' };
import { json, supabaseAdmin, getAuthenticatedUserId } from '../_shared.js';

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  // 🛡️ JSONパースの安全な処理
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { sha256 } = body;
  if (!sha256) return json(400, { error: 'sha256 is required' });

  // リクエストユーザーの特定（非ログインでもチェック自体は通すためtry-catchで握りつぶす）
  let requesterId = null;
  try {
    requesterId = await getAuthenticatedUserId(request);
  } catch (e) { /* ignore */ }

  const { data, error } = await supabaseAdmin
    .from('certificates')
    // 🛡️ visibilityとuser_idも取得して公開権限を判定する
    .select('id, public_verify_token, proven_at, visibility, user_id')
    .eq('sha256', sha256)
    .order('proven_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json(500, { error: error.message });

  // データが存在しない場合
  if (!data) return json(200, { exists: false, certificate: null });

  // 🛡️ IDOR（権限外アクセス）対策
  // 自分が所有者であるか、または公開設定（public/unlisted 等、private以外）の場合のみトークンを返す
  const isOwner = requesterId === data.user_id;
  const isPublic = data.visibility !== 'private';

  const safeCertificate = {
    id: data.id,
    proven_at: data.proven_at,
    // 権限がない場合はトークンを隠蔽する（null）
    public_verify_token: (isOwner || isPublic) ? data.public_verify_token : null,
  };

  return json(200, { exists: true, certificate: safeCertificate });
}