import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Reading {
  date: string;
  hba1c?: string;
  fasting?: string;
  postPrandial?: string;
}

const ReadingsLog = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [newReading, setNewReading] = useState<Reading>({
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReadings([newReading, ...readings]);
    setNewReading({
      date: new Date().toISOString().split('T')[0],
    });
    toast.success('Reading added successfully!');
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Blood Sugar Readings</h2>
      
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            type="date"
            value={newReading.date}
            onChange={(e) => setNewReading({ ...newReading, date: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="HbA1c (%)"
            value={newReading.hba1c || ''}
            onChange={(e) => setNewReading({ ...newReading, hba1c: e.target.value })}
            step="0.1"
          />
          <Input
            type="number"
            placeholder="Fasting (mg/dL)"
            value={newReading.fasting || ''}
            onChange={(e) => setNewReading({ ...newReading, fasting: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Post-prandial (mg/dL)"
            value={newReading.postPrandial || ''}
            onChange={(e) => setNewReading({ ...newReading, postPrandial: e.target.value })}
          />
        </div>
        <Button type="submit" className="bg-primary">Add Reading</Button>
      </form>

      <div className="space-y-4">
        {readings.map((reading, index) => (
          <Card key={index} className="p-4 bg-primary-light">
            <div className="grid md:grid-cols-4 gap-4">
              <p className="font-semibold">{new Date(reading.date).toLocaleDateString()}</p>
              {reading.hba1c && <p>HbA1c: {reading.hba1c}%</p>}
              {reading.fasting && <p>Fasting: {reading.fasting} mg/dL</p>}
              {reading.postPrandial && <p>Post-prandial: {reading.postPrandial} mg/dL</p>}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ReadingsLog;