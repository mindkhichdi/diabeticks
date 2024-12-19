import React from 'react';
import { Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MedicineLog } from '@/types/medicine';

interface MedicineHistoryTableProps {
  logs: MedicineLog[];
  selectedDate: Date;
}

const MedicineHistoryTable = ({ logs, selectedDate }: MedicineHistoryTableProps) => {
  console.log('Rendering MedicineHistoryTable with logs:', logs);
  
  if (!logs?.length) {
    return (
      <div className="mt-6">
        <h4 className="font-semibold mb-4">
          Medicine Status for {selectedDate.toLocaleDateString()}
        </h4>
        <p className="text-gray-500">No medicine logs for this date.</p>
      </div>
    );
  }

  const formatLocalTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-4">
        Medicine Status for {selectedDate.toLocaleDateString()}
      </h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time Slot</TableHead>
            <TableHead>Taken At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={index}>
              <TableCell className="capitalize">
                {log.medicine_time}
              </TableCell>
              <TableCell>
                {formatLocalTime(log.taken_at)}
              </TableCell>
              <TableCell>
                <Check className="h-4 w-4 text-green-500" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MedicineHistoryTable;