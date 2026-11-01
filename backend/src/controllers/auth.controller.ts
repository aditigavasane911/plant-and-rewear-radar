import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { getPublicSupabaseClient } from "../services/supabase.service.js";

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const supabase = req.supabase || getPublicSupabaseClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) {
      // Fallback profile if row hasn't synced yet
      res.json({
        id: userId,
        email: req.user?.email || null,
        full_name: req.user?.email?.split("@")[0] || "Gardener",
        avatar_url: null,
        provider: "email",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { full_name, avatar_url } = req.body;
    const supabase = req.supabase || getPublicSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}
