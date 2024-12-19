import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Check, CircleX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';

interface MedicineStatus {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

const MedicineCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: medicineData } = useQuery({
    queryKey: ['medicine-logs', selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedDate) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('taken_at::date', dateStr)
        .eq('user_id', user.id);

      if (error) throw error;

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

      return status;
    },
  });

  const renderDayContent = (day: Date) => {
    if (day.toDateString() !== selectedDate?.toDateString()) return null;
    if (!medicineData) return null;

    return (
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-center gap-1">
          {medicineData.morning ? (
            <Check className="h-3 w-3 text-diabetic-morning" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {medicineData.afternoon ? (
            <Check className="h-3 w-3 text-diabetic-afternoon" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {medicineData.night ? (
            <Check className="h-3 w-3 text-diabetic-night" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>
    );
  };

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
              <div>
                <div>{date.getDate()}</div>
                {renderDayContent(date)}
              </div>
            ),
          }}
        />
      </div>
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-diabetic-morning"></div>
          <span>Morning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-diabetic-afternoon"></div>
          <span>Afternoon</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-diabetic-night"></div>
          <span>Night</span>
        </div>
      </div>

      {selectedDate && medicineData && (
        <div className="mt-6 p-4 bg-primary-light rounded-lg">
          <h4 className="font-semibold mb-2">
            Medicine Status for {selectedDate.toLocaleDateString()}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>Morning:</span>
              {medicineData.morning ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <CircleX className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Afternoon:</span>
              {medicineData.afternoon ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <CircleX className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Night:</span>
              {medicineData.night ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <CircleX className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MedicineCalendar;