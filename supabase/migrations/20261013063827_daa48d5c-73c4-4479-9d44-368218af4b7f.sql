CREATE TABLE public.cgm_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  value_mgdl integer NOT NULL,
  source text NOT NULL DEFAULT 'csv',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recorded_at, source)
);
GRANT SELECT, INSERT, DELETE ON public.cgm_readings TO authenticated;
GRANT ALL ON public.cgm_readings TO service_role;
ALTER TABLE public.cgm_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own cgm" ON public.cgm_readings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cgm" ON public.cgm_readings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own cgm" ON public.cgm_readings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX cgm_readings_user_time ON public.cgm_readings (user_id, recorded_at DESC);

CREATE TABLE public.health_sync_tokens (
  user_id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_sync_tokens TO authenticated;
GRANT ALL ON public.health_sync_tokens TO service_role;
ALTER TABLE public.health_sync_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sync token" ON public.health_sync_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);