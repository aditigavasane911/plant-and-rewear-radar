import type { Request, Response, NextFunction } from "express";
import { getPublicSupabaseClient } from "../services/supabase.service.js";

// Rich fallback database if Supabase tables have not been populated
const FALLBACK_PLANTS = [
  {
    id: "monstera-deliciosa",
    slug: "monstera-deliciosa",
    name: "Monstera Deliciosa",
    botanical_name: "Monstera deliciosa",
    category: "houseplant",
    emoji: "🪴",
    description: "Famous for its natural leaf-holes, the Swiss Cheese plant thrives in warm indoor spaces.",
    light: "Bright indirect light",
    water: "Every 7-10 days when topsoil feels dry",
    watering_interval_days: 7,
    humidity: "60-80% RH",
    temperature: "18-30°C (65-85°F)",
    difficulty: "easy",
    care_tips: ["Wipe broad leaves with a damp cloth monthly", "Rotate periodically for balanced growth"],
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "fiddle-leaf-fig",
    slug: "fiddle-leaf-fig",
    name: "Fiddle Leaf Fig",
    botanical_name: "Ficus lyrata",
    category: "tree",
    emoji: "🌳",
    description: "Dramatic violin-shaped leaves that make an architectural statement in any bright living room.",
    light: "Bright, consistent filtered sunlight",
    water: "Every 7-10 days, allowing top 2 inches of soil to dry",
    watering_interval_days: 7,
    humidity: "50-70% RH",
    temperature: "16-24°C (60-75°F)",
    difficulty: "moderate",
    care_tips: ["Avoid drafty doors or air conditioning vents", "Do not move frequently once acclimatized"],
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "snake-plant",
    slug: "snake-plant",
    name: "Snake Plant",
    botanical_name: "Sansevieria trifasciata",
    category: "succulent",
    emoji: "🌿",
    description: "Nearly indestructible architectural succulent capable of filtering volatile organic compounds.",
    light: "Tolerates low to bright direct light",
    water: "Every 14-21 days, soak and dry completely",
    watering_interval_days: 14,
    humidity: "30-50% RH",
    temperature: "15-29°C (60-85°F)",
    difficulty: "easy",
    care_tips: ["Better to under-water than over-water", "Use a fast-draining cactus/succulent soil mix"],
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];

export async function getPlantProfiles(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("plant_profiles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      res.json(data);
      return;
    }

    res.json(FALLBACK_PLANTS);
  } catch (err) {
    next(err);
  }
}

export async function getPlantBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from("plant_profiles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) {
      res.json(data);
      return;
    }

    const fallback = FALLBACK_PLANTS.find((p) => p.slug === slug);
    if (fallback) {
      res.json(fallback);
      return;
    }

    res.status(404).json({ error: "Not Found", message: `Plant profile '${slug}' not found.` });
  } catch (err) {
    next(err);
  }
}
