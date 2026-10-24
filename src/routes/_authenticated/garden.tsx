import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { gardenPlantsQuery, plantProfilesQuery, type GardenPlantWithEvents } from "@/lib/plant-queries";
import { formatDate, formatDateTime, wateringStateStyles, wateringStatus } from "@/lib/plants";

export const Route = createFileRoute("/_authenticated/garden")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(gardenPlantsQuery()),
    context.queryClient.ensureQueryData(plantProfilesQuery()),
  ]),
  head: () => ({
    meta: [
      { title: "My Garden — PlantCare AI" },
      {
        name: "description",
        content: "Track every plant you own: watering rhythm, care history and the latest AI diagnoses.",
      },
      { property: "og:title", content: "My Garden — PlantCare AI" },
      { property: "og:description", content: "Track every plant: watering rhythm, care history and AI diagnoses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const queryClient = useQueryClient();
  const { data: plants } = useSuspenseQuery(gardenPlantsQuery());
  const { data: profiles } = useSuspenseQuery(plantProfilesQuery());
  const [showAdd, setShowAdd] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["garden-plants"] });
  };

  const waterMutation = useMutation({
    mutationFn: async (plant: GardenPlantWithEvents) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const now = new Date().toISOString();
      const [eventRes, updateRes] = await Promise.all([
        supabase.from("care_events").insert({ plant_id: plant.id, user_id: user.id, kind: "watering" }),
        supabase.from("garden_plants").update({ last_watered_at: now }).eq("id", plant.id),
      ]);
      if (eventRes.error) throw new Error(eventRes.error.message);
      if (updateRes.error) throw new Error(updateRes.error.message);
    },
    onSuccess: () => {
      toast.success("Watered 💧");
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Something went wrong."),
  });

  const fertilizeMutation = useMutation({
    mutationFn: async (plant: GardenPlantWithEvents) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const now = new Date().toISOString();
      const [eventRes, updateRes] = await Promise.all([
        supabase.from("care_events").insert({ plant_id: plant.id, user_id: user.id, kind: "fertilizing" }),
        supabase.from("garden_plants").update({ last_fertilized_at: now }).eq("id", plant.id),
      ]);
      if (eventRes.error) throw new Error(eventRes.error.message);
      if (updateRes.error) throw new Error(updateRes.error.message);
    },
    onSuccess: () => {
      toast.success("Fertilized 🌱");
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Something went wrong."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (plant: GardenPlantWithEvents) => {
      const { error } = await supabase.from("garden_plants").delete().eq("id", plant.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Plant removed");
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Something went wrong."),
  });

  const summary = plants.reduce(
    (acc, p) => {
      const status = wateringStatus(p.last_watered_at, p.watering_interval_days);
      acc[status.state] += 1;
      return acc;
    },
    { ok: 0, due: 0, overdue: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Garden tracker</p>
          <h1 className="mt-2 text-3xl text-sienna-deep">My Garden</h1>
        </div>
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="btn-primary text-sm">
          {showAdd ? "Close" : "➕ Add a plant"}
        </button>
      </div>

      {plants.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
            {summary.overdue} overdue
          </span>
          <span className="rounded-full bg-sandy/60 px-3 py-1 font-medium text-sienna-deep">
            {summary.due} due today
          </span>
          <span className="rounded-full bg-leaf-soft px-3 py-1 font-medium text-leaf">
            {summary.ok} doing fine
          </span>
        </div>
      ) : null}

      {showAdd ? (
        <AddPlantForm
          profiles={profiles}
          onDone={() => {
            setShowAdd(false);
            invalidate();
          }}
        />
      ) : null}

      {plants.length === 0 && !showAdd ? (
        <div className="card-surface mt-8 p-12 text-center">
          <p className="text-4xl">🪴</p>
          <h2 className="mt-3 text-xl text-sienna-deep">Your garden is waiting</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first plant — pick one from the library or diagnose a photo to get started.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary text-sm">
              Add a plant
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => {
            const status = wateringStatus(plant.last_watered_at, plant.watering_interval_days);
            return (
              <article key={plant.id} className="card-surface flex flex-col p-5">
                <div className="flex items-start gap-3">
                  {plant.image_url ? (
                    <img src={plant.image_url} alt={plant.nickname} className="size-14 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
                      🌿
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg text-sienna-deep">{plant.nickname}</h2>
                    <p className="truncate text-xs italic text-muted-foreground">{plant.species}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className={"rounded-full px-2.5 py-1 font-semibold " + wateringStateStyles[status.state]}>
                    💧 {status.label}
                  </span>
                  {plant.last_fertilized_at ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                      🌱 Fed {formatDate(plant.last_fertilized_at)}
                    </span>
                  ) : null}
                </div>

                {plant.notes ? <p className="mt-3 text-sm text-muted-foreground">{plant.notes}</p> : null}

                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => waterMutation.mutate(plant)}
                      disabled={waterMutation.isPending}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Water now
                    </button>
                    <button
                      type="button"
                      onClick={() => fertilizeMutation.mutate(plant)}
                      disabled={fertilizeMutation.isPending}
                      className="btn-outline px-4 py-2 text-sm"
                    >
                      Fertilize
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${plant.nickname} from your garden?`)) {
                          deleteMutation.mutate(plant);
                        }
                      }}
                      className="btn-ghost px-3 py-2 text-sm text-destructive hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  <details className="mt-3 border-t border-border pt-2">
                    <summary className="cursor-pointer text-xs font-medium text-primary">
                      Care history ({plant.care_events?.length ?? 0})
                    </summary>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                      {plant.care_events && plant.care_events.length > 0 ? (
                        [...plant.care_events]
                          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
                          .slice(0, 15)
                          .map((event) => (
                            <li key={event.id}>
                              {event.kind === "fertilizing" ? "🌱 Fertilized" : "💧 Watered"} —{" "}
                              {formatDateTime(event.occurred_at)}
                            </li>
                          ))
                      ) : (
                        <li>No care logged yet.</li>
                      )}
                    </ul>
                  </details>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Added {formatDate(plant.created_at)} · water every {plant.watering_interval_days} days
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddPlantForm({
  profiles,
  onDone,
}: {
  profiles: Awaited<ReturnType<typeof useSuspenseQuery<ReturnType<typeof plantProfilesQuery>>>["data"]>;
  onDone: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState("");
  const [interval, setInterval] = useState(7);
  const [profileId, setProfileId] = useState("");
  const [busy, setBusy] = useState(false);

  const pickProfile = (id: string) => {
    setProfileId(id);
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setNickname(profile.name);
      setSpecies(profile.botanical_name ?? profile.name);
      setInterval(profile.watering_interval_days);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("garden_plants").insert({
        user_id: user.id,
        profile_id: profileId || null,
        nickname: nickname.trim(),
        species: species.trim() || nickname.trim(),
        watering_interval_days: Math.max(1, interval || 7),
        last_watered_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      toast.success(`${nickname.trim()} joined your garden 🌿`);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the plant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-surface mt-6 grid gap-4 p-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="profile" className="label-base">
          Start from the library (optional)
        </label>
        <select id="profile" value={profileId} onChange={(e) => pickProfile(e.target.value)} className="input-base">
          <option value="">Custom plant</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="nickname" className="label-base">
          Nickname
        </label>
        <input
          id="nickname"
          required
          maxLength={60}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Big Monty"
          className="input-base"
        />
      </div>
      <div>
        <label htmlFor="species" className="label-base">
          Species
        </label>
        <input
          id="species"
          maxLength={80}
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="e.g. Monstera deliciosa"
          className="input-base"
        />
      </div>
      <div>
        <label htmlFor="interval" className="label-base">
          Water every (days)
        </label>
        <input
          id="interval"
          type="number"
          min={1}
          max={90}
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="input-base"
        />
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Planting…" : "Add to garden"}
        </button>
      </div>
    </form>
  );
}
