/**
 * AuthContext - Supabase Auth 認証状態管理
 *
 * アプリ全体で認証状態（ユーザー・セッション）を共有する React Context。
 * Manus OAuth を廃止し、Supabase Auth に一本化。
 *
 * 使い方:
 *   const { user, session, loading } = useAuth();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Context 型定義
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** 現在ログイン中のユーザー。未認証の場合は null */
  user: User | null;
  /** 現在のセッション。未認証の場合は null */
  session: Session | null;
  /** 認証状態の初期ロード中は true */
  loading: boolean;
  /** ユーザーが認証済みかどうか */
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Context 作成
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 認証状態の変化をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// カスタムフック
// ---------------------------------------------------------------------------

/**
 * 認証状態にアクセスするカスタムフック
 * @example
 * const { user, isAuthenticated, loading } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
