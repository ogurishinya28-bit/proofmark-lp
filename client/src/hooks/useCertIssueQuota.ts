/**
 * useCertIssueQuota — Phase 12.3 UI Hook
 *
 * 発行画面 (CertificateUpload, SpotIssue 等) にマウントすると、
 * 現在の Free プラン使用数を /api/cert-issue/usage から取得し、
 * 25件超過 = warning、30件到達 = locked の状態フラグを返す。
 *
 * 設計:
 *   • サーバの 429 応答が真。本フックの数値は UX 予測のためだけに使用。
 *   • 有料プランは bypassed=true → 一切の警告 UI を出さない。
 *   • SWR / React Query を入れず、最小限の useEffect で完結 (ゼロ追加依存)。
 *   • 発行成功時に refresh() を呼ぶと使用数が更新される。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const FREE_QUOTA = 30;
export const WARN_THRESHOLD = 25;

export interface QuotaSnapshot {
  loaded: boolean;
  bypassed: boolean;
  planTier: string;
  used: number;
  quota: number;
  remaining: number;
  resetAt: string | null;
  /** 30件到達 → 発行ボタンは disabled に */
  locked: boolean;
  /** 25件超過 → warning バナー表示 */
  warning: boolean;
}

const INITIAL: QuotaSnapshot = {
  loaded: false,
  bypassed: false,
  planTier: 'free',
  used: 0,
  quota: FREE_QUOTA,
  remaining: FREE_QUOTA,
  resetAt: null,
  locked: false,
  warning: false,
};

interface UsageResponse {
  planTier: string;
  used: number;
  quota: number;
  remaining: number | null;
  resetAt: string;
  bypassed: boolean;
}

export function useCertIssueQuota(): {
  snapshot: QuotaSnapshot;
  refresh: () => Promise<void>;
  /** 429 をサーバから受けた瞬間に呼ぶ。UI を強制 locked へ。 */
  forceLock: (resetAt?: string) => void;
} {
  const [snapshot, setSnapshot] = useState<QuotaSnapshot>(INITIAL);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (aliveRef.current) setSnapshot({ ...INITIAL, loaded: true });
        return;
      }
      const res = await fetch('/api/cert-issue/usage', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        if (aliveRef.current) setSnapshot({ ...INITIAL, loaded: true });
        return;
      }
      const data = (await res.json()) as UsageResponse;
      if (!aliveRef.current) return;
      const used = data.used ?? 0;
      const remaining = data.remaining ?? Math.max(0, (data.quota ?? FREE_QUOTA) - used);
      setSnapshot({
        loaded: true,
        bypassed: !!data.bypassed,
        planTier: data.planTier ?? 'free',
        used,
        quota: data.quota ?? FREE_QUOTA,
        remaining,
        resetAt: data.resetAt ?? null,
        locked: !data.bypassed && used >= (data.quota ?? FREE_QUOTA),
        warning: !data.bypassed && used >= WARN_THRESHOLD,
      });
    } catch {
      if (aliveRef.current) setSnapshot({ ...INITIAL, loaded: true });
    }
  }, []);

  const forceLock = useCallback((resetAt?: string) => {
    setSnapshot((prev) => ({
      ...prev,
      loaded: true,
      bypassed: false,
      used: Math.max(prev.used, prev.quota || FREE_QUOTA),
      remaining: 0,
      locked: true,
      warning: true,
      resetAt: resetAt ?? prev.resetAt,
    }));
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  return { snapshot, refresh, forceLock };
}
