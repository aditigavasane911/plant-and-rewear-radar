import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/diagnose", label: "Diagnose" },
  { to: "/garden", label: "My Garden" },
  { to: "/library", label: "Plant Library" },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-lg text-primary-foreground">
            🌿
          </span>
          <span className="font-display text-xl text-sienna-deep">
            PlantCare <span className="italic text-primary">AI</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:pb-0">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                  (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-44 truncate text-sm text-muted-foreground sm:block">
                {user.email}
              </span>
              <button type="button" onClick={handleSignOut} className="btn-outline px-4 py-1.5 text-sm">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary px-4 py-1.5 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
