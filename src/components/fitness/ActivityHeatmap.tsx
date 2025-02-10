
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Bike, PersonStanding, Dumbbell } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
        return <Bike className="w-3 h-3" />;
      case 'running':
      case 'walking':
        return <PersonStanding className="w-3 h-3" />;
      case 'strength':
        return <Dumbbell className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Total Activities</div>
          <div className="text-2xl font-bold">{monthStats?.totalActivities || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Calories Burned</div>
          <div className="text-2xl font-bold">{monthStats?.totalCalories || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Active Minutes</div>
          <div className="text-2xl font-bold">{monthStats?.totalMinutes || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Distance (km)</div>
          <div className="text-2xl font-bold">{monthStats?.totalDistance.toFixed(1) || 0}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm text-muted-foreground">
              {day}
            </div>
          ))}
          
          {daysInMonth.map(day => {
            const dayActivities = activities?.filter(a => 
              isSameDay(new Date(a.date), day)
            ) || [];
            
            const totalCalories = dayActivities.reduce((sum, a) => 
              sum + a.calories_burned, 0
            );

            return (
              <HoverCard key={day.toISOString()}>
                <HoverCardTrigger asChild>
                  <div 
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center cursor-pointer",
                      dayActivities.length > 0 
                        ? getActivityIntensity(totalCalories)
                        : "bg-muted"
                    )}
                  >
                    {dayActivities.length > 0 && (
                      getActivityIcon(dayActivities[0].activity_type)
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {format(day, 'MMMM d, yyyy')}
                    </p>
                    {dayActivities.length > 0 ? (
                      <div className="space-y-1">
                        {dayActivities.map(activity => (
                          <div 
                            key={activity.id}
                            className="text-sm flex items-center gap-2"
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
                      <p className="text-sm text-muted-foreground">No activities recorded</p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
