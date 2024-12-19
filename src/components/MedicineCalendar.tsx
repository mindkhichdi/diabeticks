import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Check, CircleX } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MedicineStatus {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

// In a real app, this would come from a database
const mockMedicineData: Record<string, MedicineStatus> = {
  [new Date().toISOString().split('T')[0]]: {
    morning: true,
    afternoon: false,
    night: false,
  },
  [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: {
    morning: true,
    afternoon: true,
    night: true,
  },
};

const MedicineCalendar = () => {
  const renderDayContent = (day: Date) => {
    const dateKey = day.toISOString().split('T')[0];
    const dayData = mockMedicineData[dateKey];

    if (!dayData) return null;

    return (
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-center gap-1">
          {dayData.morning ? (
            <Check className="h-3 w-3 text-diabetic-morning" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {dayData.afternoon ? (
            <Check className="h-3 w-3 text-diabetic-afternoon" />
          ) : (
            <CircleX className="h-3 w-3 text-red-500" />
          )}
          {dayData.night ? (
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
          modifiers={{
            hasMedicine: (date) => {
              const dateKey = date.toISOString().split('T')[0];
              return !!mockMedicineData[dateKey];
            },
          }}
          modifiersStyles={{
            hasMedicine: {
              fontWeight: 'bold',
            },
          }}
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
    </Card>
  );
};

export default MedicineCalendar;