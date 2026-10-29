import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'creator' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  platform: string | null;
  followers: string | null;
  handle: string | null;
  niche: string | null;
  ref_code: string | null;
  created_at: string;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    setProfileLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfileLoading(false);
    // A failed request (e.g. one fired before the new session was attached)
    // must not wipe a profile another call already loaded.
    if (error) return null;
    const loadedProfile = (data as Profile | null) ?? null;
    setProfile(loadedProfile);
    return loadedProfile;
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer: calling Supabase inside this callback can run before the
        // auth lock is released and come back without the user's token.
        const id = newSession.user.id;
        setTimeout(() => loadProfile(id), 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async (userId?: string) => {
    const targetUserId = userId ?? session?.user.id;
    return targetUserId ? loadProfile(targetUserId) : null;
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, profile, loading, profileLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
