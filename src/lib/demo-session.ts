export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_SESSION_KEY = "plantcare_demo_session";
export const DEMO_PLANTS_KEY = "plantcare_demo_plants";
export const DEMO_DIAGNOSES_KEY = "plantcare_demo_diagnoses";

export interface DemoSessionData {
  email: string;
  name: string;
  startedAt: string;
}

export function isDemoSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEMO_SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export function getStoredDemoEmail(): string {
  if (typeof window === "undefined") return "demo@plantcare.ai";
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return "demo@plantcare.ai";
    const parsed = JSON.parse(raw) as DemoSessionData;
    return parsed.email || "demo@plantcare.ai";
  } catch {
    return "demo@plantcare.ai";
  }
}

export function getDemoUser(emailOverride?: string) {
  const email = emailOverride || getStoredDemoEmail();
  const rawName = (email.includes("@") ? email.split("@")[0] : email) || "Demo Gardener";
  const name = rawName || "Demo Gardener";
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    id: DEMO_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: "2024-01-01T00:00:00.000Z",
    phone: "",
    confirmed_at: "2024-01-01T00:00:00.000Z",
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      full_name: `${capitalized} (Demo)`,
      name: `${capitalized} (Demo)`,
      is_demo: true,
    },
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
  };
}

export function getDemoSession(emailOverride?: string) {
  const user = getDemoUser(emailOverride);
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email }));
  const token = `demo-token.${payload}.signature`;

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 31536000,
    expires_at: Math.floor(Date.now() / 1000) + 31536000,
    refresh_token: "demo-refresh-token",
    user,
  };
}

export function startDemoSession(email?: string): void {
  if (typeof window === "undefined") return;
  const userEmail = email && email.trim() ? email.trim() : "demo@plantcare.ai";
  const rawName =
    (userEmail.includes("@") ? userEmail.split("@")[0] : userEmail) || "Demo Gardener";
  const name = rawName || "Demo Gardener";
  const data: DemoSessionData = {
    email: userEmail,
    name,
    startedAt: new Date().toISOString(),
  };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(data));
  initDemoPlantsIfEmpty();
  window.dispatchEvent(
    new CustomEvent("plantcare:auth-change", {
      detail: { event: "SIGNED_IN", session: getDemoSession(userEmail) },
    }),
  );
}

export function endDemoSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
  window.dispatchEvent(
    new CustomEvent("plantcare:auth-change", { detail: { event: "SIGNED_OUT", session: null } }),
  );
}

export interface DemoCareEvent {
  id: string;
  plant_id: string;
  user_id: string;
  kind: string;
  note: string | null;
  occurred_at: string;
}

export interface DemoGardenPlant {
  id: string;
  user_id: string;
  profile_id: string | null;
  nickname: string;
  species: string;
  watering_interval_days: number;
  fertilizing_interval_days: number | null;
  last_watered_at: string | null;
  last_fertilized_at: string | null;
  acquired_at: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  care_events: DemoCareEvent[];
}

const DEFAULT_DEMO_PLANTS: DemoGardenPlant[] = [
  {
    id: "demo-plant-1",
    user_id: DEMO_USER_ID,
    profile_id: null,
    nickname: "Monty Monstera",
    species: "Monstera deliciosa",
    watering_interval_days: 7,
    fertilizing_interval_days: 30,
    last_watered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_fertilized_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    acquired_at: "2024-02-14",
    notes: "Near north-facing bay window. Unfurled a beautiful fenestrated leaf last week!",
    image_url: null,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    care_events: [
      {
        id: "evt-1",
        plant_id: "demo-plant-1",
        user_id: DEMO_USER_ID,
        kind: "watering",
        note: "Filtered water",
        occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "evt-2",
        plant_id: "demo-plant-1",
        user_id: DEMO_USER_ID,
        kind: "fertilizing",
        note: "Half strength organic liquid",
        occurred_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "demo-plant-2",
    user_id: DEMO_USER_ID,
    profile_id: null,
    nickname: "Fiona Fig",
    species: "Ficus lyrata (Fiddle Leaf Fig)",
    watering_interval_days: 10,
    fertilizing_interval_days: 30,
    // Set 11 days ago so it displays as 'Due' or 'Overdue' for a rich UI state demo
    last_watered_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    last_fertilized_at: null,
    acquired_at: "2024-03-01",
    notes: "Requires consistent watering rhythm and good drainage.",
    image_url: null,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    care_events: [
      {
        id: "evt-3",
        plant_id: "demo-plant-2",
        user_id: DEMO_USER_ID,
        kind: "watering",
        note: null,
        occurred_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "demo-plant-3",
    user_id: DEMO_USER_ID,
    profile_id: null,
    nickname: "Serena Snake Plant",
    species: "Sansevieria trifasciata",
    watering_interval_days: 21,
    fertilizing_interval_days: 60,
    last_watered_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    last_fertilized_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    acquired_at: "2023-11-20",
    notes: "Very hardy plant on the bookshelf. Prefers drier soil.",
    image_url: null,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    care_events: [],
  },
];

export function initDemoPlantsIfEmpty(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(DEMO_PLANTS_KEY);
    if (!existing) {
      localStorage.setItem(DEMO_PLANTS_KEY, JSON.stringify(DEFAULT_DEMO_PLANTS));
    }
  } catch (e) {
    console.error("Could not initialize demo plants:", e);
  }
}

export function getDemoGardenPlants(): DemoGardenPlant[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_PLANTS;
  try {
    initDemoPlantsIfEmpty();
    const raw = localStorage.getItem(DEMO_PLANTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_PLANTS;
  } catch {
    return DEFAULT_DEMO_PLANTS;
  }
}

export function saveDemoGardenPlants(plants: DemoGardenPlant[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_PLANTS_KEY, JSON.stringify(plants));
  } catch (e) {
    console.error("Could not save demo plants:", e);
  }
}

export function addDemoGardenPlant(input: Partial<DemoGardenPlant>): DemoGardenPlant {
  const plants = getDemoGardenPlants();
  const id = "demo-plant-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  const newPlant: DemoGardenPlant = {
    id,
    user_id: DEMO_USER_ID,
    profile_id: input.profile_id || null,
    nickname: input.nickname || "New Plant",
    species: input.species || input.nickname || "Botanical species",
    watering_interval_days: input.watering_interval_days || 7,
    fertilizing_interval_days: input.fertilizing_interval_days || 30,
    last_watered_at: input.last_watered_at || now,
    last_fertilized_at: input.last_fertilized_at || null,
    acquired_at: input.acquired_at || now.slice(0, 10),
    notes: input.notes || null,
    image_url: input.image_url || null,
    created_at: now,
    care_events: [
      {
        id: "evt-" + Date.now().toString(36),
        plant_id: id,
        user_id: DEMO_USER_ID,
        kind: "watering",
        note: "Initial planting",
        occurred_at: now,
      },
    ],
  };

  plants.unshift(newPlant);
  saveDemoGardenPlants(plants);
  return newPlant;
}

export function waterDemoPlant(plantId: string): void {
  const plants = getDemoGardenPlants();
  const plant = plants.find((p) => p.id === plantId);
  if (!plant) return;

  const now = new Date().toISOString();
  plant.last_watered_at = now;
  if (!plant.care_events) plant.care_events = [];
  plant.care_events.unshift({
    id: "evt-" + Date.now().toString(36),
    plant_id: plantId,
    user_id: DEMO_USER_ID,
    kind: "watering",
    note: null,
    occurred_at: now,
  });

  saveDemoGardenPlants(plants);
}

export function fertilizeDemoPlant(plantId: string): void {
  const plants = getDemoGardenPlants();
  const plant = plants.find((p) => p.id === plantId);
  if (!plant) return;

  const now = new Date().toISOString();
  plant.last_fertilized_at = now;
  if (!plant.care_events) plant.care_events = [];
  plant.care_events.unshift({
    id: "evt-" + Date.now().toString(36),
    plant_id: plantId,
    user_id: DEMO_USER_ID,
    kind: "fertilizing",
    note: null,
    occurred_at: now,
  });

  saveDemoGardenPlants(plants);
}

export function deleteDemoPlant(plantId: string): void {
  const plants = getDemoGardenPlants().filter((p) => p.id !== plantId);
  saveDemoGardenPlants(plants);
}

export interface DemoDiagnosis {
  id: string;
  user_id: string;
  plant_id: string | null;
  image_url: string;
  plant_name: string;
  scientific_name: string | null;
  health_status: string;
  confidence: number;
  summary: string;
  issues: Array<{ name: string; severity: string; description: string; treatment: string }>;
  watering_interval_days: number | null;
  care_tips: string[];
  created_at: string;
}

const DEFAULT_DEMO_DIAGNOSES: DemoDiagnosis[] = [
  {
    id: "demo-diag-1",
    user_id: DEMO_USER_ID,
    plant_id: "demo-plant-1",
    image_url:
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    plant_name: "Monstera Deliciosa",
    scientific_name: "Monstera deliciosa Liebm.",
    health_status: "healthy",
    confidence: 96,
    summary:
      "The plant exhibits vibrant deep green foliage with balanced fenestrations and firm petioles. No pests or systemic fungal symptoms detected.",
    issues: [],
    watering_interval_days: 7,
    care_tips: [
      "Maintain bright, indirect sunlight to preserve large split leaf development.",
      "Dust leaves gently once monthly to maximize photosynthesis.",
      "Allow top 2 inches of soil to dry before the next watering.",
    ],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getDemoDiagnoses(): DemoDiagnosis[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_DIAGNOSES;
  try {
    const raw = localStorage.getItem(DEMO_DIAGNOSES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_DIAGNOSES;
  } catch {
    return DEFAULT_DEMO_DIAGNOSES;
  }
}

export function addDemoDiagnosis(input: Partial<DemoDiagnosis>): DemoDiagnosis {
  const list = getDemoDiagnoses();
  const id = "demo-diag-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  const item: DemoDiagnosis = {
    id,
    user_id: DEMO_USER_ID,
    plant_id: input.plant_id || null,
    image_url: input.image_url || "",
    plant_name: input.plant_name || "Houseplant",
    scientific_name: input.scientific_name || null,
    health_status: input.health_status || "healthy",
    confidence: input.confidence ?? 92,
    summary: input.summary || "Health check completed. Overall good condition.",
    issues: input.issues || [],
    watering_interval_days: input.watering_interval_days ?? 7,
    care_tips: input.care_tips || [
      "Keep in bright indirect light",
      "Water thoroughly when topsoil dries",
    ],
    created_at: now,
  };

  list.unshift(item);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEMO_DIAGNOSES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Could not save demo diagnosis:", e);
    }
  }
  return item;
}

export const saveDemoDiagnosis = addDemoDiagnosis;

