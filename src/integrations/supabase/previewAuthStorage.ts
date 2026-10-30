/**
 * Auth storage adapter for Supabase's `auth.storage` option.
 * Backed by browser localStorage in client environments, or falls back to in-memory during SSR.
 */

/** Minimal interface expected by Supabase's auth.storage option. */
export interface PreviewAuthStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * Returns a plain `localStorage`-backed storage adapter.
 * Returns `undefined` in SSR contexts where `window` is unavailable,
 * letting Supabase fall back to its own in-memory store.
 */
export function brokeredPreviewStorage(): PreviewAuthStorage | undefined {
  if (typeof window === "undefined") return undefined;

  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore quota errors
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    },
  };
}
