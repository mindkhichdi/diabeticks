import { cn } from '@/lib/utils';
import EditGoalsDialog from './EditGoalsDialog';

interface Goals {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface Props {
  totals: Goals;
  goals: Goals;
  onGoalsUpdate: (goals: Goals) => void;
}

/** Today's calories and macros against the daily goals. Carbs lead, since they move blood sugar most. */
const FoodSummary = ({ totals, goals, onGoalsUpdate }: Props) => {
  const pct = (v: number, g: number) => (g > 0 ? Math.min(100, (v / g) * 100) : 0);
  const left = Math.max(0, goals.calories - totals.calories);
  const over = totals.calories > goals.calories;

  const macros = [
    { label: 'Carbs', value: totals.carbs, goal: goals.carbs, bar: 'bg-chart-2' },
    { label: 'Protein', value: totals.proteins, goal: goals.proteins, bar: 'bg-chart-1' },
    { label: 'Fat', value: totals.fats, goal: goals.fats, bar: 'bg-chart-3' },
  ];

  return (
    <section aria-labelledby="food-summary" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="food-summary" className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Eaten today
          </h2>
          <p className="mt-1">
            <span className="font-display font-bold text-5xl tabular">{totals.calories.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2 whitespace-nowrap">of {goals.calories.toLocaleString()} cal</span>
          </p>
          <p className={cn('text-sm font-bold mt-1', over ? 'text-high' : 'text-muted-foreground')}>
            {over ? `${(totals.calories - goals.calories).toLocaleString()} cal over your goal` : `${left.toLocaleString()} cal left`}
          </p>
        </div>
        <EditGoalsDialog currentGoals={goals} onGoalsUpdate={onGoalsUpdate} />
      </div>

      <div className="h-3 rounded-full bg-muted mt-4 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-high' : 'bg-primary')} style={{ width: `${pct(totals.calories, goals.calories)}%` }} />
      </div>

      <dl className="grid grid-cols-3 gap-4 mt-6">
        {macros.map((m) => (
          <div key={m.label}>
            <dt className="text-sm font-bold">{m.label}</dt>
            <dd className="tabular">
              <span className="font-display font-bold text-2xl">{Math.round(m.value)}</span>
              <span className="block text-xs text-muted-foreground">of {m.goal} g</span>
            </dd>
            <div className="h-2 rounded-full bg-muted mt-1.5 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', m.bar)} style={{ width: `${pct(m.value, m.goal)}%` }} />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default FoodSummary;
