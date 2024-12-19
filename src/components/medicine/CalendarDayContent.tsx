import React from 'react';
import { Check } from 'lucide-react';
import { MedicineStatus } from '@/types/medicine';

interface CalendarDayContentProps {
  date: Date;
  selectedDate: Date | undefined;
  medicineStatus: MedicineStatus | undefined;
}

const CalendarDayContent = ({ date, selectedDate, medicineStatus }: CalendarDayContentProps) => {
  if (!selectedDate || date.toDateString() !== selectedDate?.toDateString()) {
    return <div>{date.getDate()}</div>;
  }

  if (!medicineStatus) {
    return (
      <div>
        <div>{date.getDate()}</div>
      </div>
    );
  }

  const allTaken = medicineStatus.morning && 
                  medicineStatus.afternoon && 
                  medicineStatus.night;

  return (
    <div>
      <div>{date.getDate()}</div>
      <div className={`mt-1 border-b-2 ${allTaken ? 'border-green-500' : 'border-gray-300'}`}>
        <div className="flex justify-center gap-1">
          {medicineStatus.morning && (
            <Check className="h-3 w-3 text-diabetic-morning" />
          )}
          {medicineStatus.afternoon && (
            <Check className="h-3 w-3 text-diabetic-afternoon" />
          )}
          {medicineStatus.night && (
            <Check className="h-3 w-3 text-diabetic-night" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarDayContent;