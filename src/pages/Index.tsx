import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Activity, Droplet, House, LogOut, Pill, Plus, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import TodayView from '@/components/today/TodayView';
import ReadingsLog from '@/components/ReadingsLog';
import MedicineTracker from '@/components/MedicineTracker';
import FoodTracker from '@/components/FoodTracker';
import FitnessTracker from '@/components/FitnessTracker';
import LogSugarSheet from '@/components/glucose/LogSugarSheet';

type Tab = 'today' | 'sugar' | 'meds' | 'food' | 'move';

const tabs: { id: Tab; label: string; title: string; icon: typeof House }[] = [
  { id: 'today', label: 'Today', title: 'Today', icon: House },
  { id: 'sugar', label: 'Sugar', title: 'Blood sugar', icon: Droplet },
  { id: 'meds', label: 'Meds', title: 'Medicine', icon: Pill },
  { id: 'food', label: 'Food', title: 'Food', icon: Utensils },
  { id: 'move', label: 'Move', title: 'Activity', icon: Activity },
];

const isTab = (v: string | null): v is Tab => tabs.some((t) => t.id === v);

const Index = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const active: Tab = isTab(tabParam) ? tabParam : 'today';
  const [userName, setUserName] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  const goTo = (tab: Tab) => {
    setParams(tab === 'today' ? {} : { tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta = session.user.user_metadata as { full_name?: string; name?: string } | undefined;
      const name = meta?.full_name || meta?.name || session.user.email?.split('@')[0];
      if (name) setUserName(name.split(' ')[0]);
    });

    if ('Notification' in window) Notification.requestPermission();

    const checkTime = () => {
      const now = new Date();
      const times = [
        { hour: 7, min: 50, label: 'morning' },
        { hour: 13, min: 50, label: 'afternoon' },
        { hour: 19, min: 50, label: 'night' },
      ];
      times.forEach(({ hour, min, label }) => {
        if (now.getHours() === hour && now.getMinutes() === min) {
          toast.info(`Your ${label} medicine is due in 10 minutes`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Medicine reminder', { body: `Your ${label} medicine is due in 10 minutes` });
          }
        }
      });
    };
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Couldn't sign out. Try again.");
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const current = tabs.find((t) => t.id === active)!;

  return (
    <div className="min-h-screen w-full bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-card focus:px-4 focus:py-2 focus:rounded-xl">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 h-16">
          <button onClick={() => goTo('today')} aria-label="Diabeticks, go to Today">
            <Logo size={32} />
          </button>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                aria-current={active === id ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-bold transition-colors',
                  active === id ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground px-3">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-5xl mx-auto px-4 pt-6 pb-36 md:pb-16">
        <div className="mb-6">
          <p className="text-sm font-bold text-muted-foreground">{format(new Date(), 'EEEE d MMMM')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">
            {active === 'today' ? `${greeting}${userName ? `, ${userName}` : ''}` : current.title}
          </h1>
        </div>

        <div key={active} className="animate-slide-up">
          {active === 'today' && <TodayView onLogSugar={() => setLogOpen(true)} onNavigate={goTo} />}
          {active === 'sugar' && <ReadingsLog onLogSugar={() => setLogOpen(true)} />}
          {active === 'meds' && <MedicineTracker />}
          {active === 'food' && <FoodTracker />}
          {active === 'move' && <FitnessTracker />}
        </div>
      </main>

      {/* Log from anywhere */}
      {active !== 'today' && active !== 'sugar' && (
        <Button
          onClick={() => setLogOpen(true)}
          className="fixed z-40 right-4 bottom-28 md:bottom-8 h-14 rounded-full px-5 shadow-lg shadow-primary/25"
        >
          <Plus className="!size-5" />
          Log sugar
        </Button>
      )}

      {/* Mobile navigation */}
      <nav
        aria-label="Main"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => goTo(id)}
                aria-current={active === id ? 'page' : undefined}
                className={cn(
                  'w-full flex flex-col items-center gap-1 pt-2.5 pb-2 text-xs font-bold transition-colors',
                  active === id ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className={cn('grid place-items-center h-8 w-14 rounded-full transition-colors', active === id && 'bg-primary-soft')}>
                  <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 2} />
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <LogSugarSheet open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
};

export default Index;
