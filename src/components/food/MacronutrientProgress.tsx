import React from 'react';
import { Progress } from '@/components/ui/progress';
interface MacronutrientProgressProps {
  current: {
    proteins: number;
    carbs: number;
    fats: number;
  };
  goals: {
    proteins: number;
    carbs: number;
    fats: number;
  };
}
const MacronutrientProgress: React.FC<MacronutrientProgressProps> = ({
  current,
  goals
}) => {
  const calculatePercentage = (current: number, goal: number) => {
    return Math.min(Math.round(current / goal * 100), 100);
  };
  return <div className="space-y-4 bg-background border border-border p-4 rounded-lg">
      <h3 className="font-semibold text-lg mb-4 text-primary">Macronutrients Progress</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">Proteins</span>
            <span className="text-muted-foreground">{current.proteins}g / {goals.proteins}g</span>
          </div>
          <Progress value={calculatePercentage(current.proteins, goals.proteins)} className="bg-muted">
            <div className="h-full bg-chart-2 transition-all" style={{
            width: `${calculatePercentage(current.proteins, goals.proteins)}%`
          }} />
          </Progress>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">Carbs</span>
            <span className="text-muted-foreground">{current.carbs}g / {goals.carbs}g</span>
          </div>
          <Progress value={calculatePercentage(current.carbs, goals.carbs)} className="bg-muted">
            <div className="h-full bg-chart-3 transition-all" style={{
            width: `${calculatePercentage(current.carbs, goals.carbs)}%`
          }} />
          </Progress>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">Fats</span>
            <span className="text-muted-foreground">{current.fats}g / {goals.fats}g</span>
          </div>
          <Progress value={calculatePercentage(current.fats, goals.fats)} className="bg-muted">
            <div className="h-full bg-primary transition-all" style={{
            width: `${calculatePercentage(current.fats, goals.fats)}%`
          }} />
          </Progress>
        </div>
      </div>
    </div>;
};
export default MacronutrientProgress;