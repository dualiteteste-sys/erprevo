import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[AUTH] Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: { fetch },
  functions: {
    url: functionsUrl,
  },
});
