import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { diagnosePlantPhoto } from "../services/ai.service.js";
import { getPublicSupabaseClient } from "../services/supabase.service.js";

export async function diagnose(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { imageDataUrl, plantId, notes } = req.body;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      res.status(400).json({
        error: "Validation Error",
        message: "imageDataUrl is required (base64 data URL).",
      });
      return;
    }

    if (imageDataUrl.length > 5_000_000) {
      res.status(400).json({
        error: "Payload Too Large",
        message: "Image exceeds 5MB limit. Please compress or resize the photo.",
      });
      return;
    }

    const userId = req.user?.id || "00000000-0000-0000-0000-000000000001";
    const diagnosisData = await diagnosePlantPhoto(imageDataUrl, notes, userId, plantId);

    const supabase = req.supabase || getPublicSupabaseClient();
    let savedRow = null;

    try {
      const { data, error } = await supabase
        .from("diagnoses")
        .insert(diagnosisData)
        .select()
        .single();

      if (!error && data) {
        savedRow = data;
      }
    } catch {
      // Continue even if database insertion fails
    }

    res.json({
      success: true,
      diagnosis: savedRow || {
        ...diagnosisData,
        id: "diag-" + Date.now().toString(36),
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDiagnosisHistory(
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
    const { data, error } = await supabase
      .from("diagnoses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
}
