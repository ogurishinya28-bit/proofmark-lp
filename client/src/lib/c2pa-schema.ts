/**
 * c2pa-schema.ts — final shared schema + UI selectors for ProofMark.
 *
 * Goals:
 *  - keep the persisted payload tiny and scrubbed
 *  - expose stable helpers for Vault / Storefront rendering
 *  - avoid every component re-implementing C2PA parsing rules
 */

import { z } from 'zod';

export const C2PA_PAYLOAD_MAX_BYTES = 10 * 1024;
export const C2PA_FIELD_MAX = 200;
export const C2PA_ASSERTIONS_MAX = 20;
export const C2PA_INGREDIENTS_MAX = 8;

const safeText = (max = C2PA_FIELD_MAX) => z.string().trim().min(1).max(max);
const safeOptionalText = (max = C2PA_FIELD_MAX) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

const safeUrl = z
  .string()
  .trim()
  .max(512)
  .regex(/^https?:\/\//i, 'must be http(s)://')
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const C2paAssertionZ = z.object({
  label: safeText(120),
  summary: safeOptionalText(280),
}).strict();

export const C2paIngredientZ = z.object({
  title: safeOptionalText(160),
  format: safeOptionalText(40),
  document_id: safeOptionalText(120),
  relationship: z.enum(['parentOf', 'componentOf', 'inputTo']).optional().nullable(),
  hash_match: z.boolean().optional().nullable(),
}).strict();

export const C2paManifestZ = z.object({
  schema_version: z.literal(1),
  validity: z.enum(['valid', 'invalid', 'unknown']),
  validity_reason: safeOptionalText(280),
  issuer: safeOptionalText(200),
  software: safeOptionalText(200),
  device: safeOptionalText(200),
  ai_used: z.boolean().nullable(),
  ai_provider: safeOptionalText(200),
  manifest_url: safeUrl,
  active_manifest_label: safeOptionalText(160),
  assertions: z.array(C2paAssertionZ).max(C2PA_ASSERTIONS_MAX).default([]),
  ingredients: z.array(C2paIngredientZ).max(C2PA_INGREDIENTS_MAX).default([]),
  parser: z.object({
    name: safeText(64),
    version: safeText(64),
  }).strict(),
  parsed_at: z.string().datetime(),
  size_hint: z.number().int().nonnegative().max(C2PA_PAYLOAD_MAX_BYTES),
}).strict();

export type C2paManifest = z.infer<typeof C2paManifestZ>;
export type C2paAssertion = z.infer<typeof C2paAssertionZ>;
export type C2paIngredient = z.infer<typeof C2paIngredientZ>;
export type C2paValidity = C2paManifest['validity'];

export function measureBytes(obj: unknown): number {
  const json = JSON.stringify(obj);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).byteLength;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Buffer as any).byteLength(json, 'utf8');
}

export function scrubDeep(input: unknown, depth = 4): unknown {
  if (depth < 0 || input === null || input === undefined) return undefined;
  if (typeof input === 'string') {
    const t = input.trim();
    return t.length === 0 ? undefined : t;
  }
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (Array.isArray(input)) {
    const out = input.map((v) => scrubDeep(v, depth - 1)).filter((v) => v !== undefined);
    return out.length ? out : undefined;
  }
  if (typeof input === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (/^(thumbnail|preview|data|data_uri|raw|bytes)$/i.test(k)) continue;
      const s = scrubDeep(v, depth - 1);
      if (s !== undefined) o[k] = s;
    }
    return Object.keys(o).length ? o : undefined;
  }
  return undefined;
}

export function parseC2paManifest(raw: unknown): C2paManifest | null {
  if (!raw) return null;
  const candidate = typeof raw === 'string' ? safelyParseJson(raw) : raw;
  const parsed = C2paManifestZ.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function safelyParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface C2paVisualSummary {
  present: boolean;
  validity: C2paValidity | 'absent';
  valid: boolean | null;
  issuer: string | null;
  aiUsed: boolean | null;
  aiProvider: string | null;
  software: string | null;
  device: string | null;
  manifestLabel: string | null;
  assertionsCount: number;
  ingredientsCount: number;
  reason: string | null;
}

export function getC2paSummary(raw: unknown): C2paVisualSummary {
  const manifest = parseC2paManifest(raw);
  if (manifest) {
    return {
      present: true,
      validity: manifest.validity,
      valid: manifest.validity === 'valid' ? true : manifest.validity === 'invalid' ? false : null,
      issuer: manifest.issuer ?? null,
      aiUsed: manifest.ai_used ?? null,
      aiProvider: manifest.ai_provider ?? null,
      software: manifest.software ?? null,
      device: manifest.device ?? null,
      manifestLabel: manifest.active_manifest_label ?? null,
      assertionsCount: manifest.assertions?.length ?? 0,
      ingredientsCount: manifest.ingredients?.length ?? 0,
      reason: manifest.validity_reason ?? null,
    };
  }
  const loose = (raw && typeof raw === 'object' ? raw as Record<string, unknown> : null);
  const validityRaw = String(loose?.validity ?? loose?.c2pa_validity ?? '').toLowerCase();
  const valid =
    validityRaw === 'valid' ? true :
      validityRaw === 'invalid' ? false :
        typeof loose?.c2pa_valid === 'boolean' ? (loose?.c2pa_valid as boolean) : null;
  const present = !!(loose?.c2pa_present ?? loose?.present ?? loose?.issuer ?? loose?.c2pa_issuer ?? loose?.ai_used ?? loose?.c2pa_ai_used ?? valid !== null);
  if (!present) {
    return {
      present: false,
      validity: 'absent',
      valid: null,
      issuer: null,
      aiUsed: null,
      aiProvider: null,
      software: null,
      device: null,
      manifestLabel: null,
      assertionsCount: 0,
      ingredientsCount: 0,
      reason: null,
    };
  }
  return {
    present: true,
    validity: valid === true ? 'valid' : valid === false ? 'invalid' : 'unknown',
    valid,
    issuer: String(loose?.issuer ?? loose?.c2pa_issuer ?? '') || null,
    aiUsed: typeof loose?.ai_used === 'boolean' ? (loose.ai_used as boolean) : typeof loose?.c2pa_ai_used === 'boolean' ? (loose.c2pa_ai_used as boolean) : null,
    aiProvider: String(loose?.ai_provider ?? loose?.c2pa_ai_provider ?? '') || null,
    software: String(loose?.software ?? '') || null,
    device: String(loose?.device ?? '') || null,
    manifestLabel: String(loose?.active_manifest_label ?? '') || null,
    assertionsCount: Array.isArray(loose?.assertions) ? loose!.assertions.length : 0,
    ingredientsCount: Array.isArray(loose?.ingredients) ? loose!.ingredients.length : 0,
    reason: String(loose?.validity_reason ?? '') || null,
  };
}

export function formatAiUsageLabel(summary: Pick<C2paVisualSummary, 'present' | 'aiUsed' | 'aiProvider'>): string {
  if (!summary.present) return 'Content Credentials なし';
  if (summary.aiUsed === true) return summary.aiProvider ? `AI generated / edited · ${summary.aiProvider}` : 'AI generated / edited';
  if (summary.aiUsed === false) return 'AI generated ではない';
  return 'AI 使用情報は不明';
}

export function formatValidityLabel(validity: C2paVisualSummary['validity']): string {
  switch (validity) {
    case 'valid':
      return '署名整合';
    case 'invalid':
      return '署名破損';
    case 'unknown':
      return '署名状態不明';
    default:
      return '未検出';
  }
}
