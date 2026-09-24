import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Check, Moon, Sun, Sunset } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import RangeRibbon from '@/components/glucose/RangeRibbon';
import { cn } from '@/lib/utils';
import { DEFAULT_TARGETS, ReadingKind, kindLabel, zoneClass, zoneMeta, zoneOf } from '@/lib/glucose';

/** The hero: the app's own range scale, live, for visitors to drag. */
const TryTheScale = () => {
  const [value, setValue] = useState(142);
  const [kind, setKind] = useState<ReadingKind>('post_prandial');
  const zone = zoneOf(value, kind, DEFAULT_TARGETS);

  return (
    <div className="rounded-3xl bg-card border border-border p-5 sm:p-7 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Try it</p>
        <div role="radiogroup" aria-label="Reading type" className="inline-flex gap-1 p-1 rounded-xl bg-muted">
          {(['fasting', 'post_prandial'] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-bold transition-colors',
                kind === k ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {kindLabel[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 mt-4">
        <span className={cn('font-display font-bold text-[5.5rem] sm:text-8xl leading-[0.85] tabular transition-colors', zoneClass[zone].text)}>
          {value}
        </span>
        <span className="pb-1">
          <span className="block text-sm text-muted-foreground">mg/dL</span>
          <span className={cn('inline-flex items-center gap-1.5 font-bold', zoneClass[zone].text)}>
            <span className={cn('w-2.5 h-2.5 rounded-full', zoneClass[zone].bg)} />
            {zoneMeta[zone].label}
          </span>
        </span>
      </div>

      <RangeRibbon value={value} kind={kind} targets={DEFAULT_TARGETS} onChange={setValue} className="mt-4" />
      <p className="text-xs text-muted-foreground text-center">Drag the scale, or focus it and use the arrow keys</p>

      <p aria-live="polite" className={cn('mt-4 rounded-2xl border-l-4 p-4 text-[0.95rem]', zoneClass[zone].soft, zoneClass[zone].border)}>
        {zoneMeta[zone].advice}
      </p>
    </div>
  );
};

const MedsPreview = () => (
  <ul className="space-y-2" aria-hidden="true">
    {[
      { icon: Sun, name: 'Morning', status: 'Taken at 8:05', taken: true },
      { icon: Sunset, name: 'Afternoon', status: 'Due now', taken: false, due: true },
      { icon: Moon, name: 'Night', status: 'Scheduled 9:00 pm', taken: false },
    ].map(({ icon: Icon, name, status, taken, due }) => (
      <li
        key={name}
        className={cn(
          'flex items-center gap-3 rounded-xl border-2 p-2.5',
          taken ? 'border-transparent bg-in-range/10' : due ? 'border-primary bg-primary-soft' : 'border-border',
        )}
      >
        <span className={cn('grid place-items-center w-8 h-8 rounded-full border-2', taken ? 'bg-in-range border-in-range text-white' : 'border-muted-foreground/40 text-muted-foreground')}>
          {taken ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
        </span>
        <span className="text-sm">
          <span className={cn('block font-bold', taken && 'line-through text-muted-foreground')}>{name}</span>
          <span className={cn('block text-xs font-bold', taken ? 'text-in-range' : due ? 'text-primary' : 'text-muted-foreground')}>{status}</span>
        </span>
      </li>
    ))}
  </ul>
);

const TrendPreview = () => {
  const pts = [128, 150, 112, 170, 96, 138, 186, 118, 104, 144, 122, 131];
  const x = (i: number) => 8 + i * (284 / (pts.length - 1));
  const y = (v: number) => 110 - ((v - 60) / 160) * 100;
  const color = (v: number) => (v < 70 ? 'var(--low)' : v > 180 ? 'var(--high)' : 'var(--in-range)');
  return (
    <svg viewBox="0 0 300 120" className="w-full h-auto" aria-hidden="true">
      <rect x="0" y={y(180)} width="300" height={y(70) - y(180)} fill="hsl(var(--in-range))" opacity="0.1" rx="6" />
      <polyline points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      {pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill={`hsl(${color(v)})`} stroke="hsl(var(--card))" strokeWidth="1.5" />)}
    </svg>
  );
};

const MealPreview = () => (
  <div className="space-y-3" aria-hidden="true">
    {[
      { label: 'Carbs', value: 142, goal: 200, cls: 'bg-chart-2' },
      { label: 'Protein', value: 68, goal: 90, cls: 'bg-chart-1' },
      { label: 'Fat', value: 41, goal: 60, cls: 'bg-chart-3' },
    ].map((m) => (
      <div key={m.label}>
        <div className="flex justify-between text-sm">
          <span className="font-bold">{m.label}</span>
          <span className="text-muted-foreground tabular">{m.value} / {m.goal} g</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted mt-1 overflow-hidden">
          <div className={cn('h-full rounded-full', m.cls)} style={{ width: `${(m.value / m.goal) * 100}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const features = [
  {
    title: 'Never miss a dose',
    body: 'Morning, afternoon and night doses as a simple checklist. Tap to mark one taken, tap again to undo.',
    preview: <MedsPreview />,
  },
  {
    title: 'See your trends',
    body: 'Time in range, your average and an estimated A1c over 7, 30 or 90 days, with every reading coloured by zone.',
    preview: <TrendPreview />,
  },
  {
    title: 'Keep track of meals',
    body: 'Log what you eat and watch carbs, protein and fat against your daily goals. Snap a photo of a meal to fill in the details.',
    preview: <MealPreview />,
  },
];

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 h-16">
          <Logo size={32} />
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="px-3">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/auth?mode=signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 sm:pt-16 sm:pb-24 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="animate-slide-up">
            <p className="text-sm font-bold text-primary">For people living with diabetes</p>
            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl font-bold mt-3">
              Know where your sugar stands, and what to do next.
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-xl">
              Diabeticks keeps your readings, medicine, meals and activity in one calm place.
              Every reading is shown as low, in range or high, with plain advice, so you're never left guessing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup">
                  Create a free account <ArrowRight className="!size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>
          <div className="animate-slide-up [animation-delay:100ms]">
            <TryTheScale />
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="bg-card border-y border-border">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold max-w-2xl">
              Your whole routine, in one place
            </h2>
            <div className="grid gap-5 md:grid-cols-3 mt-10">
              {features.map((f) => (
                <article key={f.title} className="rounded-3xl border border-border bg-background p-5 sm:p-6 flex flex-col">
                  <div className="rounded-2xl bg-card border border-border p-4 min-h-[180px] flex flex-col justify-center">
                    {f.preview}
                  </div>
                  <h3 className="text-xl font-bold mt-5">{f.title}</h3>
                  <p className="text-muted-foreground mt-2">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Readability */}
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24 grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">Easy to read, easy to tap</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Diabetes can affect your eyesight, so Diabeticks is built to be read at a glance.
            </p>
          </div>
          <ul className="grid gap-3">
            {[
              'Large text in Atkinson Hyperlegible, a typeface designed for low vision',
              'Colours always come with words, so nothing depends on colour alone',
              'Big buttons you can hit first time',
              'Light and dark modes that follow your device',
            ].map((t) => (
              <li key={t} className="flex gap-3 items-start rounded-2xl bg-card border border-border p-4">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-in-range text-white shrink-0">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
                <span className="font-bold">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action */}
        <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-24">
          <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">Start with today's reading</h2>
              <p className="mt-2 text-primary-foreground/80 text-lg">It's free, and setting up takes under a minute.</p>
            </div>
            <Button size="lg" variant="secondary" asChild className="shrink-0">
              <Link to="/auth?mode=signup">
                Create a free account <ArrowRight className="!size-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6 max-w-2xl">
            Diabeticks helps you keep track of your health. It doesn't replace advice from your doctor or diabetes care team.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span>© {new Date().getFullYear()} Diabeticks</span>
          </div>
          <nav className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Use</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
