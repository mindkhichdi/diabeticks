import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, Utensils, Apple, Soup } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddFoodForm, { MealType } from './food/AddFoodForm';
import FoodSummary from './food/FoodSummary';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import MealSection from './food/MealSection';
import UserStatsForm from './food/UserStatsForm';
import WeeklyDietPlan from './food/WeeklyDietPlan';
import { toast } from 'sonner';

interface FoodLog {
  id: string;
  meal_type: string;
  food_item: string;
  quantity: string;
  date: string;
  calories?: string;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

interface FoodLogForm {
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

const FoodTracker = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [targetCalories, setTargetCalories] = useState(1780);

  const mealTypes: MealType[] = [
    { value: 'breakfast', label: 'Breakfast', icon: Coffee },
    { value: 'lunch', label: 'Lunch', icon: Utensils },
    { value: 'snacks', label: 'Snacks', icon: Apple },
    { value: 'dinner', label: 'Dinner', icon: Soup },
  ];
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const { data: foodLogs, isLoading } = useQuery({
    queryKey: ['foodLogs', today],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('date', today)
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching food logs:', error);
        throw error;
      }

      return data as FoodLog[];
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (error) throw error;
      
      // Update target calories from profile
      if (data) {
        setTargetCalories(data.daily_calories_goal || 1780);
      }
      
      return data;
    },
  });

  const addFoodLogMutation = useMutation({
    mutationFn: async (values: FoodLogForm) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { error } = await supabase.from('food_logs').insert([
        {
          ...values,
          calories: values.calories?.toString(),
          date: today,
          user_id: session.session.user.id,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      setAddingTo(null);
      toast.success('Food saved');
    },
    onError: (error) => {
      console.error('Error adding food log:', error);
      toast.error("Couldn't save that food. Try again.");
    },
  });

  const deleteFoodLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      toast.success('Food deleted');
    },
    onError: (error) => {
      console.error('Error deleting food log:', error);
      toast.error("Couldn't delete that food. Try again.");
    },
  });

  const mealCalories = mealTypes.map(type => ({
    ...type,
    calories: foodLogs?.filter(log => log.meal_type === type.value)
      .reduce((sum, log) => sum + (parseInt(log.calories || '0', 10)), 0) || 0
  }));

  const totalCalories = mealCalories.reduce((sum, meal) => sum + meal.calories, 0);

  const macroTotals = foodLogs?.reduce(
    (acc, log) => ({
      proteins: acc.proteins + (log.proteins || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fats: acc.fats + (log.fats || 0),
    }),
    { proteins: 0, carbs: 0, fats: 0 }
  ) || { proteins: 0, carbs: 0, fats: 0 };

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const updateUserStatsMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { data: existing } = await supabase
        .from('user_stats')
        .select('id')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_stats')
          .update({
            ...values,
            user_id: session.session.user.id,
          })
          .eq('user_id', session.session.user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_stats')
          .insert([{
            ...values,
            user_id: session.session.user.id,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['glucose-targets'] });
      toast.success('Health profile saved');
    },
    onError: (error) => {
      console.error('Error updating user stats:', error);
      toast.error("Couldn't save your health profile. Try again.");
    },
  });

  const handleGoalsUpdate = (newGoals: { calories: number; proteins: number; carbs: number; fats: number }) => {
    setTargetCalories(newGoals.calories);
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const goals = {
    calories: targetCalories,
    proteins: userProfile?.daily_protein_goal || 150,
    carbs: userProfile?.daily_carbs_goal || 200,
    fats: userProfile?.daily_fats_goal || 70,
  };

  return (
    <Tabs defaultValue="tracker" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tracker">Today</TabsTrigger>
        <TabsTrigger value="profile">Health profile</TabsTrigger>
        <TabsTrigger value="diet-plan">Meal plan</TabsTrigger>
      </TabsList>

      <TabsContent value="tracker" className="space-y-4 mt-6">
        <FoodSummary
          totals={{ calories: totalCalories, ...macroTotals }}
          goals={goals}
          onGoalsUpdate={handleGoalsUpdate}
        />

        {isLoading ? (
          <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        ) : (
          mealTypes.map((meal) => {
            const mealLogs = foodLogs?.filter((log) => log.meal_type === meal.value) || [];
            const totalMealCalories = mealLogs.reduce((sum, log) => sum + parseInt(log.calories || '0', 10), 0);
            return (
              <MealSection
                key={meal.value}
                meal={meal}
                logs={mealLogs}
                totalCalories={totalMealCalories}
                onAdd={() => setAddingTo(meal.value)}
                onDelete={deleteFoodLogMutation.mutate}
              />
            );
          })
        )}

        <Drawer open={!!addingTo} onOpenChange={(open) => !open && setAddingTo(null)}>
          <DrawerContent className="max-w-lg mx-auto max-h-[92vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display text-2xl">Add food</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              {addingTo && (
                <AddFoodForm
                  key={addingTo}
                  onSubmit={addFoodLogMutation.mutate}
                  mealTypes={mealTypes}
                  defaultMealType={addingTo}
                  isSaving={addFoodLogMutation.isPending}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </TabsContent>

      <TabsContent value="profile" className="mt-6">
        <UserStatsForm
          onSubmit={updateUserStatsMutation.mutate}
          initialData={userStats ? {
            ...userStats,
            gender: userStats.gender as 'male' | 'female' | 'other' | undefined,
            activity_level: userStats.activity_level as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | undefined,
            diabetes_type: userStats.diabetes_type as 'type1' | 'type2' | 'gestational' | 'prediabetes' | undefined,
          } : undefined}
          isLoading={updateUserStatsMutation.isPending}
        />
      </TabsContent>

      <TabsContent value="diet-plan" className="mt-6">
        <WeeklyDietPlan />
      </TabsContent>
    </Tabs>
  );
};

export default FoodTracker;
