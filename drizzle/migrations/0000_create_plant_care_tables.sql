-- ============ Plant library (public, seeded) ============
CREATE TABLE public.plant_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  botanical_name text,
  category text not null default 'houseplant',
  emoji text not null default '🌿',
  description text not null,
  light text not null,
  water text not null,
  watering_interval_days integer not null default 7,
  humidity text,
  temperature text,
  difficulty text not null default 'easy',
  care_tips jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.plant_profiles TO anon, authenticated;
GRANT ALL ON public.plant_profiles TO service_role;
ALTER TABLE public.plant_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plant library publicly readable" ON public.plant_profiles FOR SELECT USING (true);

-- ============ Garden plants (user-owned) ============
CREATE TABLE public.garden_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profile_id uuid references public.plant_profiles(id) on delete set null,
  nickname text not null,
  species text not null,
  image_url text,
  acquired_at date,
  watering_interval_days integer not null default 7,
  last_watered_at timestamptz default now(),
  last_fertilized_at timestamptz,
  fertilizing_interval_days integer default 30,
  notes text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garden_plants TO authenticated;
GRANT ALL ON public.garden_plants TO service_role;
ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own plants" ON public.garden_plants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own plants" ON public.garden_plants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own plants" ON public.garden_plants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own plants" ON public.garden_plants FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ Care history (watering / fertilizing) ============
CREATE TABLE public.care_events (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.garden_plants(id) on delete cascade,
  user_id uuid not null,
  kind text not null default 'watering',
  note text,
  occurred_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.care_events TO authenticated;
GRANT ALL ON public.care_events TO service_role;
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own care events" ON public.care_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own care events" ON public.care_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own care events" ON public.care_events FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ AI diagnoses ============
CREATE TABLE public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plant_id uuid references public.garden_plants(id) on delete set null,
  image_url text not null,
  plant_name text not null,
  scientific_name text,
  health_status text not null,
  confidence integer not null,
  summary text not null,
  issues jsonb not null default '[]'::jsonb,
  watering_interval_days integer,
  care_tips jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.diagnoses TO authenticated;
GRANT ALL ON public.diagnoses TO service_role;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own diagnoses" ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own diagnoses" ON public.diagnoses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ Storage access ============
CREATE POLICY "Upload plant photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plant-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read plant photos" ON storage.objects FOR SELECT USING (bucket_id = 'plant-photos');
CREATE POLICY "Delete own plant photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'plant-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============ Seed the plant library ============
INSERT INTO public.plant_profiles (slug, name, botanical_name, category, emoji, description, light, water, watering_interval_days, humidity, temperature, difficulty, care_tips, sort_order) VALUES
('monstera', 'Monstera', 'Monstera deliciosa', 'tropical', '🌱', 'The Swiss cheese plant — dramatic split leaves that grow bigger and more fenestrated as it matures. A statement plant for bright rooms.', 'Bright, indirect light. Avoid direct afternoon sun.', 'Water when the top 3–5 cm of soil is dry. Loves a good soak.', 7, 'Moderate to high (50%+)', '18–27°C', 'easy', '["Wipe leaves monthly so they can breathe and photosynthesize","Rotate the pot weekly for even growth","Support climbing stems with a moss pole for larger leaves"]'::jsonb, 1),
('snake-plant', 'Snake Plant', 'Dracaena trifasciata', 'succulent', '🪴', 'Nearly indestructible upright blades that tolerate neglect, low light and dry air. Perfect for beginners and dim corners.', 'Tolerates low light; thrives in medium to bright indirect.', 'Let soil dry out completely between waterings. Overwatering is its only enemy.', 21, 'Low; average home humidity is fine', '15–29°C', 'easy', '["Use a fast-draining cactus mix","Skip watering entirely in winter","Repot only when roots crack the pot"]'::jsonb, 2),
('golden-pothos', 'Golden Pothos', 'Epipremnum aureum', 'vine', '🍃', 'A forgiving trailing vine with heart-shaped leaves splashed in gold. Grows fast, roots in water, and shrugs off missed waterings.', 'Low to bright indirect; variegation needs more light.', 'Water when the top few centimetres feel dry.', 7, 'Average home humidity', '17–29°C', 'easy', '["Pinch leggy vines to encourage bushiness","Propagate cuttings in water within weeks","Trim near a node for fuller regrowth"]'::jsonb, 3),
('fiddle-leaf-fig', 'Fiddle Leaf Fig', 'Ficus lyrata', 'tree', '🌳', 'Sculptural violin-shaped leaves on a tall trunk. Loves consistency — same light, same water, same spot.', 'Very bright indirect; some gentle morning sun.', 'Water when the top 5 cm of soil is dry; keep evenly moist, never soggy.', 8, 'Moderate (40–60%)', '18–29°C', 'moderate', '["Do not move it often — it hates change","Dust the huge leaves monthly","Use room-temperature water to avoid leaf spots"]'::jsonb, 4),
('peace-lily', 'Peace Lily', 'Spathiphyllum wallisii', 'flowering', '🌸', 'Glossy dark leaves with elegant white spathes. Dramatically droops when thirsty — then perks right back up.', 'Low to medium indirect light.', 'Keep lightly moist; water as soon as leaves start to sag.', 5, 'High humidity appreciated', '18–27°C', 'easy', '["Mist leaves or use a pebble tray","Remove spent blooms at the base","Sensitive to chlorine — use filtered water if tips brown"]'::jsonb, 5),
('zz-plant', 'ZZ Plant', 'Zamioculcas zamiifolia', 'succulent', '🌿', 'Waxy, architectural foliage with water-storing rhizomes. Thrives on neglect and looks polished in any corner.', 'Low to bright indirect; no direct sun needed.', 'Water only when soil is fully dry, roughly every 2–3 weeks.', 18, 'Low; very tolerant of dry air', '16–29°C', 'easy', '["Rhizomes store water — when in doubt, wait","Yellowing mushy stems mean overwatering","Wipe leaves to keep the natural shine"]'::jsonb, 6),
('aloe-vera', 'Aloe Vera', 'Aloe barbadensis miller', 'succulent', '🌵', 'A healing succulent with thick gel-filled leaves. Sunny windowsill favourite that doubles as a first-aid kit.', 'Bright, direct light; a south or west window is ideal.', 'Deep soak, then let dry completely. Water sparingly in winter.', 14, 'Low; dry air is fine', '13–32°C', 'easy', '["Use terracotta pots to wick away moisture","Harvest outer leaves for gel","Keep rosette free of standing water"]'::jsonb, 7),
('spider-plant', 'Spider Plant', 'Chlorophytum comosum', 'trailing', '🕷️', 'Arching striped leaves that send out baby plantlets — easy to pot up and share. Great in hanging baskets.', 'Bright, indirect light; tolerates some direct morning sun.', 'Water when the top soil dries; keeps thick water-storing roots.', 7, 'Average humidity', '15–27°C', 'easy', '["Pot up the little spiderettes easily","Brown tips often mean fluoride or salt build-up","Flush the soil with clean water every few months"]'::jsonb, 8),
('rubber-plant', 'Rubber Plant', 'Ficus elastica', 'tree', '🪴', 'Bold glossy leaves from deep green to near-black burgundy. Fast growing and easy to shape with pruning.', 'Bright indirect; tolerates a little direct sun.', 'Water when the top 3 cm of soil dries out.', 9, 'Moderate', '18–29°C', 'easy', '["Wipe leaves to keep them glossy","Prune the top to control height and thicken growth","Milky sap is irritating — wash hands after pruning"]'::jsonb, 9),
('heartleaf-philodendron', 'Heartleaf Philodendron', 'Philodendron hederaceum', 'vine', '💚', 'A classic trailing philodendron with soft heart-shaped leaves. One of the most adaptable houseplants around.', 'Medium to low indirect light.', 'Water when the top inch of soil is dry.', 7, 'Average to high humidity', '16–27°C', 'easy', '["Train up a totem or let it trail freely","Yellow lower leaves are normal — remove them","Propagates reliably from stem cuttings"]'::jsonb, 10),
('calathea', 'Calathea', 'Calathea orbifolia', 'foliage', '🌙', 'Patterned prayer-plant leaves that fold up at night. A humidity lover with painterly leaf art.', 'Low to medium indirect; no direct sun.', 'Keep soil consistently moist with filtered or distilled water.', 4, 'High humidity (60%+)', '18–24°C', 'challenging', '["Use distilled water — tap minerals cause spots","Group with other plants or use a humidifier","Crispy edges mean the air is too dry"]'::jsonb, 11),
('jade-plant', 'Jade Plant', 'Crassula ovata', 'succulent', '💰', 'A miniature tree with plump oval leaves and a thick trunk. Believed to bring prosperity — and it lives for decades.', 'Bright light with some direct sun.', 'Soak and dry method; water far less in winter.', 16, 'Low humidity', '13–27°C', 'easy', '["Prune lightly to build a tree shape","Leaves wrinkling is the thirst signal","Keep above 10°C in winter"]'::jsonb, 12);