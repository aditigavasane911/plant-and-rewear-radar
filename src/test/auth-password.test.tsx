import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

// Mock tanstack router
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Route.useSearch in auth
vi.mock("@/routes/auth", async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return mod;
});

describe("Auth Password Visibility Toggle", () => {
  it("renders auth page and toggles password visibility", async () => {
    // import AuthPage component from Route
    const { Route } = await import("@/routes/auth");
    const AuthComponent = Route.options.component;

    if (!AuthComponent) {
      throw new Error("AuthComponent not found");
    }

    // Mock Route.useSearch
    vi.spyOn(Route, "useSearch").mockReturnValue({});

    render(<AuthComponent />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe("password");
    expect(toggleButton).toBeInTheDocument();

    // Click toggle to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    // Click toggle again to hide password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
    expect(screen.getByRole("button", { name: /show password/i })).toBeInTheDocument();
  });
});
