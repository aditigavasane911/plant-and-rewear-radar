import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { COMPLETE_PLANT_DATABASE } from "@/lib/botanical-data";
import {
  isDemoSessionActive,
  getDemoGardenPlants,
  getDemoDiagnoses,
  getDemoUser,
} from "@/lib/demo-session";

export type PlantProfile = Database["public"]["Tables"]["plant_profiles"]["Row"];
export type GardenPlant = Database["public"]["Tables"]["garden_plants"]["Row"];
export type CareEvent = Database["public"]["Tables"]["care_events"]["Row"];
export type Diagnosis = Database["public"]["Tables"]["diagnoses"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type GardenPlantWithEvents = GardenPlant & { care_events: CareEvent[] | null };

export const plantProfilesQuery = () =>
  queryOptions({
    queryKey: ["plant-profiles"],
    queryFn: async (): Promise<PlantProfile[]> => {
      try {
        const { data, error } = await supabase
          .from("plant_profiles")
          .select("*")
          .order("sort_order", { ascending: true });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback to rich botanical database
      }

      return COMPLETE_PLANT_DATABASE.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        botanical_name: p.botanical_name,
        category: p.category,
        emoji: p.emoji,
        description: p.description,
        light: `PPFD ${p.ppfd_optimal} µmol/m²/s (${p.lux_range})`,
        water: `Refill at ${p.refill_trigger_vwc}% VWC · Every ${p.watering_interval_days} days`,
        watering_interval_days: p.watering_interval_days,
        humidity: `Target VPD ${p.vpd_optimal_kpa} kPa (${p.humidity_optimal_pct[0]}–${p.humidity_optimal_pct[1]}% RH)`,
        temperature: `${p.temp_optimal_c[0]}–${p.temp_optimal_c[1]}°C (${Math.round((p.temp_optimal_c[0] * 9) / 5 + 32)}–${Math.round((p.temp_optimal_c[1] * 9) / 5 + 32)}°F)`,
        difficulty: p.difficulty,
        care_tips: p.care_tips,
        sort_order: p.sort_order,
        created_at: new Date().toISOString(),
      }));
    },
  });

export const gardenPlantsQuery = () =>
  queryOptions({
    queryKey: ["garden-plants"],
    queryFn: async (): Promise<GardenPlantWithEvents[]> => {
      if (isDemoSessionActive()) {
        return getDemoGardenPlants() as unknown as GardenPlantWithEvents[];
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }
      const { data, error } = await supabase
        .from("garden_plants")
        .select("*, care_events(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as GardenPlantWithEvents[];
    },
  });

export const diagnosesQuery = () =>
  queryOptions({
    queryKey: ["diagnoses"],
    queryFn: async (): Promise<Diagnosis[]> => {
      if (isDemoSessionActive()) {
        return getDemoDiagnoses() as unknown as Diagnosis[];
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Diagnosis[];
    },
  });

export const userProfileQuery = () =>
  queryOptions({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<Profile | null> => {
      if (isDemoSessionActive()) {
        const demoUser = getDemoUser();
        return {
          id: demoUser.id,
          email: demoUser.email,
          full_name: demoUser.user_metadata.full_name,
          avatar_url: null,
          provider: "demo",
          created_at: demoUser.created_at,
          updated_at: demoUser.updated_at,
        };
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        // Return fallback profile constructed from auth metadata
        return {
          id: user.id,
          email: user.email ?? null,
          full_name:
            user.user_metadata?.["full_name"] ||
            user.user_metadata?.["name"] ||
            user.email?.split("@")[0] ||
            "Gardener",
          avatar_url: user.user_metadata?.["avatar_url"] || null,
          provider: user.app_metadata?.["provider"] || "email",
          created_at: user.created_at,
          updated_at: user.updated_at ?? user.created_at,
        };
      }
      return data;
    },
  });
