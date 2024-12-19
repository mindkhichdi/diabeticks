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
          {logs.map((log, index) => {
            const takenAtDate = new Date(log.taken_at);
            return (
              <TableRow key={index}>
                <TableCell className="capitalize">
                  {log.medicine_time}
                </TableCell>
                <TableCell>
                  {takenAtDate.toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <Check className="h-4 w-4 text-green-500" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MedicineHistoryTable;