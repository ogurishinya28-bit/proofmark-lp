/**
 * Frontend helpers for Stripe Checkout / Spot purchase / Evidence Pack download.
 * No secrets here — all sensitive logic is in /api/*.
 */

import { supabase } from './supabase';

interface CheckoutOptions {
    plan: 'creator' | 'studio' | 'spot';
    sha256?: string;
    filename?: string;
    spotEmail?: string;
}

/**
 * Creates a Stripe Checkout session and redirects the browser to it.
 * For subscription plans, the user must already be authenticated.
 */
export async function startCheckout(options: CheckoutOptions): Promise<{ stagingId?: string }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options.plan !== 'spot') {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
            window.location.href = `/auth?mode=signup&plan=${options.plan}`;
            return {};
        }
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Checkout failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { url: string; stagingId?: string };
    if (!data.url) throw new Error('Checkout session did not return a URL');
    window.location.href = data.url;
    return { stagingId: data.stagingId };
}

/**
 * Triggers Evidence Pack download.
 * Authenticated cert: pass certId.
 * Spot guest: pass stagingId returned from the post-payment success URL.
 */
export function evidencePackDownloadUrl(opts: { certId?: string; stagingId?: string }): string {
    if (opts.certId) return `/api/generate-evidence-pack?cert=${encodeURIComponent(opts.certId)}`;
    if (opts.stagingId) return `/api/generate-evidence-pack?staging=${encodeURIComponent(opts.stagingId)}&spot=1`;
    throw new Error('Either certId or stagingId is required');
}
