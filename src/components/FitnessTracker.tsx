import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Dumbbell, PersonStanding, Bike, Heart, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import DeviceSync from './fitness/DeviceSync';
import ActivityHeatmap from './fitness/ActivityHeatmap';
import TrainingPlan from './fitness/TrainingPlan';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface FitnessLog {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  steps?: number;
  distance_km?: number;
  date: string;
  device_source?: string;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  elevation_gain?: number;
}
const activities = [{
  value: 'walking',
  label: 'Walking',
  icon: PersonStanding,
  caloriesPerMinute: 4
}, {
  value: 'running',
  label: 'Running',
  icon: PersonStanding,
  caloriesPerMinute: 11.5
}, {
  value: 'cycling',
  label: 'Cycling',
  icon: Bike,
  caloriesPerMinute: 7.5
}, {
  value: 'strength',
  label: 'Strength Training',
  icon: Dumbbell,
  caloriesPerMinute: 6
}];
const FitnessTracker = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [distance, setDistance] = useState('');
  const {
    data: fitnessLogs,
    isLoading
  } = useQuery({
    queryKey: ['fitnessLogs', today],
    queryFn: async () => {
      const {
        data: session
      } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');
      const {
        data,
        error
      } = await supabase.from('fitness_logs').select('*').eq('date', today).eq('user_id', session.session.user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as FitnessLog[];
    }
  });
  const addFitnessLogMutation = useMutation({
    mutationFn: async (values: Omit<FitnessLog, 'id'>) => {
      const {
        data: session
      } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');
      const {
        error
      } = await supabase.from('fitness_logs').insert([{
        ...values,
        user_id: session.session.user.id
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['fitnessLogs']
      });
      toast.success('Workout logged successfully!');
      setSelectedActivity('');
      setDuration('');
      setSteps('');
      setDistance('');
    },
    onError: error => {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout');
    }
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
      date: today
    });
  };
  const deleteFitnessLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('fitness_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['fitnessLogs']
      });
      toast.success('Workout deleted successfully');
    },
    onError: error => {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
  });
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-semibold text-primary">Fitness Tracker</h2>
        <DeviceSync />
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Activity Logger</TabsTrigger>
          <TabsTrigger value="training">Training Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracker" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="whoop-card p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Activity Type</label>
                      <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity" />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map(activity => <SelectItem key={activity.value} value={activity.value}>
                              <div className="flex items-center gap-2">
                                <activity.icon className="w-4 h-4" />
                                {activity.label}
                              </div>
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
                      <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Enter duration" min="1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Steps (optional)</label>
                      <Input type="number" value={steps} onChange={e => setSteps(e.target.value)} placeholder="Enter steps" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Distance (km, optional)</label>
                      <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="Enter distance" min="0" step="0.1" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Log Workout</Button>
                </form>
              </Card>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {fitnessLogs?.map(log => {
                const activity = activities.find(a => a.value === log.activity_type);
                return <Card key={log.id} className="whoop-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activity && <activity.icon className="w-4 h-4" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground">{activity?.label}</h3>
                              {log.device_source && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {log.device_source}
                                </span>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {log.duration_minutes} minutes • {log.calories_burned} calories
                              {log.steps && ` • ${log.steps} steps`}
                              {log.distance_km && ` • ${log.distance_km} km`}
                            </p>
                            {(log.heart_rate_avg || log.elevation_gain) && <p className="text-xs text-muted-foreground mt-0.5">
                                {log.heart_rate_avg && <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    Avg HR: {log.heart_rate_avg} bpm
                                    {log.heart_rate_max && ` (Max: ${log.heart_rate_max} bpm)`}
                                  </span>}
                                {log.elevation_gain && <span className="flex items-center gap-1 mt-0.5">
                                    <ArrowUp className="w-3 h-3" />
                                    Elevation: {log.elevation_gain}m
                                  </span>}
                              </p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteFitnessLogMutation.mutate(log.id)}>
                          Delete
                        </Button>
                      </div>
                    </Card>;
              })}
              </div>
            </div>
            
            <div className="h-full">
              <ActivityHeatmap />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="training">
          <TrainingPlan />
        </TabsContent>
      </Tabs>
    </div>;
};
export default FitnessTracker;