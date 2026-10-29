import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { plantProfilesQuery, type PlantProfile } from "@/lib/plant-queries";
import { getBotanicalProfile, type BotanicalProfile } from "@/lib/botanical-data";

export const Route = createFileRoute("/library")({
  loader: ({ context }) => context.queryClient.ensureQueryData(plantProfilesQuery()),
  head: () => ({
    meta: [
      { title: "Plant Library & Botanical Data — PlantCare AI" },
      {
        name: "description",
        content:
          "Browse houseplants with authenticated botanical data: light PPFD, target VPD, soil pH, moisture thresholds, ASPCA toxicology, and care tips.",
      },
      { property: "og:title", content: "Plant Library & Botanical Data — PlantCare AI" },
      {
        property: "og:description",
        content:
          "Browse popular houseplants with real botanical photobiology, soil mechanics, and care needs.",
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
  const [activeBotanical, setActiveBotanical] = useState<BotanicalProfile | null>(null);

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
    <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-8 lg:px-12">
      {/* Top Banner to Data Science Hub */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-secondary/50 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="text-sm font-semibold text-sienna-deep">
              Plant Science & Care Lab
            </h2>
            <p className="text-xs text-muted-foreground">
              Visual tools: check how fast soil dries, test room air comfort, and see test results from 35,723 leaf photos.
            </p>
          </div>
        </div>
        <Link to="/data-science" className="btn-primary text-xs">
          Open Science Lab →
        </Link>
      </div>

      <p className="eyebrow">Plant Library & Care Database</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl text-sienna-deep">Learn before you water</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search species, genus, light…"
            className="input-base w-60"
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
        {filtered.map((p) => {
          const botanical = getBotanicalProfile(p.slug || p.name);
          const isPetSafe =
            !botanical.toxicity.toxic_to_felines && !botanical.toxicity.toxic_to_canines;

          return (
            <article
              key={p.id}
              className="card-surface flex flex-col p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{p.emoji}</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize " +
                      (difficultyStyle[p.difficulty] ?? "bg-muted text-muted-foreground")
                    }
                  >
                    {p.difficulty}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                      (isPetSafe
                        ? "bg-[#6EC6CA]/20 text-[#055B5C]"
                        : "bg-[#d44d62]/15 text-[#d44d62]")
                    }
                  >
                    {isPetSafe ? "🐶 Pet-Safe" : "⚠️ Toxic to Pets"}
                  </span>
                </div>
              </div>

              <h2 className="mt-3 text-xl text-sienna-deep">{p.name}</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs italic text-muted-foreground">{p.botanical_name}</p>
                <span className="text-[10px] text-muted-foreground/60">·</span>
                <span className="text-[11px] font-medium text-copper">{botanical.family}</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

              {/* Simple Visual Care Metric Cards */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 text-[11px]">
                <div className="rounded-lg bg-card p-2 border border-border/60">
                  <span className="font-bold text-sienna-deep flex items-center gap-1">
                    <span>☀️</span> Sunlight
                  </span>
                  <p className="text-muted-foreground truncate mt-0.5">{botanical.lux_range}</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-border/60">
                  <span className="font-bold text-sienna-deep flex items-center gap-1">
                    <span>💧</span> Watering
                  </span>
                  <p className="text-[#08979D] font-medium mt-0.5">Every {p.watering_interval_days} Days</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-border/60">
                  <span className="font-bold text-sienna-deep flex items-center gap-1">
                    <span>🪴</span> Soil
                  </span>
                  <p className="text-muted-foreground mt-0.5">pH {botanical.soil_ph_min} – {botanical.soil_ph_max}</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-border/60">
                  <span className="font-bold text-sienna-deep flex items-center gap-1">
                    <span>💨</span> Room Air
                  </span>
                  <p className="text-muted-foreground mt-0.5">{botanical.vpd_optimal_kpa} kPa (Ideal)</p>
                </div>
              </div>

              {Array.isArray(p.care_tips) && p.care_tips.length > 0 ? (
                <details className="mt-4 border-t border-border pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-primary">
                    🌱 Simple Care Tips ({p.care_tips.length})
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {p.care_tips.map((tip, i) => (
                      <li key={i}>{String(tip)}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <div className="mt-auto flex flex-col gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => setActiveBotanical(botanical)}
                  className="btn-outline w-full py-2 text-xs font-medium"
                >
                  📖 Quick Care Sheet & Facts
                </button>
                <button
                  type="button"
                  onClick={() => addToGarden(p)}
                  className="btn-primary w-full py-2 text-xs"
                >
                  ➕ Add to my garden
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-3xl">🍂</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No plants match that search. Try another name.
          </p>
          <Link to="/diagnose" className="btn-outline mt-4 inline-flex text-sm">
            Can't find it? Diagnose by photo
          </Link>
        </div>
      ) : null}

      {/* Modal: Full Scientific Data Sheet */}
      {activeBotanical ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="card-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeBotanical.emoji}</span>
                <div>
                  <h3 className="font-display text-2xl text-sienna-deep">{activeBotanical.name}</h3>
                  <p className="text-xs italic text-muted-foreground">
                    {activeBotanical.botanical_name} · Family: {activeBotanical.family} (
                    {activeBotanical.order})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBotanical(null)}
                className="btn-ghost size-8 p-0 text-base"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm">
              {/* Native Origin */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <h4 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-xs">
                  <span>🌍</span> Where It Naturally Grows
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{activeBotanical.native_biome}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Origin: {activeBotanical.native_region}
                </p>
              </div>

              {/* Sunlight & Window Spot */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h4 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-xs">
                  <span>☀️</span> Sunlight & Window Spot
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Min Light</span>
                    <p className="font-semibold text-sienna-deep mt-0.5">
                      {activeBotanical.ppfd_min} µmol
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Ideal Sun</span>
                    <p className="font-semibold text-[#08979D] mt-0.5">
                      {activeBotanical.ppfd_optimal} µmol
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Window Spot</span>
                    <p className="font-semibold text-sienna-deep mt-0.5 truncate">
                      {activeBotanical.lux_range}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Daily Sun Need</span>
                    <p className="font-semibold text-sienna-deep mt-0.5">
                      {activeBotanical.dli_target} mol/day
                    </p>
                  </div>
                </div>
              </div>

              {/* Water & Soil Mix */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h4 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-xs">
                  <span>💧</span> Watering & Soil Recipe
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Soil Acidity</span>
                    <p className="font-semibold text-sienna-deep mt-0.5">
                      pH {activeBotanical.soil_ph_min} – {activeBotanical.soil_ph_max}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Water When Soil Hits</span>
                    <p className="font-semibold text-[#08979D] mt-0.5">
                      {activeBotanical.refill_trigger_vwc}% Moisture
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-2.5 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Air Comfort Zone</span>
                    <p className="font-semibold text-[#8474A1] mt-0.5">
                      {activeBotanical.vpd_optimal_kpa} kPa
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-card p-2.5 border border-border text-xs">
                  <span className="font-semibold text-sienna-deep">🥣 Best Soil Mix:</span>{" "}
                  <span className="text-muted-foreground">{activeBotanical.soil_composition.recommended_mix}</span>
                </div>
              </div>

              {/* Pet Safety */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h4 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-xs">
                  <span>🐶</span> Pet Safety & Alerts
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                      (!activeBotanical.toxicity.toxic_to_felines &&
                      !activeBotanical.toxicity.toxic_to_canines
                        ? "bg-[#6EC6CA]/20 text-[#055B5C]"
                        : "bg-[#d44d62]/15 text-[#d44d62]")
                    }
                  >
                    {!activeBotanical.toxicity.toxic_to_felines && !activeBotanical.toxicity.toxic_to_canines
                      ? "🐶 Safe for Cats & Dogs"
                      : "⚠️ Keep Away from Pets"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Signs if chewed:</strong> {activeBotanical.toxicity.clinical_signs}
                </p>
              </div>

              {/* Bug Defense */}
              <div>
                <h4 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-xs">
                  <span>🛡️</span> Common Bug & Mold Resistance
                </h4>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Root Rot</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.pythium_root_rot}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Spider Mites</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.spider_mites}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Leaf Spot</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.xanthomonas_leaf_spot}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Mealybugs</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.mealybugs}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Scale</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.scale_insects}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground">Thrips</p>
                    <p className="font-mono font-bold text-sienna-deep mt-0.5">
                      {activeBotanical.pathogen_susceptibility.thrips}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Link
                to="/data-science"
                className="btn-copper px-4 py-2 text-xs"
                onClick={() => setActiveBotanical(null)}
              >
                📊 Test in Science Lab →
              </Link>
              <button
                type="button"
                onClick={() => setActiveBotanical(null)}
                className="btn-outline px-4 py-2 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
