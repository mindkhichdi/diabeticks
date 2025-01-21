import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoodLog {
  id: string;
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: string;
}

interface MealSectionProps {
  meal: {
    value: string;
    label: string;
    icon: any;
    color: string;
    textColor: string;
    borderColor: string;
  };
  logs: FoodLog[];
  totalCalories: number;
  onDelete: (id: string) => void;
}

const MealSection = ({ meal, logs, totalCalories, onDelete }: MealSectionProps) => {
  const Icon = meal.icon;

  return (
    <div className="space-y-3">
      <div className={cn(
        "p-4 rounded-lg flex items-center justify-between transition-all",
        meal.color,
        "shadow-sm hover:shadow-md"
      )}>
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5", meal.textColor)} />
          <span className={cn("font-medium", meal.textColor)}>{meal.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", meal.textColor)}>{totalCalories}</span>
          <span className={cn("text-sm", meal.textColor)}>cal</span>
        </div>
      </div>

      {logs && logs.length > 0 ? (
        <div className="grid gap-2 pl-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                meal.borderColor,
                "bg-white/50 backdrop-blur-sm"
              )}
            >
              <div>
                <span className="font-medium">{log.food_item}</span>
                <span className="text-muted-foreground ml-2">
                  ({log.quantity})
                </span>
                {log.calories && (
                  <span className="text-muted-foreground ml-2">
                    {log.calories} cal
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(log.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm pl-4">No food items logged</p>
      )}
    </div>
  );
};

export default MealSection;