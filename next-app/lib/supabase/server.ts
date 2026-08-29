import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverSupabaseInstance: SupabaseClient | null = null;

export function isServerSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.trim().length > 0 &&
    key.trim().length > 0 &&
    !url.includes('your-project-id')
  );
}

export function getServerSupabaseClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('[SECURITY FATAL] getServerSupabaseClient must NEVER be called from browser / client components.');
  }

  if (!serverSupabaseInstance && isServerSupabaseConfigured()) {
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!.trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim();

    serverSupabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverSupabaseInstance;
}
