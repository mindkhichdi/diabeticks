
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Bike, PersonStanding, Dumbbell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  steps?: number;
  distance_km?: number;
  heart_rate_avg?: number;
  device_source?: string;
}

const ActivityHeatmap = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { data: activities } = useQuery({
    queryKey: ['fitnessLogs', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('fitness_logs')
        .select('*')
        .eq('user_id', session.session.user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cycling':
        return <Bike className="w-4 h-4" />;
      case 'running':
      case 'walking':
        return <PersonStanding className="w-4 h-4" />;
      case 'strength':
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityIntensity = (calories: number) => {
    if (calories > 500) return 'bg-primary/90';
    if (calories > 300) return 'bg-primary/70';
    if (calories > 100) return 'bg-primary/50';
    return 'bg-primary/30';
  };

  const monthStats = activities?.reduce((acc, activity) => {
    return {
      totalCalories: acc.totalCalories + activity.calories_burned,
      totalMinutes: acc.totalMinutes + activity.duration_minutes,
      totalActivities: acc.totalActivities + 1,
      totalSteps: acc.totalSteps + (activity.steps || 0),
      totalDistance: acc.totalDistance + (activity.distance_km || 0)
    };
  }, {
    totalCalories: 0,
    totalMinutes: 0,
    totalActivities: 0,
    totalSteps: 0,
    totalDistance: 0
  });

  const selectedDateActivities = activities?.filter(a => 
    selectedDate && isSameDay(parseISO(a.date), selectedDate)
  ) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Activities this month</div>
          <div className="font-display text-2xl font-bold tabular">{monthStats?.totalActivities || 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Calories burned</div>
          <div className="font-display text-2xl font-bold tabular">{monthStats?.totalCalories || 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active minutes</div>
          <div className="font-display text-2xl font-bold tabular">{monthStats?.totalMinutes || 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Distance (km)</div>
          <div className="font-display text-2xl font-bold tabular">{monthStats?.totalDistance.toFixed(1) || 0}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Line the first day up under its weekday */}
          {Array.from({ length: getDay(startOfMonth(currentMonth)) }, (_, i) => <span key={`pad-${i}`} aria-hidden="true" />)}
          {daysInMonth.map(day => {
            const dayActivities = activities?.filter(a => 
              isSameDay(parseISO(a.date), day)
            ) || [];
            
            const totalCalories = dayActivities.reduce((sum, a) => 
              sum + a.calories_burned, 0
            );

            return (
              <HoverCard key={day.toISOString()} openDelay={200}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square w-full rounded-lg grid place-items-center text-xs font-bold tabular cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                      dayActivities.length > 0
                        ? cn(getActivityIntensity(totalCalories), totalCalories > 100 ? 'text-primary-foreground' : 'text-foreground')
                        : "bg-muted text-muted-foreground",
                      isToday(day) && "ring-2 ring-foreground"
                    )}
                    aria-label={`${format(day, 'd MMMM')}: ${dayActivities.length ? `${dayActivities.length} activit${dayActivities.length === 1 ? 'y' : 'ies'}` : 'no activity'}`}
                  >
                    {format(day, 'd')}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 p-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {format(day, 'MMMM d, yyyy')}
                    </p>
                    {dayActivities.length > 0 ? (
                      <div className="space-y-1">
                        {dayActivities.map(activity => (
                          <div 
                            key={activity.id}
                            className="text-xs flex items-center gap-1"
                          >
                            {getActivityIcon(activity.activity_type)}
                            <span className="capitalize">{activity.activity_type}</span>
                            <span className="text-muted-foreground">
                              {activity.duration_minutes} mins • {activity.calories_burned} cal
                              {activity.distance_km && ` • ${activity.distance_km} km`}
                              {activity.steps && ` • ${activity.steps} steps`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No activities recorded</p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-muted-foreground" aria-hidden="true">
          Less
          {['bg-muted', 'bg-primary/30', 'bg-primary/50', 'bg-primary/70', 'bg-primary/90'].map(c => <span key={c} className={cn('w-3.5 h-3.5 rounded', c)} />)}
          More
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Activities'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDateActivities.length > 0 ? (
              selectedDateActivities.map(activity => (
                <div 
                  key={activity.id}
                  className="bg-muted p-3 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.activity_type)}
                    <span className="font-medium capitalize">{activity.activity_type}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Duration: {activity.duration_minutes} minutes</p>
                    <p>Calories: {activity.calories_burned}</p>
                    {activity.distance_km && <p>Distance: {activity.distance_km} km</p>}
                    {activity.steps && <p>Steps: {activity.steps}</p>}
                    {activity.heart_rate_avg && <p>Avg Heart Rate: {activity.heart_rate_avg} bpm</p>}
                    {activity.device_source && <p>Source: {activity.device_source}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No activities recorded for this date</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityHeatmap;
