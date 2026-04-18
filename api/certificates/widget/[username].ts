export const config = { runtime: 'edge' };
import { json, supabaseAdmin, verifyEvidenceChain } from '../../_shared';

export default async function handler(_request: Request, context: { params: { username: string } }) {
  const { username } = context.params;
  const profile = await supabaseAdmin.from('profiles').select('id, username').eq('username', username).maybeSingle();
  if (!profile.data) return json(404, { error: 'Profile not found' });

  const certificates = await supabaseAdmin
    .from('certificates')
    .select('*')
    .eq('user_id', profile.data.id)
    .in('visibility', ['public', 'unlisted'])
    .order('proven_at', { ascending: false })
    .limit(12);

  const bundlesResponse = await supabaseAdmin
    .from('process_bundles')
    .select('id, title, description, created_at, evidence_mode, chain_depth, chain_head_sha256, steps:process_bundle_steps(id, step_index, step_type, title, description, preview_url, sha256, original_filename, mime_type, file_size, prev_step_id, prev_chain_sha256, chain_sha256, issued_at)')
    .eq('user_id', profile.data.id)
    .eq('status', 'issued')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const bundles = await Promise.all((bundlesResponse.data || []).map(async (bundle: any) => ({
    ...bundle,
    chain_summary: await verifyEvidenceChain({
      id: bundle.id,
      chain_head_sha256: bundle.chain_head_sha256,
      chain_depth: bundle.chain_depth,
      steps: (bundle.steps || []).map((step: any) => ({
        id: step.id,
        bundleId: bundle.id,
        stepIndex: step.step_index,
        stepType: step.step_type,
        title: step.title,
        description: step.description,
        sha256: step.sha256,
        originalFilename: step.original_filename,
        mimeType: step.mime_type,
        fileSize: step.file_size,
        prevStepId: step.prev_step_id,
        prevChainSha256: step.prev_chain_sha256,
        chain_sha256: step.chain_sha256,
      })),
    }),
  })));

  return json(200, {
    username: profile.data.username,
    certificates: certificates.data || [],
    bundles,
  }, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
  });
}
