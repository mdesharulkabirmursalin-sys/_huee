import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const hasSupabase = Boolean(url && key && !url.includes('YOUR_PROJECT'));
export const supabase = hasSupabase ? createClient(url, key) : {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ error: new Error('Configure Supabase first.') }),
    signUp: async () => ({ error: new Error('Configure Supabase first.') }),
    signOut: async () => ({ error: null })
  },
  from: () => {
    const fail = { data: null, error: new Error('Configure Supabase first.') };
    const q = { select: () => q, eq: () => q, order: () => Promise.resolve(fail),
      insert: () => Promise.resolve(fail), update: () => q, delete: () => q,
      then: (resolve, reject) => Promise.resolve(fail).then(resolve, reject) };
    return q;
  }
};