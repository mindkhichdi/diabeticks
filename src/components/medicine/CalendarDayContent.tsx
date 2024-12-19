import React from 'react';
import { MedicineStatus } from '@/types/medicine';

interface CalendarDayContentProps {
  date: Date;
  selectedDate: Date | undefined;
  medicineStatus: MedicineStatus | undefined;
}

const CalendarDayContent = ({ date, selectedDate, medicineStatus }: CalendarDayContentProps) => {
  const isSameDate = (date1: Date, date2: Date | undefined): boolean => {
    if (!date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  console.log('Rendering CalendarDayContent:', {
    date: date.toISOString(),
    selectedDate: selectedDate?.toISOString(),
    medicineStatus,
    isSameDate: selectedDate ? isSameDate(date, selectedDate) : false
  });

  if (!selectedDate || !isSameDate(date, selectedDate)) {
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
      <div className={`${allTaken ? 'text-green-500 font-semibold' : ''}`}>
        {date.getDate()}
      </div>
    </div>
  );
};

export default CalendarDayContent;