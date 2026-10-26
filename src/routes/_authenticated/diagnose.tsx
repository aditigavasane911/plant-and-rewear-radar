import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { diagnosePlant } from "@/lib/diagnose.functions";
import { fileToResizedDataUrl, formatDate, healthStyles, severityStyles } from "@/lib/plants";
import { diagnosesQuery, gardenPlantsQuery, type Diagnosis } from "@/lib/plant-queries";

export const Route = createFileRoute("/_authenticated/diagnose")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(gardenPlantsQuery()),
      context.queryClient.ensureQueryData(diagnosesQuery()),
    ]),
  head: () => ({
    meta: [
      { title: "Diagnose a plant — PlantCare AI" },
      {
        name: "description",
        content: "Upload a plant photo and get an instant AI health assessment with a treatment plan.",
      },
      { property: "og:title", content: "Diagnose a plant — PlantCare AI" },
      {
        property: "og:description",
        content: "Upload a plant photo and get an instant AI health assessment with a treatment plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiagnosePage,
});

const HEALTH_FALLBACK = { label: "Checking", className: "bg-muted text-muted-foreground" };
const SEVERITY_FALLBACK = { label: "Note", className: "bg-muted text-muted-foreground" };
type DiagnosisIssue = { name: string; severity: string; description: string; treatment: string };

function DiagnosePage() {
  const navigate = useNavigate();
  const { data: plants } = useSuspenseQuery(gardenPlantsQuery());
  const { data: recent, refetch } = useSuspenseQuery(diagnosesQuery());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [plantId, setPlantId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      const url = await fileToResizedDataUrl(file);
      setPreviewUrl(url);
      setDataUrl(url);
      setResult(null);
    } catch {
      toast.error("That image could not be read. Try a different photo.");
    }
  };

  const analyze = async () => {
    if (!dataUrl) {
      toast.error("Add a photo of your plant first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const response = await diagnosePlant({
        data: {
          imageDataUrl: dataUrl,
          plantId: plantId || null,
          notes: notes.trim() || null,
        },
      });
      setResult(response.diagnosis);
      await refetch();
      toast.success("Diagnosis ready 🌿");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The diagnosis failed. Please try again.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const addToGarden = async (d: Diagnosis) => {
    const { error } = await supabaseInsert({
      nickname: d.plant_name,
      species: d.scientific_name && d.scientific_name !== "Unknown" ? d.scientific_name : d.plant_name,
      wateringIntervalDays: d.watering_interval_days ?? 7,
      imageUrl: d.image_url,
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${d.plant_name} joined your garden 🌿`);
    navigate({ to: "/garden" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">AI diagnosis</p>
      <h1 className="mt-2 text-3xl text-sienna-deep">What's ailing your plant?</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Take or upload a clear photo of the leaves, stem or soil. The AI identifies the plant, spots issues and
        writes a treatment plan.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Upload + form */}
        <section className="card-surface p-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 text-center transition-colors hover:border-primary hover:bg-accent/60"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Your plant photo" className="max-h-64 rounded-xl object-contain" />
            ) : (
              <>
                <span className="text-4xl">📷</span>
                <p className="mt-2 text-sm font-medium">Click to choose a photo</p>
                <p className="mt-1 text-xs text-muted-foreground">or drag & drop it here — JPG or PNG</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="plant" className="label-base">
                Attach to a garden plant (optional)
              </label>
              <select
                id="plant"
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className="input-base"
              >
                <option value="">Not attached</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="label-base">
                Anything else we should know? (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Leaves yellowed over two weeks, water every Sunday, sits by a north window…"
                className="input-base resize-none"
              />
            </div>
            <button type="button" onClick={analyze} disabled={busy} className="btn-primary w-full">
              {busy ? "Reading the leaves…" : "🔬 Analyze photo"}
            </button>
          </div>
        </section>

        {/* Result */}
        <section className="card-surface p-6">
          {busy ? (
            <div className="flex min-h-72 animate-pulse flex-col items-center justify-center text-center">
              <span className="text-4xl">🌱</span>
              <p className="mt-3 font-display text-xl text-sienna-deep">Examining your plant…</p>
              <p className="mt-1 text-sm text-muted-foreground">Identifying species, checking leaves & soil</p>
            </div>
          ) : result ? (
            <DiagnosisResult diagnosis={result} onAddToGarden={() => addToGarden(result)} onClear={() => setResult(null)} />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <span className="text-4xl">🪴</span>
              <p className="mt-3 font-display text-xl text-sienna-deep">Your diagnosis appears here</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Choose a photo on the left, add any context, then hit Analyze.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Recent diagnoses */}
      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl text-sienna-deep">Recent diagnoses</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((d) => {
              const style = healthStyles[d.health_status] ?? healthStyles['needs_attention'] ?? HEALTH_FALLBACK;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setResult(d)}
                  className="card-surface overflow-hidden p-4 text-left transition-colors hover:bg-accent"
                >
                  <img src={d.image_url} alt={d.plant_name} className="h-28 w-full rounded-lg object-cover" />
                  <p className="mt-2 truncate font-semibold text-sienna-deep">{d.plant_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                  <span className={"mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold " + style.className}>
                    {style.label} · {d.confidence}%
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function supabaseInsert(input: {
  nickname: string;
  species: string;
  wateringIntervalDays: number;
  imageUrl: string;
}): Promise<{ error: string | null }> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in first." };
    const { error } = await supabase.from("garden_plants").insert({
      user_id: user.id,
      nickname: input.nickname,
      species: input.species,
      watering_interval_days: input.wateringIntervalDays,
      image_url: input.imageUrl,
      last_watered_at: new Date().toISOString(),
    });
    return { error: error ? error.message : null };
  } catch {
    return { error: "Could not save the plant. Please try again." };
  }
}

function DiagnosisResult({
  diagnosis,
  onAddToGarden,
  onClear,
}: {
  diagnosis: Diagnosis;
  onAddToGarden: () => void;
  onClear: () => void;
}) {
  const style = healthStyles[diagnosis.health_status] ?? healthStyles['needs_attention'] ?? HEALTH_FALLBACK;
  const issues = (Array.isArray(diagnosis.issues) ? diagnosis.issues : []) as DiagnosisIssue[];
  const tips = (Array.isArray(diagnosis.care_tips) ? diagnosis.care_tips : []) as string[];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl text-sienna-deep">{diagnosis.plant_name}</h2>
          <p className="text-xs italic text-muted-foreground">{diagnosis.scientific_name}</p>
        </div>
        <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + style.className}>
          {style.label} · {diagnosis.confidence}%
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{diagnosis.summary}</p>

      {issues.length > 0 ? (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">Issues found</h3>
          {issues.map((issue, i) => {
            const severity = severityStyles[issue.severity] ?? severityStyles['moderate'] ?? SEVERITY_FALLBACK;
            return (
              <div key={i} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sienna-deep">{issue.name}</p>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + severity.className}>
                    {severity.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold text-leaf">Treatment: </span>
                  {issue.treatment}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-leaf-soft/60 p-3 text-sm font-medium text-leaf">
          🎉 No issues spotted — your plant looks healthy!
        </p>
      )}

      {tips.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">Care tips</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {diagnosis.watering_interval_days ? (
        <p className="mt-4 text-sm text-muted-foreground">
          💧 Recommended watering rhythm: every{" "}
          <strong className="text-sienna-deep">{diagnosis.watering_interval_days} days</strong>
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={onAddToGarden} className="btn-copper text-sm">
          ➕ Add to my garden
        </button>
        <button type="button" onClick={onClear} className="btn-ghost text-sm">
          Clear result
        </button>
      </div>
    </div>
  );
}
