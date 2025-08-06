-- Create user stats table for body information and diabetic details
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  diabetes_type TEXT CHECK (diabetes_type IN ('type1', 'type2', 'gestational', 'prediabetes')),
  blood_sugar_target_min INTEGER DEFAULT 80,
  blood_sugar_target_max INTEGER DEFAULT 130,
  a1c_target DECIMAL(3,1),
  allergies TEXT[],
  food_preferences TEXT[],
  dietary_restrictions TEXT[],
  favorite_foods TEXT[],
  disliked_foods TEXT[],
  medication_affects_appetite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats" 
ON public.user_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
ON public.user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create weekly diet plans table
CREATE TABLE public.weekly_diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  week_start_date DATE NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Weekly Diet Plan',
  status TEXT CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'active',
  total_weekly_calories INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_diet_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diet plans" 
ON public.weekly_diet_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diet plans" 
ON public.weekly_diet_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diet plans" 
ON public.weekly_diet_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet plans" 
ON public.weekly_diet_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create daily meal plans table
CREATE TABLE public.daily_meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_plan_id UUID REFERENCES public.weekly_diet_plans(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL, -- 0 = Sunday
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')) NOT NULL,
  food_item TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories INTEGER,
  proteins DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fats DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view meal plans for their diet plans" 
ON public.daily_meal_plans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_diet_plans 
    WHERE id = daily_meal_plans.weekly_plan_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create meal plans for their diet plans" 
ON public.daily_meal_plans 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.weekly_diet_plans 
    WHERE id = daily_meal_plans.weekly_plan_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update meal plans for their diet plans" 
ON public.daily_meal_plans 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_diet_plans 
    WHERE id = daily_meal_plans.weekly_plan_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete meal plans for their diet plans" 
ON public.daily_meal_plans 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_diet_plans 
    WHERE id = daily_meal_plans.weekly_plan_id 
    AND user_id = auth.uid()
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_diet_plans_updated_at
BEFORE UPDATE ON public.weekly_diet_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_meal_plans_updated_at
BEFORE UPDATE ON public.daily_meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX idx_weekly_diet_plans_user_id ON public.weekly_diet_plans(user_id);
CREATE INDEX idx_weekly_diet_plans_week_start ON public.weekly_diet_plans(week_start_date);
CREATE INDEX idx_daily_meal_plans_weekly_plan_id ON public.daily_meal_plans(weekly_plan_id);
CREATE INDEX idx_daily_meal_plans_day_meal ON public.daily_meal_plans(day_of_week, meal_type);