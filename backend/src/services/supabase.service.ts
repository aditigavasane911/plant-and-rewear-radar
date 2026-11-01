import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  if (!publicClient) {
    if (!config.supabase.url || !config.supabase.publishableKey) {
      console.warn(
        "[Supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Running in fallback mode."
      );
    }
    publicClient = createClient(
      config.supabase.url || "https://placeholder.supabase.co",
      config.supabase.publishableKey || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return publicClient;
}

export function getAdminSupabaseClient(): SupabaseClient {
  if (!adminClient) {
    const key = config.supabase.serviceRoleKey || config.supabase.publishableKey;
    adminClient = createClient(
      config.supabase.url || "https://placeholder.supabase.co",
      key || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return adminClient;
}

export function createUserScopedClient(jwtToken: string): SupabaseClient {
  return createClient(
    config.supabase.url || "https://placeholder.supabase.co",
    config.supabase.publishableKey || "placeholder-key",
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
