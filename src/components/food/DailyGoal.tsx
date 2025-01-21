import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface DailyGoalProps {
  targetCalories: number;
  totalCalories: number;
  onTargetChange: (value: number) => void;
}

const DailyGoal = ({ targetCalories, totalCalories, onTargetChange }: DailyGoalProps) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="text-lg font-semibold">
        Daily Goal: {' '}
        {isEditingTarget ? (
          <Input
            type="number"
            value={targetCalories}
            onChange={(e) => onTargetChange(Number(e.target.value))}
            onBlur={() => setIsEditingTarget(false)}
            className="w-24 inline-block"
            autoFocus
          />
        ) : (
          <span 
            onClick={() => setIsEditingTarget(true)}
            className="cursor-pointer hover:text-primary"
          >
            {targetCalories}
          </span>
        )} cal
      </div>
      <div className="text-lg">
        <span className="font-semibold text-primary">{totalCalories}</span>
        <span className="text-muted-foreground">/{targetCalories} cal</span>
      </div>
    </div>
  );
};

export default DailyGoal;