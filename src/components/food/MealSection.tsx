import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MealType } from './AddFoodForm';

interface FoodLog {
  id: string;
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: string;
  carbs?: number;
}

interface MealSectionProps {
  meal: MealType;
  logs: FoodLog[];
  totalCalories: number;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const MealSection = ({ meal, logs, totalCalories, onAdd, onDelete }: MealSectionProps) => {
  const Icon = meal.icon;
  const carbs = logs.reduce((sum, l) => sum + (l.carbs || 0), 0);

  return (
    <section aria-label={meal.label} className="rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-3 p-4">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight">{meal.label}</h3>
          <p className="text-sm text-muted-foreground tabular">
            {logs.length ? `${totalCalories} cal · ${Math.round(carbs)} g carbs` : 'Nothing logged yet'}
          </p>
        </div>
        <Button variant="secondary" onClick={onAdd} aria-label={`Add food to ${meal.label.toLowerCase()}`}>
          <Plus /> Add
        </Button>
      </header>

      {logs.length > 0 && (
        <ul className="border-t border-border divide-y divide-border">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 pl-4 pr-2 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{log.food_item}</p>
                <p className="text-sm text-muted-foreground">
                  {log.quantity}
                  {log.calories && ` · ${log.calories} cal`}
                  {log.carbs != null && ` · ${log.carbs} g carbs`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${log.food_item}`}
                onClick={() => onDelete(log.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MealSection;
