import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { buildClinicalReport } from '@/lib/clinical-report';

const ranges = [30, 90, 180] as const;

const ClinicalReportButton = () => {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number>(90);
  const [ai, setAi] = useState(true);
  const [busy, setBusy] = useState(false);

  const make = async () => {
    setBusy(true);
    try {
      const { aiFailed } = await buildClinicalReport(days, ai);
      toast.success(aiFailed ? 'Report downloaded (AI summary unavailable this time)' : 'Report downloaded');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't create the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><FileText /> Doctor report</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Doctor report (PDF)</DialogTitle>
            <DialogDescription>Glucose, HbA1c, CGM, medicine and food summary to bring to your next visit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {ranges.map((r) => (
                <button key={r} onClick={() => setDays(r)}
                  className={cn('h-11 rounded-xl text-sm font-bold border', days === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                  {r} days
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="ai-sum" className="text-sm">Include AI summary & questions</Label>
              <Switch id="ai-sum" checked={ai} onCheckedChange={setAi} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={make} disabled={busy}>{busy ? 'Creating…' : 'Download PDF'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClinicalReportButton;
