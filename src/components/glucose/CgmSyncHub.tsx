import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { Apple, Copy, FileUp, RefreshCw, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ParseResult, parseCgmCsv, timeInRange } from '@/lib/cgm-import';

// New tables aren't in generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SYNC_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/sync-health-data`;

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const useCgm = (days: number) =>
  useQuery({
    queryKey: ['cgm', days],
    queryFn: async () => {
      const { data, error } = await db.from('cgm_readings')
        .select('recorded_at, value_mgdl, source')
        .gte('recorded_at', subDays(new Date(), days).toISOString())
        .order('recorded_at', { ascending: true }).limit(5000);
      if (error) throw error;
      return data as { recorded_at: string; value_mgdl: number; source: string }[];
    },
  });

const TirBar = ({ low, inRange, high }: { low: number; inRange: number; high: number }) => (
  <div>
    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
      <div className="bg-low" style={{ width: `${low}%` }} />
      <div className="bg-in-range" style={{ width: `${inRange}%` }} />
      <div className="bg-high" style={{ width: `${high}%` }} />
    </div>
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      <span>Low {low}%</span><span className="font-bold text-foreground">In range {inRange}%</span><span>High {high}%</span>
    </div>
  </div>
);

const CsvImport = ({ onDone }: { onDone: () => void }) => {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [drag, setDrag] = useState(false);

  const readFile = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error('File is too large (max 20 MB).');
    try {
      const res = parseCgmCsv(await file.text());
      if (!res.samples.length) return toast.error('No glucose readings found in this file.');
      setPreview(res);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !preview) throw new Error('Please sign in again.');
      const rows = preview.samples.map((s) => ({ ...s, user_id: user.id, source: 'csv' }));
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await db.from('cgm_readings')
          .upsert(rows.slice(i, i + 500), { onConflict: 'user_id,recorded_at,source', ignoreDuplicates: true });
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`Imported ${n} readings`);
      qc.invalidateQueries({ queryKey: ['cgm'] });
      setPreview(null);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || 'Import failed'),
  });

  if (preview) {
    const first = preview.samples[0].recorded_at, last = preview.samples[preview.samples.length - 1].recorded_at;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-muted p-4 space-y-1">
          <p className="font-bold">{preview.format} detected</p>
          <p className="text-sm text-muted-foreground">
            {preview.samples.length} readings · {format(new Date(first), 'd MMM')} – {format(new Date(last), 'd MMM yyyy')}
            {preview.skipped > 0 && ` · ${preview.skipped} rows skipped`}
          </p>
        </div>
        <TirBar {...timeInRange(preview.samples)} />
        <p className="text-xs text-muted-foreground">Readings you already imported will be skipped automatically.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setPreview(null)}>Choose another</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Importing…' : `Import ${preview.samples.length}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
        drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <UploadCloud className="w-10 h-10 text-primary" />
      <p className="font-bold">Drop your CGM export here</p>
      <p className="text-sm text-muted-foreground">Dexcom Clarity, FreeStyle LibreView, or any CSV with time + glucose</p>
      <input type="file" accept=".csv,.txt,text/csv" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }} />
    </label>
  );
};

const AppleSync = () => {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const status = useQuery({
    queryKey: ['health-sync-token'],
    queryFn: async () => {
      const { data } = await db.from('health_sync_tokens').select('last_synced_at, created_at').maybeSingle();
      return data as { last_synced_at: string | null; created_at: string } | null;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again.');
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const t = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const { error } = await db.from('health_sync_tokens')
        .upsert({ user_id: user.id, token_hash: await sha256(t), last_synced_at: null }, { onConflict: 'user_id' });
      if (error) throw error;
      return t;
    },
    onSuccess: (t) => { setToken(t); qc.invalidateQueries({ queryKey: ['health-sync-token'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = (s: string) => navigator.clipboard.writeText(s).then(() => toast.success('Copied'));

  return (
    <div className="space-y-4 text-sm">
      {status.data && !token && (
        <p className="rounded-xl bg-muted p-3">
          Connected · {status.data.last_synced_at
            ? `last synced ${formatDistanceToNow(new Date(status.data.last_synced_at))} ago`
            : 'waiting for first sync'}
        </p>
      )}
      {token ? (
        <div className="space-y-2">
          <p className="font-bold">Your personal sync link (shown once — keep it private)</p>
          <div className="flex gap-2">
            <code className="flex-1 min-w-0 truncate rounded-lg bg-muted px-3 py-2 text-xs">{`${SYNC_URL}?token=${token}`}</code>
            <Button size="icon" variant="outline" onClick={() => copy(`${SYNC_URL}?token=${token}`)} aria-label="Copy link"><Copy /></Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <RefreshCw /> {status.data ? 'Create a new sync link' : 'Create my sync link'}
        </Button>
      )}
      <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
        <li>On your iPhone, open <b className="text-foreground">Shortcuts</b> → Automation → new <b className="text-foreground">Time of Day</b> automation (e.g. every hour), set to run immediately.</li>
        <li>Add <b className="text-foreground">Find Health Samples</b>: type Blood Glucose, start date in the last 1 day.</li>
        <li>Add <b className="text-foreground">Repeat with Each</b> → inside, a <b className="text-foreground">Dictionary</b> with <code>date</code> = Start Date, <code>value</code> = Value. Then <b className="text-foreground">Add to Variable</b> "samples".</li>
        <li>Add <b className="text-foreground">Get Contents of URL</b>: paste your sync link, method POST, Request Body JSON with key <code>samples</code> = the "samples" variable.</li>
      </ol>
      <p className="text-xs text-muted-foreground">Duplicates are ignored, so syncing often is safe. Creating a new link disables the old one.</p>
    </div>
  );
};

const CgmSyncHub = () => {
  const [open, setOpen] = useState(false);
  const { data = [] } = useCgm(14);
  const tir = timeInRange(data);
  const chart = data.map((d) => ({ t: new Date(d.recorded_at).getTime(), v: d.value_mgdl }));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">CGM & Health sync</h3>
          <p className="text-sm text-muted-foreground">
            {data.length ? `${data.length} readings in the last 14 days` : 'Import a CGM export or connect Apple Health'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}><FileUp /> Import & sync</Button>
      </div>

      {data.length > 0 && (
        <>
          <TirBar {...tir} />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <ReferenceArea y1={70} y2={180} fill="hsl(var(--in-range))" fillOpacity={0.1} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                  tickFormatter={(t) => format(new Date(t), 'd MMM')} tick={{ fontSize: 11 }} />
                <YAxis domain={[40, 300]} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(t) => format(new Date(t as number), 'd MMM HH:mm')} formatter={(v) => [`${v} mg/dL`, 'Glucose']} />
                <Area dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import & sync glucose data</DialogTitle>
            <DialogDescription>Bring in readings from your CGM or Apple Health.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="csv">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="csv"><FileUp className="w-4 h-4 mr-1" /> CGM file</TabsTrigger>
              <TabsTrigger value="apple"><Apple className="w-4 h-4 mr-1" /> Apple Health</TabsTrigger>
            </TabsList>
            <TabsContent value="csv" className="pt-3"><CsvImport onDone={() => setOpen(false)} /></TabsContent>
            <TabsContent value="apple" className="pt-3"><AppleSync /></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CgmSyncHub;
