import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Check, CircleX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MedicineStatus {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

interface MedicineLog {
  medicine_time: string;
  taken_at: string;
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

  const renderDayContent = (day: Date) => {
    if (!selectedDate || day.toDateString() !== selectedDate?.toDateString()) return null;
    if (!medicineData?.status) return null;

    const allTaken = medicineData.status.morning && 
                    medicineData.status.afternoon && 
                    medicineData.status.night;

    return (
      <div className={`mt-1 border-b-2 ${allTaken ? 'border-green-500' : 'border-red-500'}`}>
        <div className="flex justify-center gap-1">
          {medicineData.status.morning ? (
            <Check className="h-3 w-3 text-diabetic-morning" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {medicineData.status.afternoon ? (
            <Check className="h-3 w-3 text-diabetic-afternoon" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {medicineData.status.night ? (
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

      {selectedDate && medicineData?.logs && (
        <div className="mt-6">
          <h4 className="font-semibold mb-4">
            Medicine Status for {selectedDate.toLocaleDateString()}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicineData.logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(log.taken_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(log.taken_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Check className="h-4 w-4 text-green-500" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default MedicineCalendar;