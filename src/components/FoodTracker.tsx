import React from 'react';
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
import { Utensils, Trash2 } from 'lucide-react';

interface FoodLog {
  id: string;
  meal_type: string;
  food_item: string;
  quantity: string;
  date: string;
}

interface FoodLogForm {
  meal_type: string;
  food_item: string;
  quantity: string;
}

const FoodTracker = () => {
  const queryClient = useQueryClient();
  const form = useForm<FoodLogForm>();
  const today = format(new Date(), 'yyyy-MM-dd');

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
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'dinner', label: 'Dinner' },
  ];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Utensils className="w-4 h-4 mr-2" />
            Add Food Log
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        {isLoading ? (
          <p>Loading food logs...</p>
        ) : (
          mealTypes.map((mealType) => {
            const mealLogs = foodLogs?.filter(
              (log) => log.meal_type === mealType.value
            );

            return (
              <div key={mealType.value} className="space-y-2">
                <h3 className="font-semibold text-lg">{mealType.label}</h3>
                {mealLogs && mealLogs.length > 0 ? (
                  <div className="grid gap-2">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{log.food_item}</span>
                          <span className="text-muted-foreground ml-2">
                            ({log.quantity})
                          </span>
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
                  <p className="text-muted-foreground">No food items logged</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FoodTracker;