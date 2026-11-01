-- =============================================================================
-- PlantCare AI - Complete PostgreSQL Database Schema for Supabase
-- Fully Normalized Schema with RLS, Constraints, Triggers & Storage Policies
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Table: profiles (Extended user metadata tied to Supabase Auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  provider text DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-provision profile row whenever a new user signs up (via Email, Google, or Apple)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. Table: plant_profiles (Botanical library catalog)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.plant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  botanical_name text,
  category text NOT NULL DEFAULT 'houseplant',
  emoji text NOT NULL DEFAULT '🌿',
  description text NOT NULL,
  light text NOT NULL,
  water text NOT NULL,
  watering_interval_days integer NOT NULL DEFAULT 7,
  humidity text,
  temperature text,
  difficulty text NOT NULL DEFAULT 'easy',
  care_tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. Table: garden_plants (User-owned garden inventory)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.garden_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.plant_profiles(id) ON DELETE SET NULL,
  nickname text NOT NULL,
  species text NOT NULL,
  image_url text,
  acquired_at date,
  watering_interval_days integer NOT NULL DEFAULT 7,
  last_watered_at timestamptz DEFAULT now(),
  last_fertilized_at timestamptz,
  fertilizing_interval_days integer DEFAULT 30,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garden_plants_user_id ON public.garden_plants(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_plants_profile_id ON public.garden_plants(profile_id);

-- =============================================================================
-- 4. Table: care_events (Watering & fertilizing event history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.care_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.garden_plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'watering',
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_events_plant_id ON public.care_events(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_events_user_id ON public.care_events(user_id);

-- =============================================================================
-- 5. Table: diagnoses (AI disease & health diagnosis logs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid REFERENCES public.garden_plants(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  plant_name text NOT NULL,
  scientific_name text,
  health_status text NOT NULL,
  confidence integer NOT NULL,
  summary text NOT NULL,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  watering_interval_days integer,
  care_tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON public.diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_plant_id ON public.diagnoses(plant_id);

-- =============================================================================
-- 6. Row Level Security (RLS) & Permissions
-- =============================================================================

-- Profiles: users can select and update only their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Select own profile" ON public.profiles;
CREATE POLICY "Select own profile"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Plant Profiles: publicly readable by all users (anonymous and authenticated)
ALTER TABLE public.plant_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.plant_profiles TO anon, authenticated;
GRANT ALL ON public.plant_profiles TO service_role;

DROP POLICY IF EXISTS "Plant library publicly readable" ON public.plant_profiles;
CREATE POLICY "Plant library publicly readable"
  ON public.plant_profiles
  FOR SELECT
  USING (true);

-- Garden Plants: each authenticated user has full CRUD only on their own plants
ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garden_plants TO authenticated;
GRANT ALL ON public.garden_plants TO service_role;

DROP POLICY IF EXISTS "Select own plants" ON public.garden_plants;
CREATE POLICY "Select own plants"
  ON public.garden_plants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Insert own plants" ON public.garden_plants;
CREATE POLICY "Insert own plants"
  ON public.garden_plants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Update own plants" ON public.garden_plants;
CREATE POLICY "Update own plants"
  ON public.garden_plants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Delete own plants" ON public.garden_plants;
CREATE POLICY "Delete own plants"
  ON public.garden_plants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Care Events: users manage their own watering/fertilizing logs
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.care_events TO authenticated;
GRANT ALL ON public.care_events TO service_role;

DROP POLICY IF EXISTS "Select own care events" ON public.care_events;
CREATE POLICY "Select own care events"
  ON public.care_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Insert own care events" ON public.care_events;
CREATE POLICY "Insert own care events"
  ON public.care_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Delete own care events" ON public.care_events;
CREATE POLICY "Delete own care events"
  ON public.care_events
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Diagnoses: users can query and save their own plant diagnoses
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.diagnoses TO authenticated;
GRANT ALL ON public.diagnoses TO service_role;

DROP POLICY IF EXISTS "Select own diagnoses" ON public.diagnoses;
CREATE POLICY "Select own diagnoses"
  ON public.diagnoses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Insert own diagnoses" ON public.diagnoses;
CREATE POLICY "Insert own diagnoses"
  ON public.diagnoses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Delete own diagnoses" ON public.diagnoses;
CREATE POLICY "Delete own diagnoses"
  ON public.diagnoses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- 7. Storage Bucket Policy (for plant photo uploads)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload plant photos" ON storage.objects;
CREATE POLICY "Upload plant photos"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'plant-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Read plant photos" ON storage.objects;
CREATE POLICY "Read plant photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'plant-photos');

DROP POLICY IF EXISTS "Delete own plant photos" ON storage.objects;
CREATE POLICY "Delete own plant photos"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'plant-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 8. Seed Initial Botanical Library (12 popular houseplant profiles)
-- =============================================================================
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
('jade-plant', 'Jade Plant', 'Crassula ovata', 'succulent', '💰', 'A miniature tree with plump oval leaves and a thick trunk. Believed to bring prosperity — and it lives for decades.', 'Bright light with some direct sun.', 'Soak and dry method; water far less in winter.', 16, 'Low humidity', '13–27°C', 'easy', '["Prune lightly to build a tree shape","Leaves wrinkling is the thirst signal","Keep above 10°C in winter"]'::jsonb, 12)
ON CONFLICT (slug) DO NOTHING;
