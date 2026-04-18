export const config = { runtime: 'edge' };
import { json, supabaseAdmin } from '../_shared';

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const { sha256 } = await request.json();
  if (!sha256) return json(400, { error: 'sha256 is required' });

  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select('id, public_verify_token, proven_at')
    .eq('sha256', sha256)
    .order('proven_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  return json(200, { exists: !!data, certificate: data || null });
}
