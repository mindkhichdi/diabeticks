
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface MedicineTrendsChartProps {
  selectedMonth?: Date;
}

type DailyAdherence = {
  date: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  adherenceRate: number;
};

const MedicineTrendsChart = ({ selectedMonth = new Date() }: MedicineTrendsChartProps) => {
  // Get first and last day of the selected month
  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  // Format dates for display
  const monthName = selectedMonth.toLocaleString('default', { month: 'long' });
  const year = selectedMonth.getFullYear();

  // Calculate total days in month
  const daysInMonth = lastDay.getDate();
  
  // Query medicine logs for the selected month
  const { data: medicineLogs, isLoading } = useQuery({
    queryKey: ['medicine-trends', firstDay.toISOString(), lastDay.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');
      
      // Set time to beginning and end of day to ensure we get all logs for the month
      const startDate = new Date(firstDay);
      startDate.setUTCHours(0, 0, 0, 0);
      
      const endDate = new Date(lastDay);
      endDate.setUTCHours(23, 59, 59, 999);
      
      console.log('Fetching medicine logs for month:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
      
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', startDate.toISOString())
        .lte('taken_at', endDate.toISOString());
        
      if (error) {
        console.error('Error fetching medicine logs:', error);
        throw error;
      }
      
      console.log('Raw medicine month logs data:', data);
      return data || [];
    }
  });

  // Process data to create a daily adherence record
  const generateDailyAdherenceData = (): DailyAdherence[] => {
    const adherenceData: DailyAdherence[] = [];
    
    // Initialize data for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const dateString = currentDate.toISOString().split('T')[0];
      
      adherenceData.push({
        date: dateString,
        morning: false,
        afternoon: false,
        night: false,
        adherenceRate: 0
      });
    }
    
    // If no logs, return the initialized data
    if (!medicineLogs || !Array.isArray(medicineLogs)) return adherenceData;
    
    // Update data based on medicine logs
    medicineLogs.forEach(log => {
      // Get the date part only from the taken_at timestamp
      const logDate = new Date(log.taken_at).toISOString().split('T')[0];
      const dayRecord = adherenceData.find(day => day.date === logDate);
      
      if (dayRecord) {
        if (log.medicine_time === 'morning') dayRecord.morning = true;
        if (log.medicine_time === 'afternoon') dayRecord.afternoon = true;
        if (log.medicine_time === 'night') dayRecord.night = true;
        
        // Update adherence rate (percentage of medicines taken)
        dayRecord.adherenceRate = [dayRecord.morning, dayRecord.afternoon, dayRecord.night]
          .filter(Boolean).length / 3 * 100;
      }
    });
    
    return adherenceData;
  };

  const adherenceData = generateDailyAdherenceData();
  
  // Calculate overall adherence for the month
  const calculateOverallAdherence = (): number => {
    if (adherenceData.length === 0) return 0;
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === selectedMonth.getMonth() && 
                           today.getFullYear() === selectedMonth.getFullYear();
    
    // Only count days up to today for current month
    const relevantDays = isCurrentMonth 
      ? adherenceData.filter(day => new Date(day.date) <= today)
      : adherenceData;
    
    if (relevantDays.length === 0) return 0;
    
    const totalDoses = relevantDays.length * 3; // 3 doses per day
    const takenDoses = relevantDays.reduce((sum, day) => {
      return sum + [day.morning, day.afternoon, day.night].filter(Boolean).length;
    }, 0);
    
    return (takenDoses / totalDoses) * 100;
  };
  
  const overallAdherence = calculateOverallAdherence();

  // Get trend from previous month
  const getTrendIndicator = (): string => {
    // This is simplified - in a real app we would compare with previous month
    if (overallAdherence >= 90) return "excellent";
    if (overallAdherence >= 70) return "good";
    if (overallAdherence >= 50) return "fair";
    return "needs-improvement";
  };
  
  const trend = getTrendIndicator();

  // CSS classes for different adherence levels
  const getAdherenceBgClass = (percentage: number): string => {
    if (percentage >= 100) return "bg-green-200";
    if (percentage >= 66) return "bg-green-100";
    if (percentage >= 33) return "bg-yellow-100";
    if (percentage > 0) return "bg-orange-100";
    return "bg-red-50";
  };
  
  // Get color class for trend badge
  const getTrendBadgeClass = (trend: string): string => {
    switch (trend) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-green-400";
      case "fair": return "bg-yellow-400";
      case "needs-improvement": return "bg-red-400";
      default: return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Loading medicine trends...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center">
            <div className="animate-pulse w-full h-40 bg-gray-200 rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate the offset for the first day of the month
  // This is crucial for correctly positioning day cells in the calendar grid
  const getFirstDayOffset = () => {
    // The getDay() method returns the day of the week (0-6, where 0 is Sunday)
    return firstDay.getDay();
  };

  return (
    <Card className="w-full shadow-md bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-orange-500" />
            <span>Medicine Adherence: {monthName} {year}</span>
          </div>
          <Badge className={`${getTrendBadgeClass(trend)} text-white`}>
            {trend.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-orange-600">
            {Math.round(overallAdherence)}%
          </div>
          <div className="text-sm text-gray-500">
            Monthly Adherence Rate
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mt-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`header-${i}`} className="text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Add empty cells for days before the 1st of the month */}
          {Array.from({ length: getFirstDayOffset() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-10 rounded-md"></div>
          ))}
          
          {/* Days of the month with adherence indicators */}
          <TooltipProvider>
            {adherenceData.map((day, index) => {
              const dayNumber = index + 1;
              const currentDate = new Date();
              const dayDate = new Date(day.date);
              const isPast = dayDate <= currentDate;
              
              return (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`
                        h-10 rounded-md flex flex-col items-center justify-center cursor-pointer border
                        ${isPast ? getAdherenceBgClass(day.adherenceRate) : 'bg-gray-50 opacity-50'}
                      `}
                    >
                      <div className="text-xs font-medium">{dayNumber}</div>
                      {isPast && (
                        <div className="flex mt-1">
                          {day.morning && <div className="w-1 h-1 rounded-full bg-diabetic-morning mx-0.5"></div>}
                          {day.afternoon && <div className="w-1 h-1 rounded-full bg-diabetic-afternoon mx-0.5"></div>}
                          {day.night && <div className="w-1 h-1 rounded-full bg-diabetic-night mx-0.5"></div>}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-1">
                      <div className="font-medium">
                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex flex-col text-sm mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-diabetic-morning rounded-full"></div>
                          <span>Morning: </span>
                          {day.morning ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-diabetic-afternoon rounded-full"></div>
                          <span>Afternoon: </span>
                          {day.afternoon ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-diabetic-night rounded-full"></div>
                          <span>Night: </span>
                          {day.night ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
          
          {/* Add empty cells for days after the last day of the month */}
          {Array.from({ length: 6 - ((daysInMonth + getFirstDayOffset()) % 7) }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-10 rounded-md"></div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center text-xs gap-1">
            <div className="w-3 h-3 bg-green-200 rounded-md"></div>
            <span>All taken</span>
          </div>
          <div className="flex items-center text-xs gap-1">
            <div className="w-3 h-3 bg-green-100 rounded-md"></div>
            <span>2/3 taken</span>
          </div>
          <div className="flex items-center text-xs gap-1">
            <div className="w-3 h-3 bg-yellow-100 rounded-md"></div>
            <span>1/3 taken</span>
          </div>
          <div className="flex items-center text-xs gap-1">
            <div className="w-3 h-3 bg-red-50 rounded-md"></div>
            <span>Missed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicineTrendsChart;
