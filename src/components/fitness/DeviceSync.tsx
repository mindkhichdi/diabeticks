
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface HealthKitData {
  workouts: {
    startDate: string;
    endDate: string;
    activityType: string;
    duration: number;
    activeEnergyBurned: number;
    distance?: number;
    stepCount?: number;
    heartRateAvg?: number;
    heartRateMax?: number;
    elevationAscended?: number;
  }[];
}

const DeviceSync = () => {
  const queryClient = useQueryClient();

  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Auto-sync on mobile devices when component mounts
    if (isMobile) {
      const autoSync = async () => {
        if ('webkit' in window && 'messageHandlers' in (window as any).webkit) {
          await handleAppleHealthSync();
        } else if ('Android' in window) {
          await handleAndroidFitSync();
        }
      };
      autoSync();
    }
  }, []);

  const handleAppleHealthSync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Request HealthKit data through native bridge
      // This is a mock of what the native app would provide
      const healthData: HealthKitData = {
        workouts: [{
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          activityType: 'running',
          duration: 1800,
          activeEnergyBurned: 250,
          distance: 5,
          stepCount: 6000,
          heartRateAvg: 140,
          heartRateMax: 165,
          elevationAscended: 50,
        }]
      };

      const response = await fetch('https://zxzpyrsglniohutwzhlq.supabase.co/functions/v1/healthkit-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(healthData),
      });

      if (!response.ok) throw new Error('Failed to sync with Apple Health');

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['fitnessLogs'] });
      toast.success(`Successfully synced ${result.workouts_synced} workouts from Apple Health`);
    } catch (error) {
      console.error('Error syncing with Apple Health:', error);
      toast.error('Failed to sync with Apple Health');
    }
  };

  const handleAndroidFitSync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // This would be replaced with actual Google Fit API data
      const fitData = {
        workouts: [{
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          activityType: 'walking',
          duration: 3600,
          activeEnergyBurned: 300,
          distance: 4,
          stepCount: 8000,
          heartRateAvg: 120,
          heartRateMax: 140,
          elevationAscended: 30,
        }]
      };

      const response = await fetch('https://zxzpyrsglniohutwzhlq.supabase.co/functions/v1/healthkit-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-source': 'android',
        },
        body: JSON.stringify(fitData),
      });

      if (!response.ok) throw new Error('Failed to sync with Google Fit');

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['fitnessLogs'] });
      toast.success(`Successfully synced ${result.workouts_synced} workouts from Google Fit`);
    } catch (error) {
      console.error('Error syncing with Google Fit:', error);
      toast.error('Failed to sync with Google Fit');
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {'webkit' in window && 'messageHandlers' in (window as any).webkit ? (
        <Button
          variant="outline"
          onClick={handleAppleHealthSync}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Apple Health
        </Button>
      ) : 'Android' in window ? (
        <Button
          variant="outline"
          onClick={handleAndroidFitSync}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Google Fit
        </Button>
      ) : null}
    </div>
  );
};

export default DeviceSync;
