import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared';

export interface AuthContextType {
  session: any;
  profile: any;
  initialized: boolean;
  setSession: (session: any) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = useCallback(async (userId: string, currentSession?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        const metadata = currentSession?.user?.user_metadata;
        if (metadata) {
          setProfile(metadata);
        }
      }
    } catch (e) {
      console.log('Error fetching profile', e);
    }
  }, []);

  const setSession = useCallback((newSession: any) => {
    setSessionState(newSession);
    setInitialized(true);
    if (newSession?.user?.id) {
      fetchProfile(newSession.user.id, newSession);
    } else {
      setProfile(null);
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSessionState(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session);
      setInitialized(true);
      if (data.session?.user?.id) {
        fetchProfile(data.session.user.id, data.session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSessionState(newSession);
      if (newSession?.user?.id) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          fetchProfile(newSession.user.id, newSession);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, initialized, setSession, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Selector-compatible helper so existing useAuthStore calls work seamlessly
export function useAuthStore(selector?: (state: AuthContextType) => any) {
  const context = useAuth();
  return selector ? selector(context) : context;
}
