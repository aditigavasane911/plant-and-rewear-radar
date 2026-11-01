import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startDemoSession } from "@/lib/demo-session";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    code: typeof search["code"] === "string" ? search["code"] : undefined,
    error: typeof search["error"] === "string" ? search["error"] : undefined,
    error_code: typeof search["error_code"] === "string" ? search["error_code"] : undefined,
    error_description:
      typeof search["error_description"] === "string" ? search["error_description"] : undefined,
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

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="size-5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  const target = sanitizeRedirect(search.redirect);

  useEffect(() => {
    // Check both query params and hash fragment for OAuth callback errors
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const oauthError = search.error || hashParams.get("error");
    const oauthErrorCode = search.error_code || hashParams.get("error_code");
    const oauthErrorDesc = search.error_description || hashParams.get("error_description");

    if (oauthError || oauthErrorDesc) {
      if (oauthError === "access_denied" || oauthErrorCode === "access_denied") {
        toast.error("Google OAuth Access Denied", {
          description:
            "If your Google Cloud Consent Screen is in 'Testing' mode, add your email to 'Test Users' in Google Cloud Console. Also verify your Authorized Redirect URI matches https://ivomnzxhqjhzulfvxjcv.supabase.co/auth/v1/callback.",
          duration: 9000,
        });
      } else {
        toast.error(`Authentication error: ${oauthErrorDesc || oauthError}`, {
          duration: 6000,
        });
      }
    }

    if (search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")) {
      sessionStorage.setItem(REDIRECT_KEY, search.redirect);
    }

    // Check existing session
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const stored = sessionStorage.getItem(REDIRECT_KEY);
        sessionStorage.removeItem(REDIRECT_KEY);
        navigate({ to: stored && stored.startsWith("/") ? stored : "/garden", replace: true });
      }
    });

    // Listen for OAuth redirect state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        toast.success(`Welcome back, ${session.user.email ?? "gardener"}! 🌿`);
        const stored = sessionStorage.getItem(REDIRECT_KEY);
        sessionStorage.removeItem(REDIRECT_KEY);
        navigate({ to: stored && stored.startsWith("/") ? stored : "/garden", replace: true });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate, search.error, search.error_code, search.error_description, search.redirect]);

  const afterSession = () => {
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    navigate({ to: stored && stored.startsWith("/") ? stored : "/garden", replace: true });
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.user) {
          toast.success(`Welcome back, ${data.user.email}! 🌿`);
          afterSession();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.session) {
          toast.success(`Account created! Welcome, ${cleanEmail} 🌿`);
          afterSession();
        } else if (data.user) {
          toast.success("Account created! Please check your email to confirm your account.", {
            duration: 6000,
          });
          setMode("signin");
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleInstantDemo = () => {
    startDemoSession("gardener.demo@plantcare.ai");
    toast.success("Signed in as Demo Gardener! 🌿");
    afterSession();
  };

  const signInWithGoogle = async () => {
    setGoogleBusy(true);
    sessionStorage.setItem(REDIRECT_KEY, target);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

      let googleEnabled = false;
      try {
        const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: publishableKey },
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          googleEnabled = Boolean(settings?.external?.google);
        }
      } catch {
        googleEnabled = true;
      }

      if (!googleEnabled) {
        toast.error("Google OAuth is not enabled on this Supabase project yet.", {
          description:
            "Enable Google in Supabase Dashboard (Auth -> Providers -> Google) with your Google Client ID & Secret.",
          duration: 7000,
        });
        setGoogleBusy(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast.error(`Google Sign-In: ${error.message}`);
        setGoogleBusy(false);
        return;
      }

      if (data?.url) {
        // Preflight check to catch missing secret errors before browser redirect
        try {
          const checkRes = await fetch(data.url);
          if (!checkRes.ok) {
            const errData = await checkRes.json().catch(() => ({}));
            if (errData?.msg?.includes("missing OAuth secret")) {
              toast.error("Google Client Secret is Missing in Supabase", {
                description:
                  "Go to Supabase Dashboard -> Authentication -> Providers -> Google and enter your Google Client Secret along with your Client ID.",
                duration: 9000,
              });
              setGoogleBusy(false);
              return;
            }
          }
        } catch {
          // Continue if precheck is blocked
        }

        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google authentication error");
    } finally {
      setGoogleBusy(false);
    }
  };

  const signInWithApple = async () => {
    setAppleBusy(true);
    sessionStorage.setItem(REDIRECT_KEY, target);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

      let appleEnabled = false;
      try {
        const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: publishableKey },
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          appleEnabled = Boolean(settings?.external?.apple);
        }
      } catch {
        appleEnabled = false;
      }

      if (!appleEnabled) {
        toast.error("Apple Sign-In is not enabled on this Supabase project yet.", {
          description:
            "Enable Apple in Supabase Dashboard (Auth -> Providers -> Apple) with your Services ID, Team ID, Key ID, and Private Key.",
          duration: 7000,
        });
        setAppleBusy(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast.error(`Apple Sign-In: ${error.message}`);
        setAppleBusy(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apple authentication error");
    } finally {
      setAppleBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-14">
      <div className="card-surface p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/logo-icon.png"
            alt="PlantCare AI logo"
            className="size-12 object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <span className="font-display text-2xl text-sienna-deep tracking-tight">
              PlantCare <span className="italic text-primary">AI</span>
            </span>
            <p className="text-xs text-muted-foreground">Sign in to your botanical database</p>
          </div>
        </div>

        {/* Instant Demo Access Button */}
        <button
          type="button"
          onClick={handleInstantDemo}
          disabled={busy || googleBusy}
          className="btn-primary mb-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium shadow-sm"
        >
          <span>🌱</span>
          <span>Instant Demo Access (One-Click)</span>
        </button>

        {/* OAuth Buttons */}
        <div className="grid gap-2.5">
          <button
            type="button"
            id="google-signin-btn"
            onClick={signInWithGoogle}
            disabled={googleBusy || appleBusy || busy}
            className="btn-outline flex w-full items-center justify-center gap-3 py-2.5 text-sm font-medium transition-all hover:bg-accent active:scale-[0.99]"
          >
            <GoogleIcon />
            <span>{googleBusy ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <button
            type="button"
            id="apple-signin-btn"
            onClick={signInWithApple}
            disabled={appleBusy || googleBusy || busy}
            className="btn-outline flex w-full items-center justify-center gap-3 py-2.5 text-sm font-medium transition-all hover:bg-accent active:scale-[0.99]"
          >
            <AppleIcon />
            <span>{appleBusy ? "Connecting to Apple..." : "Continue with Apple"}</span>
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or continue with email
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
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

        {/* Form */}
        <form onSubmit={submitEmail} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label-base">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-base mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-base">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base pr-10"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls="password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={busy || googleBusy}
            className="btn-primary w-full py-2.5"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary hover:underline font-semibold"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
