import React from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Reading {
  id?: string;
  date: string;
  hba1c?: number | null;
  fasting?: number | null;
  post_prandial?: number | null;
}

interface Props {
  readings: Reading[];
}

const BloodSugarTrendChart = ({ readings }: Props) => {
  if (readings.length <= 3) return null;

  const chartData = readings
    .slice()
    .reverse()
    .map(reading => ({
      date: new Date(reading.date).toLocaleDateString(),
      hba1c: reading.hba1c || undefined,
      fasting: reading.fasting || undefined,
      'post-prandial': reading.post_prandial || undefined
    }));

  console.log('Chart data:', chartData);

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Blood Sugar Trends</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              label={{ 
                value: 'Blood Sugar (mg/dL)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ 
                value: 'HbA1c (%)', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="fasting"
              stroke="#8884d8"
              name="Fasting"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="post-prandial"
              stroke="#82ca9d"
              name="Post-prandial"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hba1c"
              stroke="#ff7300"
              name="HbA1c"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default BloodSugarTrendChart;