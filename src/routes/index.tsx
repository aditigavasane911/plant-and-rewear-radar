import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import heroImage from "@/assets/hero-plants.jpg";
import { plantProfilesQuery } from "@/lib/plant-queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(plantProfilesQuery()),
  head: () => ({
    meta: [
      { title: "PlantCare AI — Diagnose, water & grow happy plants" },
      {
        name: "description",
        content:
          "Snap a photo, get an instant AI plant diagnosis and treatment plan, then track watering and care for every plant in your garden.",
      },
      { property: "og:title", content: "PlantCare AI — Diagnose, water & grow happy plants" },
      {
        property: "og:description",
        content:
          "AI plant diagnosis, personalized care plans and a garden tracker in one warm, earthy app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    emoji: "🔬",
    title: "AI plant diagnosis",
    text: "Upload a photo and get a health assessment, likely issues and a step-by-step treatment plan in seconds.",
    to: "/diagnose",
  },
  {
    emoji: "💧",
    title: "Care plan & watering",
    text: "Every plant gets a watering rhythm tailored to its species — with gentle nudges when it's time.",
    to: "/garden",
  },
  {
    emoji: "📖",
    title: "Plant library",
    text: "Browse verified taxonomy, light PPFD, target VPD and ASPCA toxicology across popular houseplants.",
    to: "/library",
  },
  {
    emoji: "📊",
    title: "Data science & biophysics",
    text: "Simulate soil moisture decay curves, psychrometric VPD, and examine 54k-sample ML diagnostic benchmarks.",
    to: "/data-science",
  },
];

const steps = [
  {
    n: "1",
    title: "Snap a photo",
    text: "Take or upload a picture of the leaf, stem or soil you're worried about.",
  },
  {
    n: "2",
    title: "Get the diagnosis",
    text: "Our AI identifies the plant, spots issues and explains what to do next.",
  },
  {
    n: "3",
    title: "Add it to your garden",
    text: "Save the plant, follow the care plan and keep it thriving over time.",
  },
];

function Index() {
  const { data: profiles } = useSuspenseQuery(plantProfilesQuery());
  const preview = profiles.slice(0, 6);

  return (
    <div className="relative overflow-hidden">
      {/* Subtle ambient palette glows */}
      <div className="pointer-events-none absolute -top-24 -left-20 size-96 rounded-full bg-[#6EC6CA]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-16 right-0 size-96 rounded-full bg-[#CCABD8]/20 blur-3xl" />

      {/* Hero */}
      <section className="relative mx-auto grid max-w-[1480px] items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-20">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Your pocket botanist & data science hub</p>
            <span className="rounded-full bg-[#6EC6CA]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#055B5C]">
              Real Agronomic Data
            </span>
          </div>
          <h1 className="mt-3 text-4xl leading-tight text-sienna-deep sm:text-5xl lg:text-6xl">
            Know your plants,{" "}
            <span className="italic bg-gradient-to-r from-[#8474A1] via-[#08979D] to-[#6EC6CA] bg-clip-text text-transparent font-normal">
              nurture
            </span>{" "}
            them better.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            PlantCare AI turns a single photo into a full diagnosis — backed by authentic plant
            physiology, photobiological PPFD thresholds, vapor pressure deficit dynamics, and a
            quantitative garden tracker.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/diagnose" className="btn-primary px-7 py-3.5 text-base">
              🔬 Diagnose a plant
            </Link>
            <Link to="/data-science" className="btn-copper px-6 py-3.5 text-base">
              📊 Data Science Hub
            </Link>
            <Link to="/library" className="btn-outline px-6 py-3.5 text-base">
              Explore library
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/80 shadow-[0_20px_50px_-20px_rgba(8,151,157,0.25)]">
          <img
            src={heroImage}
            alt="Houseplants in glazed teal, lilac and amethyst ceramic pots on a modern shelf"
            width={1280}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.01]"
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1480px] px-4 pb-8 sm:px-8 lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="card-surface group p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_-20px_rgba(8,151,157,0.22)]"
            >
              <span className="text-4xl">{f.emoji}</span>
              <h3 className="mt-4 text-xl text-sienna-deep font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <span className="mt-5 inline-block text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1480px] px-4 py-16 sm:px-8 lg:px-12">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl text-sienna-deep sm:text-4xl">
          From leaf to thriving in three steps
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="card-surface p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-sm"
            >
              <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#08979D] to-[#055B5C] font-display text-xl text-white shadow-sm">
                {s.n}
              </span>
              <h3 className="mt-5 text-xl text-sienna-deep font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library preview */}
      <section className="mx-auto max-w-[1480px] px-4 pb-16 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Plant library</p>
            <h2 className="mt-2 text-3xl text-sienna-deep sm:text-4xl">Meet some favourites</h2>
          </div>
          <Link to="/library" className="btn-outline hidden px-5 py-2.5 text-sm sm:inline-flex">
            View all {profiles.length} plants
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {preview.map((p) => (
            <Link
              key={p.id}
              to="/library"
              className="card-surface p-5 text-center transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:bg-accent/60 hover:shadow-sm"
            >
              <span className="text-4xl">{p.emoji}</span>
              <h3 className="mt-3 text-base font-semibold text-sienna-deep">{p.name}</h3>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{p.difficulty}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-gradient-to-b from-secondary/40 via-secondary/70 to-secondary/40">
        <div className="mx-auto flex max-w-[1480px] flex-col items-center gap-5 px-4 py-16 text-center sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl text-sienna-deep sm:text-4xl">
            Your plants are talking. PlantCare AI helps you listen.
          </h2>
          <Link to="/diagnose" className="btn-copper px-7 py-3.5 text-base">
            Get your first diagnosis — it takes a minute
          </Link>
        </div>
      </section>
    </div>
  );
}
