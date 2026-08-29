import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.trim().length > 0 &&
    key.trim().length > 0 &&
    url !== "MY_SUPABASE_URL" &&
    !url.includes("your-project-id")
  );
}

export function assertProductionDatabaseConfigured(): void {
  if (process.env.NODE_ENV === "production" && !isSupabaseConfigured()) {
    throw new Error(
      "[FATAL] Production requires managed Supabase PostgreSQL. " +
      "Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your production environment variables."
    );
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance && isSupabaseConfigured()) {
    const url = process.env.SUPABASE_URL!.trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!.trim();
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export const getSupabase = getSupabaseClient;

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  tablesVerified?: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      configured: false,
      message: "Supabase is not configured in current environment (.env lacks valid SUPABASE_URL / keys).",
    };
  }

  try {
    const client = getSupabaseClient();
    if (!client) {
      return { connected: false, configured: true, message: "Failed to initialize Supabase client instance." };
    }

    const { data, error } = await client.from("reviews").select("id").limit(1);
    if (error) {
      return {
        connected: false,
        configured: true,
        tablesVerified: false,
        message: `Supabase query error: ${error.message} (Code: ${error.code || "UNKNOWN"})`,
      };
    }

    return {
      connected: true,
      configured: true,
      tablesVerified: true,
      message: "Successfully connected to Supabase PostgreSQL and verified 'reviews' table.",
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Connection failed: ${err.message}`,
    };
  }
}
