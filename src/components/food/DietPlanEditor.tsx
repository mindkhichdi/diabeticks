import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

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

interface DietPlanEditorProps {
  plan: WeeklyDietPlan;
  onSave: () => void;
  onCancel: () => void;
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

const DietPlanEditor: React.FC<DietPlanEditorProps> = ({ plan, onSave, onCancel }) => {
  const [planName, setPlanName] = useState(plan.plan_name);
  const [planNotes, setPlanNotes] = useState(plan.notes || '');
  const [meals, setMeals] = useState(plan.daily_meals || []);
  const [activeDay, setActiveDay] = useState(0);

  const weekStart = startOfWeek(new Date(plan.week_start_date));

  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      // Update plan details
      const { error: planError } = await supabase
        .from('weekly_diet_plans')
        .update({
          plan_name: planName,
          notes: planNotes,
          total_weekly_calories: meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
        })
        .eq('id', plan.id);

      if (planError) throw planError;

      // Update all meals
      for (const meal of meals) {
        if (meal.id) {
          // Update existing meal
          const { error } = await supabase
            .from('daily_meal_plans')
            .update({
              food_item: meal.food_item,
              quantity: meal.quantity,
              calories: meal.calories,
              proteins: meal.proteins,
              carbs: meal.carbs,
              fats: meal.fats,
              notes: meal.notes
            })
            .eq('id', meal.id);

          if (error) throw error;
        } else {
          // Insert new meal
          const { error } = await supabase
            .from('daily_meal_plans')
            .insert([{
              weekly_plan_id: plan.id,
              day_of_week: meal.day_of_week,
              meal_type: meal.meal_type,
              food_item: meal.food_item,
              quantity: meal.quantity,
              calories: meal.calories,
              proteins: meal.proteins,
              carbs: meal.carbs,
              fats: meal.fats,
              notes: meal.notes
            }]);

          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success('Diet plan updated successfully');
      onSave();
    },
    onError: (error) => {
      console.error('Error updating plan:', error);
      toast.error('Failed to update diet plan');
    },
  });

  const getMealsForDay = (dayIndex: number) => {
    return meals.filter(meal => meal.day_of_week === dayIndex);
  };

  const updateMeal = (dayIndex: number, mealType: string, updates: Partial<DailyMealPlan>) => {
    setMeals(prevMeals => {
      const existingMealIndex = prevMeals.findIndex(
        m => m.day_of_week === dayIndex && m.meal_type === mealType
      );

      if (existingMealIndex >= 0) {
        // Update existing meal
        const newMeals = [...prevMeals];
        newMeals[existingMealIndex] = { ...newMeals[existingMealIndex], ...updates };
        return newMeals;
      } else {
        // Add new meal
        const newMeal: DailyMealPlan = {
          id: '',
          day_of_week: dayIndex,
          meal_type: mealType,
          food_item: '',
          quantity: '',
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          notes: '',
          ...updates
        };
        return [...prevMeals, newMeal];
      }
    });
  };

  const getDayCalories = (dayIndex: number) => {
    return getMealsForDay(dayIndex).reduce((sum, meal) => sum + (meal.calories || 0), 0);
  };

  const totalWeeklyCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Diet Plan</CardTitle>
              <CardDescription>
                Customize your weekly meal plan and track nutrition
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => updatePlanMutation.mutate()}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter plan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-notes">Notes</Label>
              <Textarea
                id="plan-notes"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Add notes about this diet plan"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalWeeklyCalories.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Weekly Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(totalWeeklyCalories / 7)}
                </div>
                <div className="text-sm text-muted-foreground">Daily Average</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {meals.filter(m => m.food_item).length}
                </div>
                <div className="text-sm text-muted-foreground">Planned Meals</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Editor */}
      <Tabs value={activeDay.toString()} onValueChange={(value) => setActiveDay(parseInt(value))}>
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
                <CardTitle>
                  {day}, {format(addDays(weekStart, dayIndex), 'MMMM dd')}
                </CardTitle>
                <CardDescription>
                  Edit meals for this day. Total: {getDayCalories(dayIndex)} calories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {MEAL_TYPES.map(mealType => {
                    const meal = getMealsForDay(dayIndex).find(
                      m => m.meal_type === mealType.value
                    );

                    return (
                      <div key={mealType.value} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={mealType.color}>{mealType.label}</Badge>
                          {meal && meal.calories > 0 && (
                            <Badge variant="secondary">{meal.calories} cal</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Food Item</Label>
                            <Input
                              value={meal?.food_item || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                food_item: e.target.value
                              })}
                              placeholder="Enter food item"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              value={meal?.quantity || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                quantity: e.target.value
                              })}
                              placeholder="e.g., 1 cup, 100g"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Calories</Label>
                            <Input
                              type="number"
                              value={meal?.calories || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                calories: parseInt(e.target.value) || 0
                              })}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Protein (g)</Label>
                            <Input
                              type="number"
                              value={meal?.proteins || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                proteins: parseFloat(e.target.value) || 0
                              })}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Carbs (g)</Label>
                            <Input
                              type="number"
                              value={meal?.carbs || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                carbs: parseFloat(e.target.value) || 0
                              })}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fats (g)</Label>
                            <Input
                              type="number"
                              value={meal?.fats || ''}
                              onChange={(e) => updateMeal(dayIndex, mealType.value, {
                                fats: parseFloat(e.target.value) || 0
                              })}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={meal?.notes || ''}
                            onChange={(e) => updateMeal(dayIndex, mealType.value, {
                              notes: e.target.value
                            })}
                            placeholder="Add any notes about this meal"
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DietPlanEditor;