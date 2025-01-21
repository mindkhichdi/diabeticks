import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coffee, Utensils, Apple, Pizza } from 'lucide-react';
import { format } from 'date-fns';
import DailyGoal from './food/DailyGoal';
import AddFoodForm from './food/AddFoodForm';
import MealSection from './food/MealSection';
import { toast } from 'sonner';

interface FoodLog {
  id: string;
  meal_type: string;
  food_item: string;
  quantity: string;
  date: string;
  calories?: string;
}

interface FoodLogForm {
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: number;
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
      color: 'bg-gradient-to-r from-orange-400 to-amber-300',
      textColor: 'text-orange-900',
      borderColor: 'border-orange-200'
    },
    { 
      value: 'lunch', 
      label: 'Lunch', 
      icon: Utensils, 
      color: 'bg-gradient-to-r from-sky-400 to-blue-300',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-200'
    },
    { 
      value: 'snacks', 
      label: 'Snacks', 
      icon: Apple, 
      color: 'bg-gradient-to-r from-violet-400 to-purple-300',
      textColor: 'text-purple-900',
      borderColor: 'border-purple-200'
    },
    { 
      value: 'dinner', 
      label: 'Dinner', 
      icon: Pizza, 
      color: 'bg-gradient-to-r from-emerald-400 to-green-300',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-200'
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

  return (
    <div className="space-y-6">
      <DailyGoal
        targetCalories={targetCalories}
        totalCalories={totalCalories}
        onTargetChange={setTargetCalories}
      />

      <AddFoodForm
        onSubmit={addFoodLogMutation.mutate}
        mealTypes={mealTypes}
      />

      <div className="rounded-lg bg-white p-4 shadow-sm border">
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
    </div>
  );
};

export default FoodTracker;