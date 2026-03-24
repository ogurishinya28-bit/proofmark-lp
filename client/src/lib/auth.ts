/**
 * Supabase Auth ヘルパー（フロントエンド用）
 *
 * Manus OAuth を廃止し、Supabase Auth に一本化。
 * メール/パスワード認証とマジックリンク認証を提供する。
 */

import { supabase } from "./supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignInWithEmailResult {
  error: AuthError | null;
}

// ---------------------------------------------------------------------------
// 認証メソッド
// ---------------------------------------------------------------------------

/**
 * メール + パスワードでサインイン
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * マジックリンク（OTP メール）でサインイン
 * メールアドレスのみで認証できるため、パスワード不要
 */
export async function signInWithMagicLink(
  email: string
): Promise<SignInWithEmailResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error };
}

/**
 * メール + パスワードで新規ユーザー登録
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * サインアウト
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 現在ログイン中のユーザーを取得
 * セッションが存在しない場合は null を返す
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 現在のセッションを取得
 */
export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * 認証状態変化のリスナーを登録
 * @returns アンサブスクライブ関数
 */
export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
  });

  return () => subscription.unsubscribe();
}
