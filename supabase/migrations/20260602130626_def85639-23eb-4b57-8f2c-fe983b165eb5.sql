-- 1. medicine_logs: add UPDATE and DELETE policies
CREATE POLICY "Users can update own medicine logs"
ON public.medicine_logs FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medicine logs"
ON public.medicine_logs FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 2. profiles: add INSERT policy
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. storage policies for the 'prescriptions' bucket (UPDATE and DELETE)
CREATE POLICY "Users can update their own prescription files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Revoke EXECUTE on SECURITY DEFINER trigger-only functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 5. Revoke anon SELECT on all user-scoped tables (all RLS policies require auth.uid())
REVOKE SELECT ON public.blood_sugar_readings FROM anon;
REVOKE SELECT ON public.daily_meal_plans FROM anon;
REVOKE SELECT ON public.fitness_logs FROM anon;
REVOKE SELECT ON public.food_logs FROM anon;
REVOKE SELECT ON public.medicine_logs FROM anon;
REVOKE SELECT ON public.medicine_preferences FROM anon;
REVOKE SELECT ON public.prescriptions FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.user_stats FROM anon;
REVOKE SELECT ON public.weekly_diet_plans FROM anon;
