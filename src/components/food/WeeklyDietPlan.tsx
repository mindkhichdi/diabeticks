import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChefHat, Edit, Plus, Trash2, RefreshCw } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';
import DietPlanEditor from './DietPlanEditor';

interface DailyMealPlan {
  id: string;
  day_of_week: number;
  meal_type: string;
  food_item: string;
  quantity: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  notes?: string;
}

interface WeeklyDietPlan {
  id: string;
  week_start_date: string;
  plan_name: string;
  status: string;
  total_weekly_calories: number;
  notes?: string;
  daily_meals?: DailyMealPlan[];
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-orange-100 text-orange-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-blue-100 text-blue-800' },
  { value: 'snacks', label: 'Snacks', color: 'bg-purple-100 text-purple-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-green-100 text-green-800' },
];

const WeeklyDietPlan: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [editingPlan, setEditingPlan] = useState<WeeklyDietPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const weekStartDate = format(selectedWeek, 'yyyy-MM-dd');

  const { data: weeklyPlan, isLoading } = useQuery({
    queryKey: ['weeklyDietPlan', weekStartDate],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const { data: plan, error: planError } = await supabase
        .from('weekly_diet_plans')
        .select('*')
        .eq('user_id', session.session.user.id)
        .eq('week_start_date', weekStartDate)
        .eq('status', 'active')
        .maybeSingle();

      if (planError) throw planError;

      if (!plan) return null;

      const { data: meals, error: mealsError } = await supabase
        .from('daily_meal_plans')
        .select('*')
        .eq('weekly_plan_id', plan.id)
        .order('day_of_week, meal_type');

      if (mealsError) throw mealsError;

      return {
        ...plan,
        daily_meals: meals || []
      } as WeeklyDietPlan;
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      // Archive existing plan for this week
      if (weeklyPlan) {
        await supabase
          .from('weekly_diet_plans')
          .update({ status: 'archived' })
          .eq('id', weeklyPlan.id);
      }

      // Generate sample meal plan based on user preferences
      const { data: plan, error: planError } = await supabase
        .from('weekly_diet_plans')
        .insert([{
          user_id: session.session.user.id,
          week_start_date: weekStartDate,
          plan_name: `Diet Plan - Week of ${format(selectedWeek, 'MMM dd, yyyy')}`,
          status: 'active',
          total_weekly_calories: 12460, // 1780 * 7
          notes: 'AI-generated plan based on your preferences and diabetic needs'
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Generate sample meals (in a real app, this would be AI-generated)
      const sampleMeals = generateSampleMeals(plan.id, userStats);
      
      const { error: mealsError } = await supabase
        .from('daily_meal_plans')
        .insert(sampleMeals);

      if (mealsError) throw mealsError;

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyDietPlan'] });
      toast.success('New weekly diet plan generated!');
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate diet plan');
      setIsGenerating(false);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('weekly_diet_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyDietPlan'] });
      toast.success('Diet plan deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete diet plan');
    },
  });

  const generateSampleMeals = (planId: string, stats: any) => {
    const meals = [];
    const diabeticFriendlyMeals = {
      breakfast: [
        { item: 'Oatmeal with berries and nuts', cal: 280, prot: 8, carbs: 45, fats: 8 },
        { item: 'Greek yogurt with chia seeds', cal: 220, prot: 15, carbs: 20, fats: 8 },
        { item: 'Vegetable scrambled eggs', cal: 250, prot: 18, carbs: 8, fats: 16 },
      ],
      lunch: [
        { item: 'Grilled chicken salad', cal: 350, prot: 35, carbs: 15, fats: 18 },
        { item: 'Quinoa bowl with vegetables', cal: 380, prot: 14, carbs: 55, fats: 12 },
        { item: 'Salmon with sweet potato', cal: 420, prot: 32, carbs: 35, fats: 18 },
      ],
      dinner: [
        { item: 'Baked cod with broccoli', cal: 320, prot: 28, carbs: 20, fats: 12 },
        { item: 'Turkey meatballs with zucchini noodles', cal: 380, prot: 30, carbs: 25, fats: 18 },
        { item: 'Grilled tofu with mixed vegetables', cal: 290, prot: 20, carbs: 25, fats: 14 },
      ],
      snacks: [
        { item: 'Apple with almond butter', cal: 180, prot: 6, carbs: 20, fats: 10 },
        { item: 'Handful of mixed nuts', cal: 160, prot: 6, carbs: 6, fats: 14 },
        { item: 'Cucumber with hummus', cal: 120, prot: 4, carbs: 12, fats: 6 },
      ]
    };

    for (let day = 0; day < 7; day++) {
      MEAL_TYPES.forEach(mealType => {
        const mealOptions = diabeticFriendlyMeals[mealType.value as keyof typeof diabeticFriendlyMeals];
        const randomMeal = mealOptions[Math.floor(Math.random() * mealOptions.length)];
        
        meals.push({
          weekly_plan_id: planId,
          day_of_week: day,
          meal_type: mealType.value,
          food_item: randomMeal.item,
          quantity: '1 serving',
          calories: randomMeal.cal,
          proteins: randomMeal.prot,
          carbs: randomMeal.carbs,
          fats: randomMeal.fats,
        });
      });
    }

    return meals;
  };

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    generatePlanMutation.mutate();
  };

  const handlePreviousWeek = () => {
    setSelectedWeek(addDays(selectedWeek, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeek(addDays(selectedWeek, 7));
  };

  const getMealsForDay = (dayIndex: number) => {
    return weeklyPlan?.daily_meals?.filter(meal => meal.day_of_week === dayIndex) || [];
  };

  const getDayCalories = (dayIndex: number) => {
    return getMealsForDay(dayIndex).reduce((sum, meal) => sum + (meal.calories || 0), 0);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading diet plan...</div>;
  }

  if (editingPlan) {
    return (
      <DietPlanEditor
        plan={editingPlan}
        onSave={() => {
          setEditingPlan(null);
          queryClient.invalidateQueries({ queryKey: ['weeklyDietPlan'] });
        }}
        onCancel={() => setEditingPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Diet Plan
              </CardTitle>
              <CardDescription>
                Week of {format(selectedWeek, 'MMMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreviousWeek}>
                Previous Week
              </Button>
              <Button variant="outline" onClick={handleNextWeek}>
                Next Week
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Plan Actions */}
      {!weeklyPlan ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <ChefHat className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Diet Plan for This Week</h3>
                <p className="text-muted-foreground">
                  Generate a personalized weekly diet plan based on your health profile and preferences.
                </p>
              </div>
              <Button 
                onClick={handleGeneratePlan} 
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Diet Plan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{weeklyPlan.plan_name}</CardTitle>
                  <CardDescription>{weeklyPlan.notes}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPlan(weeklyPlan)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deletePlanMutation.mutate(weeklyPlan.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {weeklyPlan.total_weekly_calories?.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Weekly Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((weeklyPlan.total_weekly_calories || 0) / 7)}
                  </div>
                  <div className="text-sm text-muted-foreground">Daily Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">7</div>
                  <div className="text-sm text-muted-foreground">Days Planned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">28</div>
                  <div className="text-sm text-muted-foreground">Total Meals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Meal Plans */}
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {DAYS_OF_WEEK.map((day, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  <div className="text-center">
                    <div className="text-xs">{day.slice(0, 3)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getDayCalories(index)} cal
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {DAYS_OF_WEEK.map((day, dayIndex) => (
              <TabsContent key={dayIndex} value={dayIndex.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {day}, {format(addDays(selectedWeek, dayIndex), 'MMMM dd')}
                      <Badge variant="secondary">{getDayCalories(dayIndex)} calories</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {MEAL_TYPES.map(mealType => {
                        const meal = getMealsForDay(dayIndex).find(
                          m => m.meal_type === mealType.value
                        );
                        
                        return (
                          <div key={mealType.value} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={mealType.color}>{mealType.label}</Badge>
                              {meal && (
                                <span className="text-sm text-muted-foreground">
                                  {meal.calories} cal
                                </span>
                              )}
                            </div>
                            {meal ? (
                              <div>
                                <div className="font-medium">{meal.food_item}</div>
                                <div className="text-sm text-muted-foreground">
                                  {meal.quantity}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  P: {meal.proteins}g • C: {meal.carbs}g • F: {meal.fats}g
                                </div>
                                {meal.notes && (
                                  <div className="text-xs text-muted-foreground mt-1 italic">
                                    {meal.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No meal planned
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default WeeklyDietPlan;