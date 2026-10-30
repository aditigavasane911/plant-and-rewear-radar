import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startDemoSession } from "@/lib/demo-session";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — PlantCare AI" },
      {
        name: "description",
        content: "Sign in to PlantCare AI to diagnose plants and track your garden.",
      },
      { property: "og:title", content: "Sign in — PlantCare AI" },
      {
        property: "og:description",
        content: "Sign in to diagnose your plants and track your garden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function sanitizeRedirect(raw: string | undefined): string {
  if (!raw) return "/garden";
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search : "/garden";
  } catch {
    return "/garden";
  }
}

const REDIRECT_KEY = "pc-intended-path";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const target = sanitizeRedirect(search.redirect);

  useEffect(() => {
    if (search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")) {
      sessionStorage.setItem(REDIRECT_KEY, search.redirect);
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const stored = sessionStorage.getItem(REDIRECT_KEY);
        sessionStorage.removeItem(REDIRECT_KEY);
        navigate({ to: stored && stored.startsWith("/") ? stored : "/garden", replace: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterSession = () => {
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    navigate({ to: stored && stored.startsWith("/") ? stored : "/garden", replace: true });
  };

  const handleInstantDemo = () => {
    setBusy(true);
    startDemoSession("demo@plantcare.ai");
    toast.success("Welcome! Signed in as Demo Gardener 🌿");
    afterSession();
  };

  const handleFillDemo = () => {
    setEmail("demo@plantcare.ai");
    setPassword("demo123");
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const targetEmail = email.trim() || "demo@plantcare.ai";

    try {
      // In demo mode, remove restrictions: instantly log the user in without requiring email verification
      startDemoSession(targetEmail);
      if (mode === "signup") {
        toast.success(`Account created! Welcome, ${targetEmail} 🌿`);
      } else {
        toast.success(`Signed in as ${targetEmail} 🌿`);
      }
      afterSession();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: "google") => {
    sessionStorage.setItem(REDIRECT_KEY, target);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        // Fall back to demo session when running locally without OAuth configured
        startDemoSession(`${provider}.user@plantcare.ai`);
        toast.info(`Signed in via Google (Demo) 🌿`);
        afterSession();
        return;
      }
    } catch {
      startDemoSession(`${provider}.user@plantcare.ai`);
      toast.info(`Signed in via Google (Demo) 🌿`);
      afterSession();
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-14">
      <div className="card-surface p-6 sm:p-8">
        {/* Instant Demo Access Card */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-leaf-soft/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="PlantCare AI logo"
              className="size-11 object-contain shrink-0 drop-shadow-sm"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-sienna-deep">Instant Demo Access</h2>
              <p className="text-xs text-muted-foreground">
                No passwords, no restrictions, full access.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="demo-login-btn"
            onClick={handleInstantDemo}
            disabled={busy}
            className="btn-primary mt-3 w-full py-2.5 text-sm font-medium shadow-sm transition-transform active:scale-[0.99]"
          >
            🚀 Continue as Demo User (One-Click)
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or enter details below
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="eyebrow">{mode === "signin" ? "Welcome back" : "New here?"}</p>
        <h1 className="mt-1 text-2xl text-sienna-deep">
          {mode === "signin" ? "Sign in to your garden" : "Create your garden"}
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              id={`tab-${m}`}
              onClick={() => setMode(m)}
              className={
                "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (mode === m ? "bg-card text-sienna-deep shadow-sm" : "text-muted-foreground")
              }
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submitEmail} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="label-base">
                Email
              </label>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-primary hover:underline font-medium"
              >
                Auto-fill demo
              </button>
            </div>
            <input
              id="email"
              type="text"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@plantcare.ai"
              className="input-base mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-base">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any password (e.g. demo)"
              className="input-base mt-1"
            />
          </div>
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={busy}
            className="btn-primary w-full py-2.5"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account & Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or continue with
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => signInWithProvider("google")}
            className="btn-outline w-full"
          >
            <span aria-hidden>🇬</span> Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
