import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { getPublicSupabaseClient } from "../services/supabase.service.js";

export async function getGardenPlants(
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
      .from("garden_plants")
      .select("*, care_events(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
}

export async function addPlant(
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

    const {
      nickname,
      species,
      profile_id,
      image_url,
      watering_interval_days = 7,
      notes,
      acquired_at,
    } = req.body;

    if (!nickname || !species) {
      res.status(400).json({ error: "Validation Error", message: "Nickname and species are required." });
      return;
    }

    const supabase = req.supabase || getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("garden_plants")
      .insert({
        user_id: userId,
        nickname,
        species,
        profile_id: profile_id || null,
        image_url: image_url || null,
        watering_interval_days,
        notes: notes || null,
        acquired_at: acquired_at || new Date().toISOString().split("T")[0],
        last_watered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export async function updatePlant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const supabase = req.supabase || getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("garden_plants")
      .update(req.body)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function deletePlant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const supabase = req.supabase || getPublicSupabaseClient();
    const { error } = await supabase
      .from("garden_plants")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ success: true, message: "Plant deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function logWatering(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { note, kind = "watering" } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const supabase = req.supabase || getPublicSupabaseClient();
    const now = new Date().toISOString();

    // 1. Insert care event
    const { error: eventError } = await supabase.from("care_events").insert({
      plant_id: id,
      user_id: userId,
      kind,
      note: note || null,
      occurred_at: now,
    });

    if (eventError) throw eventError;

    // 2. Update last_watered_at timestamp on plant
    const { data: updatedPlant, error: updateError } = await supabase
      .from("garden_plants")
      .update({ last_watered_at: now })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json({ success: true, plant: updatedPlant });
  } catch (err) {
    next(err);
  }
}
