import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, Utensils, Apple, Pizza, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyGoal from './food/DailyGoal';
import AddFoodForm from './food/AddFoodForm';
import MealSection from './food/MealSection';
import UserStatsForm from './food/UserStatsForm';
import WeeklyDietPlan from './food/WeeklyDietPlan';
import { toast } from 'sonner';
import MacronutrientProgress from './food/MacronutrientProgress';

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

  const mealTypes = [
    { 
      value: 'breakfast', 
      label: 'Breakfast', 
      icon: Coffee, 
      color: 'bg-chart-1/20',
      textColor: 'text-foreground',
      borderColor: 'border-chart-1/30'
    },
    { 
      value: 'lunch', 
      label: 'Lunch', 
      icon: Utensils, 
      color: 'bg-chart-2/20',
      textColor: 'text-foreground',
      borderColor: 'border-chart-2/30'
    },
    { 
      value: 'snacks', 
      label: 'Snacks', 
      icon: Apple, 
      color: 'bg-chart-5/20',
      textColor: 'text-foreground',
      borderColor: 'border-chart-5/30'
    },
    { 
      value: 'dinner', 
      label: 'Dinner', 
      icon: Pizza, 
      color: 'bg-chart-3/20',
      textColor: 'text-foreground',
      borderColor: 'border-chart-3/30'
    },
  ];

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
      toast.success('Food log added successfully');
    },
    onError: (error) => {
      console.error('Error adding food log:', error);
      toast.error('Failed to add food log');
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
      toast.success('Food log deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting food log:', error);
      toast.error('Failed to delete food log');
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
      toast.success('Health profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user stats:', error);
      toast.error('Failed to update health profile');
    },
  });

  const handleGoalsUpdate = (newGoals: { calories: number; proteins: number; carbs: number; fats: number }) => {
    setTargetCalories(newGoals.calories);
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  return (
    <Tabs defaultValue="tracker" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tracker" className="flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          Food Tracker
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Health Profile
        </TabsTrigger>
        <TabsTrigger value="diet-plan" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Diet Plan
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tracker" className="space-y-6 mt-6">
        <DailyGoal
          targetCalories={targetCalories}
          totalCalories={totalCalories}
          onTargetChange={setTargetCalories}
          onGoalsUpdate={handleGoalsUpdate}
          currentGoals={{
            calories: targetCalories,
            proteins: userProfile?.daily_protein_goal || 150,
            carbs: userProfile?.daily_carbs_goal || 200,
            fats: userProfile?.daily_fats_goal || 70,
          }}
        />

        <MacronutrientProgress
          current={macroTotals}
          goals={{
            proteins: userProfile?.daily_protein_goal || 150,
            carbs: userProfile?.daily_carbs_goal || 200,
            fats: userProfile?.daily_fats_goal || 70,
          }}
        />

        <AddFoodForm
          onSubmit={addFoodLogMutation.mutate}
          mealTypes={mealTypes}
        />

        <div className="whoop-card p-4">
          <div className="grid gap-6">
            {mealTypes.map((meal) => {
              const mealLogs = foodLogs?.filter(log => log.meal_type === meal.value);
              const totalMealCalories = mealLogs?.reduce((sum, log) => sum + (parseInt(log.calories || '0', 10)), 0) || 0;

              return (
                <MealSection
                  key={meal.value}
                  meal={meal}
                  logs={mealLogs || []}
                  totalCalories={totalMealCalories}
                  onDelete={deleteFoodLogMutation.mutate}
                />
              );
            })}
          </div>
        </div>
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
