import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Este cliente se usará exclusivamente para el Storage (Buckets)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Evita que guarde el token fantasma en Local Storage
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});