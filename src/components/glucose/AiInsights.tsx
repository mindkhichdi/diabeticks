import { useState } from 'react';
import { Sparkles, MessageCircleQuestion, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Insights { summary: string; trends: string[]; questions: string[] }

const AiInsights = ({ hasReadings }: { hasReadings: boolean }) => {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.functions.invoke('glucose-insights');
    setLoading(false);
    if (err) {
      let msg = "Couldn't generate insights right now.";
      try { msg = (await (err as { context?: Response }).context?.json())?.error ?? msg; } catch { /* keep default */ }
      setError(msg);
      return;
    }
    setData(res as Insights);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="size-5 text-primary" /> AI insights</h3>
          <p className="text-sm text-muted-foreground">A plain-language look at your readings, plus questions for your clinician.</p>
        </div>
        <Button onClick={run} disabled={loading || !hasReadings} variant={data ? 'secondary' : 'default'}>
          {loading ? 'Thinking…' : data ? 'Refresh' : 'Summarize my trends'}
        </Button>
      </div>

      {loading && <div className="h-24 rounded-xl bg-muted animate-pulse" />}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {data && !loading && (
        <div className="space-y-4">
          <p className="leading-relaxed">{data.summary}</p>
          {data.trends?.length > 0 && (
            <div>
              <p className="font-bold text-sm mb-2 flex items-center gap-2"><TrendingUp className="size-4" /> What stands out</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">{data.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
          {data.questions?.length > 0 && (
            <div className="rounded-xl bg-muted p-3">
              <p className="font-bold text-sm mb-2 flex items-center gap-2"><MessageCircleQuestion className="size-4" /> Ask your clinician</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">{data.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
            </div>
          )}
          <p className="text-xs text-muted-foreground">AI-generated from your logs. Not medical advice — always check with your care team.</p>
        </div>
      )}
    </section>
  );
};

export default AiInsights;
