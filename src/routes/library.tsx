import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { plantProfilesQuery, type PlantProfile } from "@/lib/plant-queries";

export const Route = createFileRoute("/library")({
  loader: ({ context }) => context.queryClient.ensureQueryData(plantProfilesQuery()),
  head: () => ({
    meta: [
      { title: "Plant Library — PlantCare AI" },
      {
        name: "description",
        content:
          "Browse popular houseplants with their light, water, humidity and difficulty needs — plus pro care tips for each one.",
      },
      { property: "og:title", content: "Plant Library — PlantCare AI" },
      {
        property: "og:description",
        content: "Browse popular houseplants with their light, water, humidity and difficulty needs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const difficultyStyle: Record<string, string> = {
  easy: "bg-leaf-soft text-leaf",
  moderate: "bg-sandy/60 text-sienna-deep",
  challenging: "bg-destructive/10 text-destructive",
};

function LibraryPage() {
  const navigate = useNavigate();
  const { data: profiles } = useSuspenseQuery(plantProfilesQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(profiles.map((p) => p.category)))],
    [profiles],
  );

  const filtered = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.botanical_name ?? "").toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const addToGarden = async (profile: PlantProfile) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/library" } });
      return;
    }
    const { error } = await supabase.from("garden_plants").insert({
      user_id: user.id,
      profile_id: profile.id,
      nickname: profile.name,
      species: profile.botanical_name ?? profile.name,
      watering_interval_days: profile.watering_interval_days,
      last_watered_at: new Date().toISOString(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${profile.name} joined your garden 🌿`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Plant library</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl text-sienna-deep">Learn before you water</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plants…"
            className="input-base w-56"
            aria-label="Search plants"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-base w-40 capitalize"
            aria-label="Filter by category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All types" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <article key={p.id} className="card-surface flex flex-col p-6">
            <div className="flex items-start justify-between">
              <span className="text-4xl">{p.emoji}</span>
              <span className={"rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + (difficultyStyle[p.difficulty] ?? "bg-muted text-muted-foreground")}>
                {p.difficulty}
              </span>
            </div>
            <h2 className="mt-3 text-xl text-sienna-deep">{p.name}</h2>
            <p className="text-xs italic text-muted-foreground">{p.botanical_name}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="font-semibold text-sienna-deep">☀️ Light</dt>
                <dd className="text-muted-foreground">{p.light}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold text-sienna-deep">💧 Water</dt>
                <dd className="text-muted-foreground">{p.water}</dd>
              </div>
              {p.humidity ? (
                <div className="flex gap-2">
                  <dt className="font-semibold text-sienna-deep">🌫️ Humidity</dt>
                  <dd className="text-muted-foreground">{p.humidity}</dd>
                </div>
              ) : null}
            </dl>
            {p.care_tips.length > 0 ? (
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-primary">Pro tips</summary>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {p.care_tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            <div className="mt-auto pt-5">
              <button type="button" onClick={() => addToGarden(p)} className="btn-primary w-full text-sm">
                Add to my garden
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-3xl">🍂</p>
          <p className="mt-2 text-sm text-muted-foreground">No plants match that search. Try another name.</p>
          <Link to="/diagnose" className="btn-outline mt-4 inline-flex text-sm">
            Can't find it? Diagnose by photo
          </Link>
        </div>
      ) : null}
    </div>
  );
}
