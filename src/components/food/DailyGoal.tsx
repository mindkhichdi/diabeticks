import { useState } from 'react';
import { Input } from '@/components/ui/input';
import EditGoalsDialog from './EditGoalsDialog';

interface DailyGoalProps {
  targetCalories: number;
  totalCalories: number;
  onTargetChange: (value: number) => void;
  onGoalsUpdate?: (goals: { calories: number; proteins: number; carbs: number; fats: number; }) => void;
  currentGoals: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
}

const DailyGoal = ({ 
  targetCalories, 
  totalCalories, 
  onTargetChange,
  onGoalsUpdate,
  currentGoals
}: DailyGoalProps) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="text-lg font-semibold flex items-center gap-2">
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
        <EditGoalsDialog
          currentGoals={currentGoals}
          onGoalsUpdate={onGoalsUpdate || (() => {})}
        />
      </div>
      <div className="text-lg">
        <span className="font-semibold text-primary">{totalCalories}</span>
        <span className="text-muted-foreground">/{targetCalories} cal</span>
      </div>
    </div>
  );
};

export default DailyGoal;