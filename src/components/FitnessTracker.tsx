import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Dumbbell, PersonStanding, Bike, Heart, ArrowUp, Footprints, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import DeviceSync from './fitness/DeviceSync';
import ActivityHeatmap from './fitness/ActivityHeatmap';
import TrainingPlan from './fitness/TrainingPlan';

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
  icon: Footprints,
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
  label: 'Strength',
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
      toast.success('Activity saved');
      setSelectedActivity('');
      setDuration('');
      setSteps('');
      setDistance('');
    },
    onError: error => {
      console.error('Error logging workout:', error);
      toast.error("Couldn't save that activity. Try again.");
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !duration) {
      toast.error('Choose an activity and how long you did it');
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
      toast.success('Activity deleted');
    },
    onError: error => {
      console.error('Error deleting workout:', error);
      toast.error("Couldn't delete that activity. Try again.");
    }
  });
  const DAILY_GOAL_MINUTES = 30;
  const totalMinutes = fitnessLogs?.reduce((sum, l) => sum + l.duration_minutes, 0) ?? 0;
  const totalCalories = fitnessLogs?.reduce((sum, l) => sum + l.calories_burned, 0) ?? 0;
  const totalSteps = fitnessLogs?.reduce((sum, l) => sum + (l.steps || 0), 0) ?? 0;
  const goalPct = Math.min(100, (totalMinutes / DAILY_GOAL_MINUTES) * 100);

  return <Tabs defaultValue="tracker" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="tracker">Today</TabsTrigger>
        <TabsTrigger value="training">Training plans</TabsTrigger>
      </TabsList>

      <TabsContent value="tracker" className="mt-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            {/* Today's summary */}
            <section aria-labelledby="move-summary" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="move-summary" className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-sans">Active today</h2>
                  <p className="mt-1">
                    <span className="font-display font-bold text-5xl tabular">{totalMinutes}</span>
                    <span className="text-muted-foreground ml-2">of {DAILY_GOAL_MINUTES} min</span>
                  </p>
                  <p className={cn('text-sm font-bold mt-1', totalMinutes >= DAILY_GOAL_MINUTES ? 'text-in-range' : 'text-muted-foreground')}>
                    {totalMinutes >= DAILY_GOAL_MINUTES ? 'Daily goal reached. Well done!' : `${DAILY_GOAL_MINUTES - totalMinutes} min to go`}
                  </p>
                </div>
                <DeviceSync />
              </div>
              <div className="h-3 rounded-full bg-muted mt-4 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', totalMinutes >= DAILY_GOAL_MINUTES ? 'bg-in-range' : 'bg-primary')} style={{ width: `${goalPct}%` }} />
              </div>
              <dl className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <dt className="text-sm text-muted-foreground">Calories burned</dt>
                  <dd className="font-display font-bold text-2xl tabular">{totalCalories}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Steps</dt>
                  <dd className="font-display font-bold text-2xl tabular">{totalSteps.toLocaleString()}</dd>
                </div>
              </dl>
              <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-4">
                A short walk after meals can help bring blood sugar down. If you use insulin, check your sugar before and after exercise.
              </p>
            </section>

            {/* Log an activity */}
            <section aria-labelledby="log-activity" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 id="log-activity" className="text-xl font-bold">Log an activity</h2>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div role="radiogroup" aria-label="Activity" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activities.map(activity => <button
                      key={activity.value}
                      type="button"
                      role="radio"
                      aria-checked={selectedActivity === activity.value}
                      onClick={() => setSelectedActivity(activity.value)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-sm font-bold transition-colors min-h-[84px]',
                        selectedActivity === activity.value ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:border-primary/50',
                      )}
                    >
                      <activity.icon className="w-6 h-6" />
                      {activity.label}
                    </button>)}
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-bold mb-2">How long? (minutes)</label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 30, 45, 60].map(m => <button
                        key={m}
                        type="button"
                        aria-pressed={duration === String(m)}
                        onClick={() => setDuration(String(m))}
                        className={cn(
                          'h-11 min-w-[3.25rem] px-3 rounded-xl border-2 font-bold tabular transition-colors',
                          duration === String(m) ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:border-primary/50',
                        )}
                      >
                        {m}
                      </button>)}
                    <Input id="duration" type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Other" min="1" className="w-24 tabular" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label htmlFor="steps" className="block text-sm font-bold mb-1.5">Steps <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <Input id="steps" type="number" inputMode="numeric" value={steps} onChange={e => setSteps(e.target.value)} min="0" className="tabular" />
                  </div>
                  <div>
                    <label htmlFor="distance" className="block text-sm font-bold mb-1.5">Distance, km <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <Input id="distance" type="number" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} min="0" step="0.1" className="tabular" />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={addFitnessLogMutation.isPending}>
                  {addFitnessLogMutation.isPending ? 'Saving…' : 'Save activity'}
                </Button>
              </form>
            </section>

            {/* Today's activities */}
            {!!fitnessLogs?.length && <section aria-labelledby="today-activities">
                <h2 id="today-activities" className="text-lg font-bold mb-3">Today's activities</h2>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                  {fitnessLogs.map(log => {
                  const activity = activities.find(a => a.value === log.activity_type);
                  return <li key={log.id} className="flex items-center gap-3 pl-4 pr-2 py-3">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
                          {activity ? <activity.icon className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold flex items-center gap-2">
                            {activity?.label ?? log.activity_type}
                            {log.device_source && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{log.device_source}</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.duration_minutes} min · {log.calories_burned} cal
                            {log.steps ? ` · ${log.steps.toLocaleString()} steps` : ''}
                            {log.distance_km ? ` · ${log.distance_km} km` : ''}
                          </p>
                          {(log.heart_rate_avg || log.elevation_gain) && <p className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
                              {log.heart_rate_avg && <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {log.heart_rate_avg} bpm avg{log.heart_rate_max && `, ${log.heart_rate_max} max`}</span>}
                              {log.elevation_gain && <span className="inline-flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" /> {log.elevation_gain} m climbed</span>}
                            </p>}
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${activity?.label ?? 'activity'}`} onClick={() => deleteFitnessLogMutation.mutate(log.id)}>
                          <Trash2 />
                        </Button>
                      </li>;
                })}
                </ul>
              </section>}
          </div>

          <ActivityHeatmap />
        </div>
      </TabsContent>

      <TabsContent value="training" className="mt-6">
        <TrainingPlan />
      </TabsContent>
    </Tabs>;
};
export default FitnessTracker;