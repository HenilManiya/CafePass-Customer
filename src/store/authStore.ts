import { create } from 'zustand';
import { supabase } from '@/shared';

interface AuthState {
  session: any;
  profile: any;
  initialized: boolean;
  setSession: (session: any) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,
  
  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        set({ profile: data });
      } else {
        // Fallback to user metadata if profile table entry doesn't exist yet
        const session = get().session;
        set({ profile: session?.user?.user_metadata || null });
      }
    } catch (e) {
      console.log('Error fetching profile', e);
    }
  },

  setSession: (session) => {
    set({ session, initialized: true });
    if (session?.user?.id) {
      get().fetchProfile(session.user.id);
    } else {
      set({ profile: null });
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
  
  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, initialized: true });
    
    if (data.session?.user?.id && !get().profile) {
      get().fetchProfile(data.session.user.id);
    }
    
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      
      if (session?.user?.id) {
        // Only fetch on explicit login, or if we somehow have a session but no profile
        if (event === 'SIGNED_IN' || (!get().profile && event !== 'SIGNED_OUT')) {
          get().fetchProfile(session.user.id);
        }
      } else {
        set({ profile: null });
      }
    });
  }
}));
