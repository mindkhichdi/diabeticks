-- User-defined medicines (name, dose, daily times). Dose check-offs keep using
-- medicine_logs, with medicine_time = 'med:<medication id>:<HH:mm>'.
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  times TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
ON public.medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications"
ON public.medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications"
ON public.medications FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications"
ON public.medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE SELECT ON public.medications FROM anon;
