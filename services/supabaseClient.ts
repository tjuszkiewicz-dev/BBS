import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.warn('[Supabase] Brakuje VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY w .env.local');
}

export const supabase = createClient(
  url  || 'http://supabase-not-configured.local',
  anon || 'anon-key-not-configured'
);
