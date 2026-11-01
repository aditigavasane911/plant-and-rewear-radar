import type { Request } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  supabase?: SupabaseClient;
}

export interface PlantProfile {
  id: string;
  slug: string;
  name: string;
  botanical_name: string | null;
  category: string;
  emoji: string;
  description: string;
  light: string;
  water: string;
  watering_interval_days: number;
  humidity: string | null;
  temperature: string | null;
  difficulty: string;
  care_tips: string[];
  sort_order: number;
  created_at: string;
}

export interface GardenPlant {
  id: string;
  user_id: string;
  profile_id?: string | null;
  nickname: string;
  species: string;
  image_url?: string | null;
  acquired_at?: string | null;
  watering_interval_days: number;
  last_watered_at: string | null;
  last_fertilized_at?: string | null;
  fertilizing_interval_days?: number;
  notes?: string | null;
  created_at: string;
}

export interface CareEvent {
  id: string;
  plant_id: string;
  user_id: string;
  kind: "watering" | "fertilizing" | "pruning" | "repotting";
  note?: string | null;
  occurred_at: string;
}

export interface DiagnosisIssue {
  name: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
  treatment: string;
}

export interface Diagnosis {
  id: string;
  user_id: string;
  plant_id?: string | null;
  image_url: string;
  plant_name: string;
  scientific_name?: string | null;
  health_status: "healthy" | "needs_attention" | "diseased";
  confidence: number;
  summary: string;
  issues: DiagnosisIssue[];
  watering_interval_days?: number;
  care_tips: string[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string;
  created_at: string;
  updated_at: string;
}
