import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PlantProfile = Database["public"]["Tables"]["plant_profiles"]["Row"];
export type GardenPlant = Database["public"]["Tables"]["garden_plants"]["Row"];
export type CareEvent = Database["public"]["Tables"]["care_events"]["Row"];
export type Diagnosis = Database["public"]["Tables"]["diagnoses"]["Row"];
export type GardenPlantWithEvents = GardenPlant & { care_events: CareEvent[] | null };

export const plantProfilesQuery = () =>
  queryOptions({
    queryKey: ["plant-profiles"],
    queryFn: async (): Promise<PlantProfile[]> => {
      const { data, error } = await supabase
        .from("plant_profiles")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
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
