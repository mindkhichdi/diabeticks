import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Utensils, Trash2, Coffee, Apple, Pizza, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const form = useForm<FoodLogForm>();
  const today = format(new Date(), 'yyyy-MM-dd');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-food-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      if (data.calories) {
        form.setValue('calories', data.calories);
        toast.success('Calories extracted from image');
      } else {
        toast.error('Could not detect calories from image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image');
    }
  };

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
      form.reset();
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

  const onSubmit = (values: FoodLogForm) => {
    addFoodLogMutation.mutate(values);
  };

  const mealTypes = [
    { 
      value: 'breakfast', 
      label: 'Breakfast', 
      icon: Coffee, 
      color: 'bg-gradient-to-r from-orange-400 to-orange-300',
      textColor: 'text-orange-900',
      borderColor: 'border-orange-200'
    },
    { 
      value: 'lunch', 
      label: 'Lunch', 
      icon: Utensils, 
      color: 'bg-gradient-to-r from-blue-400 to-blue-300',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-200'
    },
    { 
      value: 'snacks', 
      label: 'Snacks', 
      icon: Apple, 
      color: 'bg-gradient-to-r from-purple-400 to-purple-300',
      textColor: 'text-purple-900',
      borderColor: 'border-purple-200'
    },
    { 
      value: 'dinner', 
      label: 'Dinner', 
      icon: Pizza, 
      color: 'bg-gradient-to-r from-emerald-400 to-emerald-300',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-200'
    },
  ];

  const mealCalories = mealTypes.map(type => ({
    ...type,
    calories: foodLogs?.filter(log => log.meal_type === type.value)
      .reduce((sum, log) => sum + (parseInt(log.calories || '0', 10)), 0) || 0
  }));

  const totalCalories = mealCalories.reduce((sum, meal) => sum + meal.calories, 0);
  const targetCalories = 1780;

  return (
    <div className="space-y-6">
      {/* Add Food Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 rounded-lg shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="meal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="food_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter food item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quantity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calories</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter calories" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleImageCapture}
                      className="flex-shrink-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Utensils className="w-4 h-4 mr-2" />
            Add Food Log
          </Button>
        </form>
      </Form>

      {/* Today's Overview */}
      <div className="rounded-lg bg-white p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Today</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Daily Goal</div>
            <div className="font-semibold">
              <span className="text-orange-500">{totalCalories}</span>
              <span className="text-muted-foreground">/{targetCalories} cal</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {mealTypes.map((meal) => {
            const mealLogs = foodLogs?.filter(log => log.meal_type === meal.value);
            const totalMealCalories = mealLogs?.reduce((sum, log) => sum + (parseInt(log.calories || '0', 10)), 0) || 0;

            return (
              <div key={meal.value} className="space-y-3">
                <div className={cn(
                  "p-4 rounded-lg flex items-center justify-between transition-all",
                  meal.color,
                  "shadow-sm hover:shadow-md"
                )}>
                  <div className="flex items-center gap-3">
                    <meal.icon className={cn("w-5 h-5", meal.textColor)} />
                    <span className={cn("font-medium", meal.textColor)}>{meal.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", meal.textColor)}>{totalMealCalories}</span>
                    <span className={cn("text-sm", meal.textColor)}>cal</span>
                  </div>
                </div>

                {mealLogs && mealLogs.length > 0 ? (
                  <div className="grid gap-2 pl-4">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          meal.borderColor,
                          "bg-white/50 backdrop-blur-sm"
                        )}
                      >
                        <div>
                          <span className="font-medium">{log.food_item}</span>
                          <span className="text-muted-foreground ml-2">
                            ({log.quantity})
                          </span>
                          {log.calories && (
                            <span className="text-muted-foreground ml-2">
                              {log.calories} cal
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFoodLogMutation.mutate(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm pl-4">No food items logged</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FoodTracker;