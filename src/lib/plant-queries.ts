import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { COMPLETE_PLANT_DATABASE, getBotanicalProfile } from "@/lib/botanical-data";

export type PlantProfile = Database["public"]["Tables"]["plant_profiles"]["Row"];
export type GardenPlant = Database["public"]["Tables"]["garden_plants"]["Row"];
export type CareEvent = Database["public"]["Tables"]["care_events"]["Row"];
export type Diagnosis = Database["public"]["Tables"]["diagnoses"]["Row"];
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
