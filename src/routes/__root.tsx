import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Lost in the greenhouse</p>
      <h1 className="mt-2 text-6xl text-sienna-deep">404</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        This page doesn't exist or has been moved. Head back to your garden instead.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Something wilted</p>
      <h1 className="mt-2 font-display text-2xl text-sienna-deep">This page didn't load</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Something went wrong on our end. You can try again or head back home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn-primary"
        >
          Try again
        </button>
        <Link to="/" className="btn-outline">
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PlantCare AI — Smart plant diagnosis & care" },
      {
        name: "description",
        content:
          "Snap a photo and get an instant AI plant diagnosis, a personalized care plan, watering reminders and a garden tracker — all in one earthy, handmade-feeling app.",
      },
      { property: "og:title", content: "PlantCare AI — Smart plant diagnosis & care" },
      {
        property: "og:description",
        content:
          "AI plant diagnosis, personalized care plans and a garden tracker in one warm, earthy app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Fira+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var key = 'plantcare-theme';
                  var saved = localStorage.getItem(key);
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved === 'dark' || (saved !== 'light' && prefersDark);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <ThemedAppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedAppContent() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        PlantCare AI — grown with care, one plant at a time.
      </footer>
      <Toaster position="top-right" richColors theme={resolvedTheme} />
    </>
  );
}
