import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — PlantCare AI" },
      { name: "description", content: "Sign in to PlantCare AI to diagnose plants and track your garden." },
      { property: "og:title", content: "Sign in — PlantCare AI" },
      { property: "og:description", content: "Sign in to diagnose your plants and track your garden." },
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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const target = sanitizeRedirect(search.redirect);

  useEffect(() => {
    if (search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")) {
      sessionStorage.setItem(REDIRECT_KEY, search.redirect);
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
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

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirmation(true);
          toast.info("Check your inbox for a confirmation link, then sign in.");
        } else {
          afterSession();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        afterSession();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "lovable") => {
    sessionStorage.setItem(REDIRECT_KEY, target);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (result.redirected) return;
    afterSession();
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="card-surface p-8">
        <p className="eyebrow">{mode === "signin" ? "Welcome back" : "New here?"}</p>
        <h1 className="mt-2 text-3xl text-sienna-deep">
          {mode === "signin" ? "Sign in to your garden" : "Create your garden"}
        </h1>

        {awaitingConfirmation ? (
          <div className="mt-6 rounded-xl bg-leaf-soft/60 p-4 text-sm text-leaf">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
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
            <label htmlFor="email" className="label-base">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-base">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-base"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or continue with
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          <button type="button" onClick={() => signInWithProvider("google")} className="btn-outline w-full">
            <span aria-hidden>🇬</span> Continue with Google
          </button>
          <button type="button" onClick={() => signInWithProvider("lovable")} className="btn-outline w-full">
            <span aria-hidden>💚</span> Continue with Lovable
          </button>
        </div>
      </div>
    </div>
  );
}
