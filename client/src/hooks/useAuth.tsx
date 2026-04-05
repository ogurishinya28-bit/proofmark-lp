import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { getCurrentSession, onAuthStateChange } from "../lib/auth";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const unsubscribe = onAuthStateChange((user, session) => {
      setUser(user);
      setSession(session);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, password, options: { data: { username } }
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
