import postgres from "postgres";
import { config } from "../config/env.js";

let sql: postgres.Sql | null = null;

export function getPostgresClient(): postgres.Sql | null {
  if (!config.database.url) {
    return null;
  }

  if (!sql) {
    sql = postgres(config.database.url, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: config.database.url.includes("supabase.co") || config.database.url.includes("pooler")
        ? { rejectUnauthorized: false }
        : false,
    });
  }

  return sql;
}

export async function testPostgresConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  const client = getPostgresClient();
  if (!client) {
    return { connected: false, error: "DATABASE_URL is not configured." };
  }

  try {
    const result = await client`SELECT version()`;
    return { connected: true, version: result[0]?.version };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : String(err) };
  }
}
