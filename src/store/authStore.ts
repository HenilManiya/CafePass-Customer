import { create } from 'zustand';
import { supabase } from '@/shared';

interface AuthState {
  session: any;
  initialized: boolean;
  setSession: (session: any) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session, initialized: true }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, initialized: true });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  }
}));
