import React from 'react';
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sync } from 'lucide-react';

interface HealthKitData {
  startDate: string;
  endDate: string;
  device: string;
  activityType: string;
  duration: number;
  calories: number;
  distance?: number;
  steps?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  elevationGain?: number;
}

const DeviceSync = () => {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (data: HealthKitData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No session found');

      const syncId = `${data.device}_${data.startDate}`;
      
      const { error } = await supabase
        .from('fitness_logs')
        .upsert({
          user_id: session.session.user.id,
          activity_type: data.activityType,
          duration_minutes: Math.round(data.duration / 60),
          calories_burned: Math.round(data.calories),
          steps: data.steps,
          distance_km: data.distance,
          date: data.startDate.split('T')[0],
          device_source: data.device,
          heart_rate_avg: data.heartRateAvg,
          heart_rate_max: data.heartRateMax,
          elevation_gain: data.elevationGain,
          device_sync_id: syncId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitnessLogs'] });
      toast.success('Activity synced successfully');
    },
    onError: (error) => {
      console.error('Error syncing activity:', error);
      toast.error('Failed to sync activity');
    },
  });

  const handleAppleHealthSync = async () => {
    if (!('webkit' in window)) {
      toast.error('Apple HealthKit is only available on iOS devices');
      return;
    }

    try {
      // Request HealthKit authorization
      const response = await fetch('https://zxzpyrsglniohutwzhlq.supabase.co/functions/v1/healthkit-auth');
      if (!response.ok) throw new Error('Failed to authorize HealthKit');

      // Mock data for demonstration
      // In real implementation, this would come from HealthKit
      const mockActivity = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        device: 'Apple Watch',
        activityType: 'running',
        duration: 1800, // 30 minutes in seconds
        calories: 250,
        distance: 5,
        steps: 6000,
        heartRateAvg: 140,
        heartRateMax: 165,
        elevationGain: 50,
      };

      await syncMutation.mutateAsync(mockActivity);
    } catch (error) {
      console.error('Error syncing with Apple Health:', error);
      toast.error('Failed to sync with Apple Health');
    }
  };

  const handleSamsungHealthSync = async () => {
    try {
      // Mock data for demonstration
      // In real implementation, this would come from Samsung Health
      const mockActivity = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        device: 'Galaxy Watch',
        activityType: 'walking',
        duration: 3600, // 60 minutes in seconds
        calories: 300,
        distance: 4,
        steps: 8000,
        heartRateAvg: 120,
        heartRateMax: 140,
        elevationGain: 30,
      };

      await syncMutation.mutateAsync(mockActivity);
    } catch (error) {
      console.error('Error syncing with Samsung Health:', error);
      toast.error('Failed to sync with Samsung Health');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleAppleHealthSync}
        className="flex items-center gap-2"
      >
        <Sync className="w-4 h-4" />
        Sync Apple Health
      </Button>
      <Button
        variant="outline"
        onClick={handleSamsungHealthSync}
        className="flex items-center gap-2"
      >
        <Sync className="w-4 h-4" />
        Sync Samsung Health
      </Button>
    </div>
  );
};

export default DeviceSync;