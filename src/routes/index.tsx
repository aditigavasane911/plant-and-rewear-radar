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
        content: "AI plant diagnosis, personalized care plans and a garden tracker in one warm, earthy app.",
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
    text: "Browse the needs of popular houseplants: light, water, humidity and pro tips, all in one place.",
    to: "/library",
  },
];

const steps = [
  { n: "1", title: "Snap a photo", text: "Take or upload a picture of the leaf, stem or soil you're worried about." },
  { n: "2", title: "Get the diagnosis", text: "Our AI identifies the plant, spots issues and explains what to do next." },
  { n: "3", title: "Add it to your garden", text: "Save the plant, follow the care plan and keep it thriving over time." },
];

function Index() {
  const { data: profiles } = useSuspenseQuery(plantProfilesQuery());
  const preview = profiles.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="eyebrow">Your pocket botanist</p>
          <h1 className="mt-3 text-4xl leading-tight text-sienna-deep sm:text-5xl">
            Know your plants, <span className="italic text-primary">nurture</span> them better.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            PlantCare AI turns a single photo into a full diagnosis — what's ailing your plant, how to treat it,
            and exactly when to water next. All your green companions, tracked in one warm little garden.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/diagnose" className="btn-primary px-6 py-3">
              🔬 Diagnose a plant
            </Link>
            <Link to="/library" className="btn-outline px-6 py-3">
              Explore the library
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border shadow-[0_18px_50px_-24px_color-mix(in_oklab,var(--sienna-deep)_45%,transparent)]">
          <img
            src={heroImage}
            alt="Hand-painted houseplants on a wooden shelf in terracotta pots"
            width={1280}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="card-surface group p-6 transition-shadow hover:shadow-[0_14px_40px_-20px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
            >
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 text-xl text-sienna-deep">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl text-sienna-deep">From leaf to thriving in three steps</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card-surface p-6">
              <span className="grid size-10 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg text-sienna-deep">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library preview */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Plant library</p>
            <h2 className="mt-2 text-3xl text-sienna-deep">Meet some favourites</h2>
          </div>
          <Link to="/library" className="btn-outline hidden px-4 py-2 text-sm sm:inline-flex">
            View all {profiles.length} plants
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {preview.map((p) => (
            <Link key={p.id} to="/library" className="card-surface p-4 text-center transition-colors hover:bg-accent">
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-2 text-sm font-semibold text-sienna-deep">{p.name}</h3>
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">{p.difficulty}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-secondary/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
          <h2 className="max-w-xl text-3xl text-sienna-deep">
            Your plants are talking. PlantCare AI helps you listen.
          </h2>
          <Link to="/diagnose" className="btn-copper px-6 py-3">
            Get your first diagnosis — it takes a minute
          </Link>
        </div>
      </section>
    </div>
  );
}
