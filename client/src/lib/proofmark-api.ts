import DOMPurify from 'dompurify';
import type { CertificateRecord, PortfolioEmbedSettings, ProcessBundleDraftStep } from './proofmark-types';
import { supabase } from './supabase';

export async function checkDuplicateCertificate(sha256: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/certificates/check', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256 }),
  });

  if (!response.ok) throw new Error('duplicate check failed');
  return (await response.json()) as { exists: boolean; certificate?: Pick<CertificateRecord, 'id' | 'public_verify_token' | 'proven_at'> };
}

export async function createCertificate(input: {
  title: string;
  file: File;
  sha256: string;
  proofMode: 'private' | 'shareable';
  visibility: 'private' | 'unlisted' | 'public';
  metadata?: Record<string, unknown>;
}) {
  const form = new FormData();
  form.append('title', input.title);
  form.append('file', input.file);
  form.append('sha256', input.sha256);
  form.append('proofMode', input.proofMode);
  form.append('visibility', input.visibility);
  form.append('metadataJson', JSON.stringify(input.metadata ?? {}));

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/certificates/create', {
    method: 'POST',
    headers,
    body: form,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'certificate creation failed');
  }

  return (await response.json()) as { certificate: CertificateRecord; duplicate?: boolean };
}

export async function createProcessBundle(input: {
  certificateId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  steps: ProcessBundleDraftStep[];
}) {
  const payload = new FormData();
  payload.append('certificateId', input.certificateId);
  payload.append('title', input.title);
  payload.append('description', input.description ?? '');
  payload.append('isPublic', String(input.isPublic));

  input.steps.forEach((step, index) => {
    payload.append(`step_${index}_type`, step.stepType);
    payload.append(`step_${index}_title`, step.title);
    payload.append(`step_${index}_note`, step.note ?? '');
    if (step.isRoot) payload.append(`step_${index}_isRoot`, 'true');
    if (step.sha256) payload.append(`step_${index}_sha256`, step.sha256);
    if (step.file) payload.append(`step_${index}_file`, step.file);
  });

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/process-bundles/create', {
    method: 'POST',
    headers,
    body: payload
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'process bundle creation failed');
  }
  return response.json() as Promise<{
    bundleId: string;
    evidenceMode: 'hash_chain_v1';
    chainDepth: number;
    chainHeadSha256: string | null;
    rootStepId: string | null;
    steps: number;
    certificateId: string;
  }>;
}

export async function getProcessBundleByVerifyToken(token: string) {
  const response = await fetch(`/api/certificates/public/${token}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch public process bundle');
  }
  const data = await response.json();
  return data.bundle as ProcessBundlePublic | null;
}

export function sanitizeSvg(svg: string) {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror'],
  });
}

export function buildBadgeEmbedHtml(params: { baseUrl: string; certificateId: string; verifyToken: string }) {
  const badgeUrl = `${params.baseUrl.replace(/\/$/, '')}/api/certificates/badge/${params.certificateId}`;
  const verifyUrl = `${params.baseUrl.replace(/\/$/, '')}/cert/${params.verifyToken}`;
  return `<a href=\"${verifyUrl}\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"${badgeUrl}\" alt=\"ProofMark Certified\" width=\"196\" height=\"56\" /></a>`;
}

export function buildWidgetEmbedHtml(params: { baseUrl: string; username: string; settings?: Partial<PortfolioEmbedSettings> }) {
  const url = new URL(`/embed/${params.username}`, params.baseUrl.replace(/\/$/, '') + '/');
  if (params.settings?.theme) url.searchParams.set('theme', params.settings.theme);
  if (params.settings?.layout) url.searchParams.set('layout', params.settings.layout);
  if (typeof params.settings?.showBadges === 'boolean') url.searchParams.set('badges', String(params.settings.showBadges));
  if (typeof params.settings?.showBundles === 'boolean') url.searchParams.set('bundles', String(params.settings.showBundles));
  if (typeof params.settings?.maxItems === 'number') url.searchParams.set('maxItems', String(params.settings.maxItems));
  return `<iframe src=\"${url.toString()}\" title=\"ProofMark Portfolio Widget\" loading=\"lazy\" width=\"100%\" height=\"760\" style=\"border:0;border-radius:24px;overflow:hidden;background:#07061A\"></iframe>`;
}
