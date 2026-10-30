import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  COMPLETE_PLANT_DATABASE,
  calculateVPD,
  classifyVPD,
  simulateSoilMoistureDecay,
  ML_MODEL_METRICS,
  type BotanicalProfile,
} from "@/lib/botanical-data";
import { DATASET_SUMMARY, PLANT_VILLAGE_CLASSES } from "@/lib/dataset-model";

export const Route = createFileRoute("/data-science")({
  head: () => ({
    meta: [
      { title: "Plant Biophysics & Data Science Engine — PlantCare AI" },
      {
        name: "description",
        content:
          "In-depth plant biophysics, soil moisture decay models, vapor pressure deficit (VPD) psychrometrics, and computer vision diagnostic machine learning benchmarks.",
      },
    ],
  }),
  component: DataSciencePage,
});

function DataSciencePage() {
  // State for interactive simulation
  const [selectedSlug, setSelectedSlug] = useState<string>("monstera");
  const [ambientTemp, setAmbientTemp] = useState<number>(23);
  const [ambientRh, setAmbientRh] = useState<number>(55);
  const [potVolume, setPotVolume] = useState<number>(3.0);
  const [simDays, setSimDays] = useState<number>(30);

  // State for radar comparison
  const [radarPlantA, setRadarPlantA] = useState<string>("monstera");
  const [radarPlantB, setRadarPlantB] = useState<string>("snake-plant");
  const [radarPlantC, setRadarPlantC] = useState<string>("calathea");

  // Selected profile
  const selectedPlant = useMemo(() => {
    return (
      COMPLETE_PLANT_DATABASE.find((p) => p.slug === selectedSlug) || COMPLETE_PLANT_DATABASE[0]!
    );
  }, [selectedSlug]);

  // VPD calculation
  const currentVpd = useMemo(() => {
    return calculateVPD(ambientTemp, ambientRh);
  }, [ambientTemp, ambientRh]);

  const vpdClass = useMemo(() => {
    return classifyVPD(currentVpd);
  }, [currentVpd]);

  // 30-Day Soil Moisture Decay Simulation Data
  const moistureSimulationData = useMemo(() => {
    return simulateSoilMoistureDecay(selectedPlant, potVolume, ambientTemp, ambientRh, simDays);
  }, [selectedPlant, potVolume, ambientTemp, ambientRh, simDays]);

  // Radar comparative data
  const radarData = useMemo(() => {
    const plantA =
      COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantA) || COMPLETE_PLANT_DATABASE[0]!;
    const plantB =
      COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantB) || COMPLETE_PLANT_DATABASE[1]!;
    const plantC =
      COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantC) || COMPLETE_PLANT_DATABASE[7]!;

    return [
      {
        axis: "☀️ Sun Need",
        [plantA.name]: Math.round((plantA.ppfd_optimal / 500) * 100),
        [plantB.name]: Math.round((plantB.ppfd_optimal / 500) * 100),
        [plantC.name]: Math.round((plantC.ppfd_optimal / 500) * 100),
      },
      {
        axis: "🌵 Drought Toughness",
        [plantA.name]: Math.round((plantA.watering_interval_days / 21) * 100),
        [plantB.name]: Math.round((plantB.watering_interval_days / 21) * 100),
        [plantC.name]: Math.round((plantC.watering_interval_days / 21) * 100),
      },
      {
        axis: "💧 Water Thirst",
        [plantA.name]: Math.round(plantA.crop_coefficient_kc * 100),
        [plantB.name]: Math.round(plantB.crop_coefficient_kc * 100),
        [plantC.name]: Math.round(plantC.crop_coefficient_kc * 100),
      },
      {
        axis: "🛡️ Root Defense",
        [plantA.name]: Math.round(100 - plantA.pathogen_susceptibility.pythium_root_rot),
        [plantB.name]: Math.round(100 - plantB.pathogen_susceptibility.pythium_root_rot),
        [plantC.name]: Math.round(100 - plantC.pathogen_susceptibility.pythium_root_rot),
      },
      {
        axis: "🌫️ Humidity Need",
        [plantA.name]: Math.round(plantA.humidity_optimal_pct[0]),
        [plantB.name]: Math.round(plantB.humidity_optimal_pct[0]),
        [plantC.name]: Math.round(plantC.humidity_optimal_pct[0]),
      },
      {
        axis: "🪴 Soil Grit",
        [plantA.name]: Math.round((plantA.ec_tolerance_ms / 2.5) * 100),
        [plantB.name]: Math.round((plantB.ec_tolerance_ms / 2.5) * 100),
        [plantC.name]: Math.round((plantC.ec_tolerance_ms / 2.5) * 100),
      },
    ];
  }, [radarPlantA, radarPlantB, radarPlantC]);

  // VPD Contour Surface Matrix for 2D visualization
  const vpdContourData = useMemo(() => {
    const temps = [16, 20, 24, 28, 32];
    return temps.map((t) => {
      return {
        temperature: `${t}°C`,
        "RH 30%": Number(calculateVPD(t, 30).toFixed(2)),
        "RH 50%": Number(calculateVPD(t, 50).toFixed(2)),
        "RH 70%": Number(calculateVPD(t, 70).toFixed(2)),
        "RH 85%": Number(calculateVPD(t, 85).toFixed(2)),
      };
    });
  }, []);

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Plant Science & AI Lab</p>
          <span className="rounded-full bg-[#6EC6CA]/20 px-2.5 py-0.5 text-xs font-semibold text-[#055B5C]">
            Interactive Insights
          </span>
        </div>
        <h1 className="text-3xl text-sienna-deep sm:text-4xl lg:text-5xl">
          How Plants Grow & How Our AI Thinks
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Simple visual tools: test how fast soil dries out, check if your room air has enough
          humidity for happy leaves, and explore test scores from 35,723 plant photos.
        </p>
      </div>

      {/* KPI Overview Strip */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="card-surface p-4 text-center">
          <span className="text-xl">🎯</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">AI Accuracy</p>
          <p className="font-display text-2xl text-[#08979D]">
            {ML_MODEL_METRICS.overall_accuracy}%
          </p>
          <p className="text-[10px] text-muted-foreground">Spots issues right</p>
        </div>
        <div className="card-surface p-4 text-center">
          <span className="text-xl">📸</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Leaf Photos</p>
          <p className="font-display text-2xl text-[#8474A1]">
            {DATASET_SUMMARY.totalImages.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Trained from disk</p>
        </div>
        <div className="card-surface p-4 text-center">
          <span className="text-xl">💨</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Air Comfort</p>
          <p className="font-display text-2xl text-[#08979D]">{currentVpd} kPa</p>
          <p className="truncate text-[10px] font-semibold" style={{ color: vpdClass.colorHex }}>
            {vpdClass.zone}
          </p>
        </div>
        <div className="card-surface p-4 text-center">
          <span className="text-xl">☀️</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Sunlight Goal</p>
          <p className="font-display text-2xl text-[#055B5C]">{selectedPlant.ppfd_optimal} µmol</p>
          <p className="text-[10px] text-muted-foreground">{selectedPlant.lux_range}</p>
        </div>
        <div className="card-surface p-4 text-center">
          <span className="text-xl">💧</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Water Need</p>
          <p className="font-display text-2xl text-[#8474A1]">
            Every {selectedPlant.watering_interval_days}d
          </p>
          <p className="text-[10px] text-muted-foreground">{selectedPlant.name}</p>
        </div>
        <div className="card-surface p-4 text-center">
          <span className="text-xl">🪴</span>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Soil pH</p>
          <p className="font-display text-2xl text-[#055B5C]">
            {selectedPlant.soil_ph_min}–{selectedPlant.soil_ph_max}
          </p>
          <p className="text-[10px] text-muted-foreground">Healthy roots</p>
        </div>
      </div>

      {/* SECTION 1: Interactive Soil Moisture Decay & Evapotranspiration Simulation */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">💧 Soil Drying Speed</span>
            <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
              How Fast Does Your Soil Dry Out?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Slide room temperature, humidity, and pot size to see when your plant needs water.
            </p>
          </div>

          {/* Plant Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Plant Species:</label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="input-base w-48 text-sm"
            >
              {COMPLETE_PLANT_DATABASE.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Simulation Controls Bar */}
        <div className="card-surface mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Ambient Temperature</span>
              <span className="text-sienna-deep font-semibold">
                {ambientTemp}°C ({Math.round((ambientTemp * 9) / 5 + 32)}°F)
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={35}
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className="mt-2 w-full accent-[#08979D]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Relative Humidity (RH)</span>
              <span className="text-sienna-deep font-semibold">{ambientRh}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={90}
              value={ambientRh}
              onChange={(e) => setAmbientRh(Number(e.target.value))}
              className="mt-2 w-full accent-[#08979D]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Pot Volume</span>
              <span className="text-sienna-deep font-semibold">{potVolume} Liters</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={potVolume}
              onChange={(e) => setPotVolume(Number(e.target.value))}
              className="mt-2 w-full accent-[#08979D]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Timeline Span</span>
              <span className="text-sienna-deep font-semibold">{simDays} Days</span>
            </div>
            <input
              type="range"
              min={14}
              max={45}
              step={1}
              value={simDays}
              onChange={(e) => setSimDays(Number(e.target.value))}
              className="mt-2 w-full accent-[#08979D]"
            />
          </div>
        </div>

        {/* Moisture Decay Chart */}
        {/* Moisture Decay Chart */}
        <div className="card-surface mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h3 className="font-semibold text-sienna-deep">
                💧 Soil Water Level Over 30 Days
              </h3>
              <p className="text-xs text-muted-foreground">
                Watch how wet or dry your pot stays each day. When the blue line drops near the dashed purple line, water your plant!
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-[#08979D]" /> Soil Moisture (%)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-[#8474A1]" /> Daily Water Used (mL)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-[#CCABD8]" /> Water Alert Level ({selectedPlant.refill_trigger_vwc}%)
              </span>
            </div>
          </div>

          <div className="mt-6 h-80 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={moistureSimulationData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#08979D" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6EC6CA" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8474A1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#CCABD8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE7E8" opacity={0.6} />
                <XAxis
                  dataKey="day"
                  stroke="#5B7476"
                  tickLine={false}
                  tickFormatter={(v) => `Day ${v}`}
                />
                <YAxis stroke="#5B7476" tickLine={false} unit="%" domain={[0, 50]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
                    fontSize: "0.85rem",
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === "vwcPct") return [`${val}%`, "Soil Water Level"];
                    if (name === "waterLossMl") return [`${val} mL`, "Daily Water Used"];
                    return [val, name];
                  }}
                  labelFormatter={(l) => `Day ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="vwcPct"
                  name="vwcPct"
                  stroke="#08979D"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#moistureGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="waterLossMl"
                  name="waterLossMl"
                  stroke="#8474A1"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border pt-4 text-xs">
            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">🌊 Fully Soaked</span>
              <span className="font-semibold text-sienna-deep text-sm">{selectedPlant.field_capacity_vwc}% Water</span>
            </div>
            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">🥀 Too Dry Alert</span>
              <span className="font-semibold text-destructive text-sm">{selectedPlant.wilting_point_vwc}% Water</span>
            </div>
            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">💧 Watering Rhythm</span>
              <span className="font-semibold text-[#08979D] text-sm">Every {selectedPlant.watering_interval_days} Days</span>
            </div>
            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">🪴 Pot Size Tested</span>
              <span className="font-semibold text-sienna-deep text-sm">{potVolume} Liters</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Room Humidity & Air Comfort (VPD) */}
      <section className="mt-14">
        <div>
          <span className="eyebrow">💨 Leaf Breathing Room</span>
          <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
            Is Your Room Air Too Dry or Just Right?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leaves breathe through tiny pores. If room air is too dry or overly muggy, plants struggle. Keep the gauge in the green comfort zone!
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Air Comfort Gauge Card */}
          <div className="card-surface flex flex-col justify-between p-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Room Air Comfort
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-5xl text-sienna-deep">{currentVpd}</span>
                <span className="text-lg font-semibold text-muted-foreground">kPa</span>
              </div>
              <div
                className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${vpdClass.colorHex}22`,
                  color: vpdClass.colorHex,
                  border: `1px solid ${vpdClass.colorHex}44`,
                }}
              >
                {currentVpd < 0.4
                  ? "💧 Too Muggy / Mold Risk"
                  : currentVpd < 0.8
                    ? "🌱 Soft & Moist (Great for Sprouts)"
                    : currentVpd <= 1.25
                      ? "🌿 Perfect Green Sweet Spot!"
                      : currentVpd <= 1.6
                        ? "🌤️ Slightly Dry Air (Water More)"
                        : "🔥 Too Dry (Crispy Leaves Warning)"}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {currentVpd < 0.4
                  ? "Air is very humid. Leaves can't evaporate water easily. Give your plant gentle airflow."
                  : currentVpd < 0.8
                    ? "Soft, humid air. Perfect for tender baby leaves and rooting fresh cuttings."
                    : currentVpd <= 1.25
                      ? "Happy leaves! Leaves can breathe comfortably and drink up soil nutrients at peak speed."
                      : currentVpd <= 1.6
                        ? "Warm and dry. Soil will dry out a little faster than usual."
                        : "Air is pulling moisture out of leaves too quickly. Mist leaves or run a humidifier!"}
              </p>
            </div>

            {/* Target vs Actual for Selected Plant */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{selectedPlant.name} Sweet Spot:</span>
                <span className="font-bold text-[#08979D]">
                  {selectedPlant.vpd_optimal_kpa} kPa
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(5, (currentVpd / 2.0) * 100))}%`,
                    backgroundColor: vpdClass.colorHex,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>💧 Muggy (0.0)</span>
                <span className="text-[#08979D]">🌿 Perfect (1.0)</span>
                <span>🔥 Dry (2.0+)</span>
              </div>
            </div>
          </div>

          {/* VPD Curve Chart */}
          <div className="card-surface p-6 lg:col-span-2">
            <h3 className="font-semibold text-sienna-deep">
              💨 Air Comfort at Different Temperatures
            </h3>
            <p className="text-xs text-muted-foreground">
              See how humidity keeps leaves in the green zone as temperatures rise.
            </p>

            <div className="mt-6 h-64 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={vpdContourData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE7E8" opacity={0.6} />
                  <XAxis dataKey="temperature" stroke="#5B7476" tickLine={false} />
                  <YAxis stroke="#5B7476" tickLine={false} unit=" kPa" domain={[0, 3.5]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="RH 30%"
                    name="🔥 Dry Air (30% RH)"
                    stroke="#d44d62"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="RH 50%"
                    name="🌤️ Normal Room (50% RH)"
                    stroke="#8474A1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="RH 70%"
                    name="🌿 Humid Room (70% RH)"
                    stroke="#08979D"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="RH 85%"
                    name="💧 Tropical Mist (85% RH)"
                    stroke="#6EC6CA"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Plant Showdown Radar Comparison */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">🌱 Plant Showdown</span>
            <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
              Compare 3 Plants Side-by-Side
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick any 3 plants to see who drinks more water, loves more sun, or handles dry soil best.
            </p>
          </div>

          {/* Plant Selectors for Radar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={radarPlantA}
              onChange={(e) => setRadarPlantA(e.target.value)}
              className="input-base w-40 text-xs"
            >
              {COMPLETE_PLANT_DATABASE.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">vs</span>
            <select
              value={radarPlantB}
              onChange={(e) => setRadarPlantB(e.target.value)}
              className="input-base w-40 text-xs"
            >
              {COMPLETE_PLANT_DATABASE.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">vs</span>
            <select
              value={radarPlantC}
              onChange={(e) => setRadarPlantC(e.target.value)}
              className="input-base w-40 text-xs"
            >
              {COMPLETE_PLANT_DATABASE.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-surface mt-6 grid gap-6 p-6 lg:grid-cols-3">
          {/* Radar Chart */}
          <div className="h-80 min-h-[320px] w-full lg:col-span-2">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#DCE7E8" />
                <PolarAngleAxis dataKey="axis" stroke="#055B5C" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#5B7476" angle={30} domain={[0, 100]} />
                <Radar
                  name={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantA)?.name || "Plant A"
                  }
                  dataKey={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantA)?.name || "Plant A"
                  }
                  stroke="#08979D"
                  fill="#08979D"
                  fillOpacity={0.3}
                />
                <Radar
                  name={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantB)?.name || "Plant B"
                  }
                  dataKey={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantB)?.name || "Plant B"
                  }
                  stroke="#8474A1"
                  fill="#8474A1"
                  fillOpacity={0.3}
                />
                <Radar
                  name={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantC)?.name || "Plant C"
                  }
                  dataKey={
                    COMPLETE_PLANT_DATABASE.find((p) => p.slug === radarPlantC)?.name || "Plant C"
                  }
                  stroke="#6EC6CA"
                  fill="#6EC6CA"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Simple Visual Takeaways */}
          <div className="flex flex-col justify-center space-y-3 rounded-2xl border border-border bg-muted/30 p-5">
            <h3 className="font-semibold text-sienna-deep flex items-center gap-1.5 text-sm">
              <span>💡</span> Quick Plant Takeaways
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 rounded-xl bg-card p-2.5 border border-border shadow-2xs">
                <span className="text-xl">🌵</span>
                <div>
                  <p className="font-bold text-sienna-deep">Toughest Drinkers</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Snake & ZZ plants store water inside thick leaves. Water only every 2–3 weeks!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-card p-2.5 border border-border shadow-2xs">
                <span className="text-xl">🌿</span>
                <div>
                  <p className="font-bold text-sienna-deep">Jungle Sun Lovers</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Monstera & Pothos love bright rooms and a splash of water every 7 days.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-card p-2.5 border border-border shadow-2xs">
                <span className="text-xl">🌸</span>
                <div>
                  <p className="font-bold text-sienna-deep">High Humidity Fans</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Calathea & Ferns curl up if the air drops below 60% humidity. Mist them regularly!
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-2">
              <Link to="/library" className="btn-outline w-full py-1.5 text-center text-xs">
                Browse All Plant Guides →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: AI Model Scores & Accuracy */}
      <section className="mt-14">
        <div>
          <span className="eyebrow">🤖 AI Test Scores</span>
          <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
            How Accurate is Our Plant Doctor AI?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tested on {ML_MODEL_METRICS.dataset_size.toLocaleString()} real leaf photos across 45 training rounds. It identifies healthy leaves vs sick spots in under 10 milliseconds.
          </p>
        </div>

        {/* Model Metrics Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Practice Learning Curves */}
          <div className="card-surface p-6">
            <h3 className="font-semibold text-sienna-deep">📈 Learning Curve Across 45 Practice Rounds</h3>
            <p className="text-xs text-muted-foreground">
              Score climbed smoothly from 72% to {ML_MODEL_METRICS.overall_accuracy}% without mistakes.
            </p>

            <div className="mt-5 h-64 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ML_MODEL_METRICS.epoch_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE7E8" opacity={0.6} />
                  <XAxis
                    dataKey="epoch"
                    stroke="#5B7476"
                    tickLine={false}
                    tickFormatter={(e) => `Round ${e}`}
                  />
                  <YAxis stroke="#5B7476" tickLine={false} domain={[60, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="train_acc"
                    name="Practice Score"
                    stroke="#08979D"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="val_acc"
                    name="Final Exam Score"
                    stroke="#8474A1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-Class Precision & Recall */}
          <div className="card-surface p-6">
            <h3 className="font-semibold text-sienna-deep">🎯 Accuracy by Disease Spot</h3>
            <p className="text-xs text-muted-foreground">
              How reliably the AI spots each specific leaf symptom.
            </p>

            <div className="mt-5 h-64 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ML_MODEL_METRICS.classes} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE7E8" opacity={0.6} />
                  <XAxis
                    type="number"
                    domain={[0.85, 1.0]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    stroke="#5B7476"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#5B7476"
                    width={110}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                    }}
                    formatter={(v: any) => [`${(Number(v) * 100).toFixed(1)}%`]}
                  />
                  <Legend />
                  <Bar dataKey="precision" name="Spot Accuracy" fill="#08979D" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="f1" name="Overall Reliability" fill="#8474A1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Scorecard Matrix */}
        <div className="card-surface mt-6 overflow-hidden p-6">
          <h3 className="font-semibold text-sienna-deep">🧩 AI Scorecard Grid (%)</h3>
          <p className="text-xs text-muted-foreground">
            Green boxes show correct guesses (up to 99.2%). Red highlights rare tricky spots.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-4">Actual Leaf \ AI Guess</th>
                  {ML_MODEL_METRICS.classes.map((c) => (
                    <th key={c.name} className="px-3 py-2.5 text-center font-semibold">
                      {c.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ML_MODEL_METRICS.confusion_matrix.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-4 font-semibold text-sienna-deep">
                      {ML_MODEL_METRICS.classes[rIdx]?.name ?? `Class ${rIdx + 1}`}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className="px-3 py-2.5 text-center font-mono font-medium"
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(8, 151, 157, ${val / 130})`
                              : val > 1
                                ? "rgba(212, 77, 98, 0.12)"
                                : "transparent",
                            color: isDiagonal ? "#055B5C" : val > 1 ? "#d44d62" : "#5B7476",
                            fontWeight: isDiagonal ? 700 : 400,
                          }}
                        >
                          {val.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: PlantVillage 23-Class Training Dataset Breakdown */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">📸 35,723 Real Leaf Photos</span>
            <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
              Trained Photo Library (23 Categories)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Directly trained on your local dataset folder across Apples, Corn, Peppers, Potatoes, and Tomatoes.
            </p>
          </div>
          <Link to="/diagnose" className="btn-copper text-xs shadow-md">
            📹 Open Live Camera Scanner →
          </Link>
        </div>

        {/* Dataset Summary Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card-surface p-4 text-center">
            <span className="text-xl">📸</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Leaf Photos</p>
            <p className="font-display text-2xl text-[#08979D]">
              {DATASET_SUMMARY.totalImages.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Real dataset on disk</p>
          </div>
          <div className="card-surface p-4 text-center">
            <span className="text-xl">🌿</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Categories</p>
            <p className="font-display text-2xl text-[#8474A1]">
              {DATASET_SUMMARY.totalClasses}
            </p>
            <p className="text-[10px] text-muted-foreground">5 Major Crops</p>
          </div>
          <div className="card-surface p-4 text-center">
            <span className="text-xl">🏆</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Top-Match Score</p>
            <p className="font-display text-2xl text-[#055B5C]">
              {DATASET_SUMMARY.top1Accuracy}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              Top-3: {DATASET_SUMMARY.top3Accuracy}%
            </p>
          </div>
          <div className="card-surface p-4 text-center">
            <span className="text-xl">⚡</span>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Scan Speed</p>
            <p className="font-display text-2xl text-[#6EC6CA]">
              {DATASET_SUMMARY.averageInferenceLatencyMs} ms
            </p>
            <p className="text-[10px] text-muted-foreground">Instant in-browser scan</p>
          </div>
        </div>

        {/* 23 Classes Grid */}
        <div className="card-surface mt-6 p-5">
          <h3 className="font-semibold text-sienna-deep">Trained Categories & Leaf Sample Counts</h3>
          <p className="text-xs text-muted-foreground">Real photo counts trained from your disk folder:</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {PLANT_VILLAGE_CLASSES.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2 text-xs"
              >
                <img
                  src={c.sampleImageUrl}
                  alt={c.name}
                  className="size-10 shrink-0 rounded-lg object-cover border border-border"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sienna-deep">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {c.sampleCount.toLocaleString()} photos · {c.pathogenType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Quick Plant Care Cheat Sheet */}
      <section className="mt-14">
        <div>
          <span className="eyebrow">📋 Plant Care Cheat Sheet</span>
          <h2 className="mt-1 text-2xl text-sienna-deep sm:text-3xl">
            Quick Care Guide for Every Plant
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Simple numbers at a glance: sunlight hours, watering schedule, soil acidity, and pet safety.
          </p>
        </div>

        <div className="card-surface mt-6 overflow-x-auto p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3">Plant</th>
                <th className="py-3 px-3">☀️ Sunlight</th>
                <th className="py-3 px-3">💧 Water Rhythm</th>
                <th className="py-3 px-3">🪴 Soil pH</th>
                <th className="py-3 px-3">💨 Air Comfort</th>
                <th className="py-3 px-3">🐶 Pet Safe?</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPLETE_PLANT_DATABASE.map((plant) => (
                <tr key={plant.id} className="transition-colors hover:bg-muted/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{plant.emoji}</span>
                      <div>
                        <p className="font-semibold text-sienna-deep">{plant.name}</p>
                        <p className="text-[11px] italic text-muted-foreground">
                          {plant.botanical_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {plant.lux_range}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#08979D]">
                    Every {plant.watering_interval_days} Days
                  </td>
                  <td className="py-3 px-3 font-mono">
                    pH {plant.soil_ph_min} – {plant.soil_ph_max}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#8474A1]">
                    {plant.vpd_optimal_kpa} kPa
                  </td>
                  <td className="py-3 px-3">
                    {plant.toxicity.toxic_to_felines || plant.toxicity.toxic_to_canines ? (
                      <span className="rounded-full bg-[#d44d62]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#d44d62]">
                        ⚠️ Toxic to Pets
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#6EC6CA]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#055B5C]">
                        🐶 Safe for Pets
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlug(plant.slug);
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="btn-outline px-3 py-1 text-xs"
                    >
                      Simulate →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-14 rounded-2xl border border-border bg-gradient-to-r from-secondary/50 via-card to-secondary/50 p-8 text-center">
        <h3 className="text-xl font-semibold text-sienna-deep sm:text-2xl">
          Ready to Check Your Own Plants?
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Point your camera with hands-free gestures to scan any leaf, or save plants to your personal care tracker.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/diagnose" className="btn-primary px-6 py-2.5 text-sm">
            📹 Open Live Camera Scanner
          </Link>
          <Link to="/garden" className="btn-copper px-6 py-2.5 text-sm">
            🌿 Open My Garden Tracker
          </Link>
        </div>
      </div>
    </div>
  );
}
