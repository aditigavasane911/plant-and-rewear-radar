import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { createUserScopedClient, getPublicSupabaseClient } from "../services/supabase.service.js";

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header with 'Bearer <token>' is required.",
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // Handle local demo session tokens
  if (token.startsWith("demo-token.") || token.includes("demo")) {
    req.user = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "gardener.demo@plantcare.ai",
      role: "authenticated",
    };
    req.supabase = getPublicSupabaseClient();
    return next();
  }

  try {
    const supabase = createUserScopedClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired Supabase authentication session token.",
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    req.supabase = supabase;
    next();
  } catch (err) {
    res.status(401).json({
      error: "Unauthorized",
      message: err instanceof Error ? err.message : "Authentication failed.",
    });
  }
}
