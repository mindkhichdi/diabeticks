import React, { useState, useEffect } from 'react';
import { Sun, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import MedicineTimeSlot from './medicine/MedicineTimeSlot';
import MedicineHistoryTable from './medicine/MedicineHistoryTable';
import MedicineTrendsChart from './medicine/MedicineTrendsChart';
import { TimeSlot, MedicineLog } from '@/types/medicine';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const timeSlots: TimeSlot[] = [{
  id: 'morning',
  icon: <Sun className="w-6 h-6" />,
  label: 'Morning Medicine',
  time: '08:00'
}, {
  id: 'afternoon',
  icon: <Sunset className="w-6 h-6" />,
  label: 'Afternoon Medicine',
  time: '14:00'
}, {
  id: 'night',
  icon: <Moon className="w-6 h-6" />,
  label: 'Night Medicine',
  time: '20:00'
}];

const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: {
      y: 0.7
    },
    zIndex: 999
  };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }
  fire(0.25, {
    spread: 26,
    startVelocity: 55
  });
  fire(0.2, {
    spread: 60
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45
  });
};

const MedicineTracker = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: medicineLogs = []
  } = useQuery<MedicineLog[]>({
    queryKey: ['medicine-logs', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      console.log('Fetching medicine logs for date:', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });
      const {
        data,
        error
      } = await supabase.from('medicine_logs').select('*').eq('user_id', user.id).gte('taken_at', startOfDay.toISOString()).lte('taken_at', endOfDay.toISOString());
      if (error) {
        console.error('Error fetching medicine logs:', error);
        throw error;
      }
      console.log('Raw medicine logs data:', data);
      return data || [];
    }
  });

  const logMedicine = useMutation({
    mutationFn: async (slotId: string) => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      console.log('Logging medicine for user:', user.id);
      const now = selectedDate.toISOString();
      const {
        error,
        data
      } = await supabase.from('medicine_logs').insert([{
        medicine_time: slotId,
        user_id: user.id,
        taken_at: now
      }]).select().single();
      if (error) {
        console.error('Error inserting medicine log:', error);
        throw error;
      }
      console.log('Successfully logged medicine:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['medicine-logs']
      });
    },
    onError: error => {
      console.error('Error logging medicine:', error);
      toast.error('Failed to log medicine. Please try again.');
    }
  });

  const handleMedicineTaken = (slotId: string) => {
    logMedicine.mutate(slotId);
    toast.success(`${slotId.charAt(0).toUpperCase() + slotId.slice(1)} medicine marked as taken!`);
  };

  const isTaken = (slotId: string) => {
    if (!Array.isArray(medicineLogs)) {
      console.warn('medicineLogs is not an array:', medicineLogs);
      return false;
    }
    const taken = medicineLogs.some(log => {
      const logDate = new Date(log.taken_at).toISOString().split('T')[0];
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const result = log.medicine_time === slotId && logDate === selectedDateStr;
      return result;
    });
    console.log(`Medicine status for ${slotId}:`, taken);
    return taken;
  };

  useEffect(() => {
    const allTaken = timeSlots.every(slot => isTaken(slot.id));
    if (allTaken) {
      console.log('All medicines taken for the day! Triggering confetti...');
      triggerConfetti();
      toast.success('Congratulations! You\'ve taken all your medicines for the day! 🎉');
    }
  }, [medicineLogs]);

  return <div className="space-y-4">
      <Card className="p-6 shadow-lg bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            </div>
            <Input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => {
            const newDate = new Date(e.target.value);
            setSelectedDate(newDate);
            toast.info("Date selected: " + newDate.toLocaleDateString());
          }} max={new Date().toISOString().split('T')[0]} className="w-auto" />
          </div>
        </div>
      </Card>

      <MedicineTrendsChart selectedMonth={selectedDate} />

      <div className="grid gap-4 md:grid-cols-3 backdrop-blur-sm p-6 rounded-lg shadow-lg bg-orange-50">
        {timeSlots.map(slot => <MedicineTimeSlot key={slot.id} icon={slot.icon} time={slot.time} label={slot.label} isTaken={isTaken(slot.id)} onMedicineTaken={() => handleMedicineTaken(slot.id)} colorClass={`text-diabetic-${slot.id}`} disabled={false} slotId={slot.id} />)}
      </div>

      <Card className="p-6 shadow-lg backdrop-blur-sm bg-yellow-50">
        <MedicineHistoryTable logs={medicineLogs} selectedDate={selectedDate} />
      </Card>
    </div>;
};

export default MedicineTracker;
