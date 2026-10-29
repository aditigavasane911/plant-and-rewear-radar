// Supabase client with integrated Demo Mode support
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import {
  isDemoSessionActive,
  getDemoUser,
  getDemoSession,
  startDemoSession,
  endDemoSession,
  getDemoGardenPlants,
  addDemoGardenPlant,
  waterDemoPlant,
  fertilizeDemoPlant,
  deleteDemoPlant,
  getDemoDiagnoses,
  addDemoDiagnosis,
} from "@/lib/demo-session";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

// The public URL can be reachable only from the browser, so server requests go to the runtime URL of the same backend.
function serverSupabaseUrl(publicUrl: string, supabaseKey: string): string | undefined {
  if (typeof window !== "undefined" || typeof process === "undefined") return undefined;
  const serverUrl = process.env["SUPABASE_URL"]?.replace(/\/+$/, "");
  if (
    !serverUrl ||
    serverUrl === publicUrl ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] !== supabaseKey
  )
    return undefined;
  return serverUrl;
}

function createSupabaseFetch(supabaseUrl: string, supabaseKey: string): typeof fetch {
  const publicUrl = supabaseUrl.replace(/\/+$/, "");
  const serverUrl = serverSupabaseUrl(publicUrl, supabaseKey);
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    if (serverUrl) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(`${publicUrl}/`)) {
        const target = serverUrl + url.slice(publicUrl.length);
        const request =
          typeof input === "string" || input instanceof URL ? target : new Request(target, input);
        return fetch(request, { ...init, headers });
      }
    }
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function createDemoGardenPlantsBuilder() {
  let pendingAction:
    | { type: "select" }
    | { type: "insert"; data: any }
    | { type: "update"; data: any; targetId?: string }
    | { type: "delete"; targetId?: string } = { type: "select" };

  const builder: any = {
    select: () => builder,
    eq: (column: string, value: any) => {
      if (column === "id" && (pendingAction.type === "update" || pendingAction.type === "delete")) {
        pendingAction.targetId = value;
      }
      return builder;
    },
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    insert: (values: any) => {
      pendingAction = { type: "insert", data: values };
      return builder;
    },
    update: (values: any) => {
      pendingAction = { type: "update", data: values };
      return builder;
    },
    delete: () => {
      pendingAction = { type: "delete" };
      return builder;
    },
    then: (resolve?: any, reject?: any) => {
      try {
        if (pendingAction.type === "insert") {
          const inserted = Array.isArray(pendingAction.data)
            ? pendingAction.data.map((d: any) => addDemoGardenPlant(d))
            : addDemoGardenPlant(pendingAction.data);
          const res = { data: Array.isArray(inserted) ? inserted : [inserted], error: null };
          return Promise.resolve(res).then(resolve, reject);
        }
        if (pendingAction.type === "update") {
          if (pendingAction.targetId) {
            if (pendingAction.data.last_watered_at) {
              waterDemoPlant(pendingAction.targetId);
            }
            if (pendingAction.data.last_fertilized_at) {
              fertilizeDemoPlant(pendingAction.targetId);
            }
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
        if (pendingAction.type === "delete") {
          if (pendingAction.targetId) {
            deleteDemoPlant(pendingAction.targetId);
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
        const plants = getDemoGardenPlants();
        return Promise.resolve({ data: plants, error: null }).then(resolve, reject);
      } catch (err: any) {
        return Promise.resolve({
          data: null,
          error: { message: err?.message || "Demo operation failed" },
        }).then(resolve, reject);
      }
    },
  };
  return builder;
}

function createDemoCareEventsBuilder() {
  let pendingInsert: any = null;
  const builder: any = {
    insert: (data: any) => {
      pendingInsert = data;
      return builder;
    },
    then: (resolve?: any, reject?: any) => {
      if (pendingInsert) {
        const events = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
        for (const ev of events) {
          if (ev.kind === "watering" && ev.plant_id) {
            waterDemoPlant(ev.plant_id);
          } else if (ev.kind === "fertilizing" && ev.plant_id) {
            fertilizeDemoPlant(ev.plant_id);
          }
        }
      }
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
    },
  };
  return builder;
}

function createDemoDiagnosesBuilder() {
  let pendingInsert: any = null;
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    insert: (data: any) => {
      pendingInsert = data;
      return builder;
    },
    then: (resolve?: any, reject?: any) => {
      if (pendingInsert) {
        const item = addDemoDiagnosis(pendingInsert);
        return Promise.resolve({ data: item, error: null }).then(resolve, reject);
      }
      return Promise.resolve({ data: getDemoDiagnoses(), error: null }).then(resolve, reject);
    },
  };
  return builder;
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();

    if (prop === "auth") {
      const realAuth = _supabase.auth;
      return {
        ...realAuth,
        getUser: async (token?: string) => {
          if (isDemoSessionActive()) {
            return { data: { user: getDemoUser() as any }, error: null };
          }
          try {
            const res = await realAuth.getUser(token);
            if (!res.error && res.data?.user) return res;
            if (isDemoSessionActive()) {
              return { data: { user: getDemoUser() as any }, error: null };
            }
            return res;
          } catch (e) {
            if (isDemoSessionActive()) {
              return { data: { user: getDemoUser() as any }, error: null };
            }
            throw e;
          }
        },
        getSession: async () => {
          if (isDemoSessionActive()) {
            return { data: { session: getDemoSession() as any }, error: null };
          }
          try {
            const res = await realAuth.getSession();
            if (!res.error && res.data?.session) return res;
            if (isDemoSessionActive()) {
              return { data: { session: getDemoSession() as any }, error: null };
            }
            return res;
          } catch (e) {
            if (isDemoSessionActive()) {
              return { data: { session: getDemoSession() as any }, error: null };
            }
            throw e;
          }
        },
        onAuthStateChange: (callback: any) => {
          const handler = (e: any) => {
            if (e?.detail) {
              callback(e.detail.event, e.detail.session);
            }
          };
          if (typeof window !== "undefined") {
            window.addEventListener("plantcare:auth-change", handler);
          }
          const { data: realSub } = realAuth.onAuthStateChange(callback);
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  if (typeof window !== "undefined") {
                    window.removeEventListener("plantcare:auth-change", handler);
                  }
                  realSub?.subscription?.unsubscribe();
                },
              },
            },
          };
        },
        signOut: async (options?: any) => {
          if (isDemoSessionActive()) {
            endDemoSession();
          }
          try {
            return await realAuth.signOut(options);
          } catch {
            return { error: null };
          }
        },
        signInWithPassword: async (credentials: any) => {
          try {
            const res = await realAuth.signInWithPassword(credentials);
            if (!res.error && res.data?.user) return res;
            startDemoSession(credentials.email);
            return {
              data: {
                user: getDemoUser(credentials.email) as any,
                session: getDemoSession(credentials.email) as any,
              },
              error: null,
            };
          } catch {
            startDemoSession(credentials.email);
            return {
              data: {
                user: getDemoUser(credentials.email) as any,
                session: getDemoSession(credentials.email) as any,
              },
              error: null,
            };
          }
        },
        signUp: async (credentials: any) => {
          try {
            const res = await realAuth.signUp(credentials);
            if (!res.error && res.data?.session) return res;
            startDemoSession(credentials.email);
            return {
              data: {
                user: getDemoUser(credentials.email) as any,
                session: getDemoSession(credentials.email) as any,
              },
              error: null,
            };
          } catch {
            startDemoSession(credentials.email);
            return {
              data: {
                user: getDemoUser(credentials.email) as any,
                session: getDemoSession(credentials.email) as any,
              },
              error: null,
            };
          }
        },
      };
    }

    if (prop === "from") {
      return (table: string) => {
        if (isDemoSessionActive()) {
          if (table === "garden_plants") {
            return createDemoGardenPlantsBuilder();
          }
          if (table === "care_events") {
            return createDemoCareEventsBuilder();
          }
          if (table === "diagnoses") {
            return createDemoDiagnosesBuilder();
          }
        }
        return _supabase!.from(table as any);
      };
    }

    return Reflect.get(_supabase, prop, receiver);
  },
});
