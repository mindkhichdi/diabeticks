import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Dumbbell, Run, Walking, Bike } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FitnessLog {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  steps?: number;
  distance_km?: number;
  date: string;
}

const activities = [
  { value: 'walking', label: 'Walking', icon: Walking, caloriesPerMinute: 4 },
  { value: 'running', label: 'Running', icon: Run, caloriesPerMinute: 11.5 },
  { value: 'cycling', label: 'Cycling', icon: Bike, caloriesPerMinute: 7.5 },
  { value: 'strength', label: 'Strength Training', icon: Dumbbell, caloriesPerMinute: 6 },
];

const FitnessTracker = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [distance, setDistance] = useState('');

  const { data: fitnessLogs, isLoading } = useQuery({
    queryKey: ['fitnessLogs', today],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const { data, error } = await supabase
        .from('fitness_logs')
        .select('*')
        .eq('date', today)
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FitnessLog[];
    },
  });

  const addFitnessLogMutation = useMutation({
    mutationFn: async (values: Omit<FitnessLog, 'id'>) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const { error } = await supabase
        .from('fitness_logs')
        .insert([{ ...values, user_id: session.session.user.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitnessLogs'] });
      toast.success('Workout logged successfully!');
      setSelectedActivity('');
      setDuration('');
      setSteps('');
      setDistance('');
    },
    onError: (error) => {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !duration) {
      toast.error('Please fill in required fields');
      return;
    }

    const activity = activities.find(a => a.value === selectedActivity);
    if (!activity) return;

    const durationNum = parseInt(duration);
    const caloriesBurned = Math.round(activity.caloriesPerMinute * durationNum);

    addFitnessLogMutation.mutate({
      activity_type: selectedActivity,
      duration_minutes: durationNum,
      calories_burned: caloriesBurned,
      steps: steps ? parseInt(steps) : undefined,
      distance_km: distance ? parseFloat(distance) : undefined,
      date: today,
    });
  };

  const deleteFitnessLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fitness_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitnessLogs'] });
      toast.success('Workout deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      <div className="flex items-center gap-2">
                        <activity.icon className="w-4 h-4" />
                        {activity.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter duration"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Steps (optional)</label>
              <Input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="Enter steps"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Distance (km, optional)</label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="Enter distance"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">Log Workout</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {fitnessLogs?.map((log) => {
          const activity = activities.find(a => a.value === log.activity_type);
          return (
            <Card key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activity && <activity.icon className="w-5 h-5" />}
                  <div>
                    <h3 className="font-medium">{activity?.label}</h3>
                    <p className="text-sm text-gray-500">
                      {log.duration_minutes} minutes • {log.calories_burned} calories
                      {log.steps && ` • ${log.steps} steps`}
                      {log.distance_km && ` • ${log.distance_km} km`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFitnessLogMutation.mutate(log.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FitnessTracker;