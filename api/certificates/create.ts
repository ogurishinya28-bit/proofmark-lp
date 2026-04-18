export const config = { runtime: 'edge' };
import { getAuthenticatedUserId, getOrigin, json, supabaseAdmin } from '../_shared';

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const formData = await request.formData();
  const file = formData.get('file');
  const title = String(formData.get('title') || '').trim();
  const sha256 = String(formData.get('sha256') || '');
  const proofMode = String(formData.get('proofMode') || 'shareable');
  const visibility = String(formData.get('visibility') || 'public');
  const metadataJson = String(formData.get('metadataJson') || '{}');

  // Edgeランタイムの仕様（Fileではなく名前付きBlobとしてパースされる現象）を回避する柔軟なチェック
  if (!file || typeof file === 'string' || !('name' in file)) return json(400, { error: 'file is required' });
  if (!title) return json(400, { error: 'title is required' });
  if (!sha256) return json(400, { error: 'sha256 is required' });

  let userId = '';
  try {
    userId = await getAuthenticatedUserId(request);
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'Unauthorized' });
  }

  const duplicate = await supabaseAdmin
    .from('certificates')
    .select('id, public_verify_token, proven_at')
    .eq('sha256', sha256)
    .limit(1)
    .maybeSingle();

  if (duplicate.data) return json(409, { error: 'duplicate certificate exists', duplicate: true, certificate: duplicate.data });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const certificateId = crypto.randomUUID();
  const storagePath = `${userId}/certificates/${certificateId}.${ext}`;
  let publicImageUrl: string | null = null;

  if (proofMode === 'shareable') {
    const upload = await supabaseAdmin.storage.from('proofmark-originals').upload(storagePath, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
      cacheControl: '31536000',
    });

    if (upload.error) return json(500, { error: upload.error.message });

    const publicPreviewPath = `certificates/${certificateId}.${ext}`;
    const previewCopy = await supabaseAdmin.storage.from('proofmark-public').upload(publicPreviewPath, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
      cacheControl: '31536000',
    });

    if (previewCopy.error) return json(500, { error: previewCopy.error.message });
    const { data: previewPublicData } = supabaseAdmin.storage.from('proofmark-public').getPublicUrl(publicPreviewPath);
    publicImageUrl = previewPublicData.publicUrl;
  }

  const { data, error } = await supabaseAdmin
    .from('certificates')
    .insert({
      id: certificateId,
      user_id: userId,
      title,
      sha256,
      proof_mode: proofMode,
      visibility,
      public_verify_token: crypto.randomUUID(),
      public_image_url: publicImageUrl,
      storage_path: proofMode === 'shareable' ? storagePath : null,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      metadata_json: {
        ...(JSON.parse(metadataJson) as Record<string, unknown>),
        integrity_model: 'proofmark.chain-ready.v1',
      },
    })
    .select('*')
    .single();

  if (error) return json(500, { error: error.message });

  return json(200, {
    certificate: data,
    verifyUrl: `${getOrigin(request)}/cert/${data.public_verify_token}`,
  });
}
