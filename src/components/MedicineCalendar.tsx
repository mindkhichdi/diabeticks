import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import MedicineLegend from './medicine/MedicineLegend';
import MedicineHistoryTable from './medicine/MedicineHistoryTable';
import CalendarDayContent from './medicine/CalendarDayContent';
import { MedicineStatus, MedicineLog } from '@/types/medicine';

const MedicineCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: medicineData } = useQuery({
    queryKey: ['medicine-logs', selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedDate) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('Fetching medicine logs for date:', dateStr);
      
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('taken_at::date', dateStr)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching medicine logs:', error);
        throw error;
      }

      console.log('Fetched medicine logs:', data);

      const status: MedicineStatus = {
        morning: false,
        afternoon: false,
        night: false
      };

      data?.forEach(log => {
        if (log.medicine_time in status) {
          status[log.medicine_time as keyof MedicineStatus] = true;
        }
      });

      return {
        status,
        logs: data as MedicineLog[]
      };
    },
    enabled: !!selectedDate,
  });

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Medicine History</h3>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          components={{
            DayContent: ({ date }) => (
              <CalendarDayContent
                date={date}
                selectedDate={selectedDate}
                medicineStatus={medicineData?.status}
              />
            ),
          }}
        />
      </div>
      
      <MedicineLegend />

      {selectedDate && medicineData?.logs && (
        <MedicineHistoryTable
          logs={medicineData.logs}
          selectedDate={selectedDate}
        />
      )}
    </Card>
  );
};

export default MedicineCalendar;