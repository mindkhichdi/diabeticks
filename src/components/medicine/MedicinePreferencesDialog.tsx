import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MedicinePreference {
  slot_id: string;
  custom_name?: string | null;
  custom_time?: string | null;
}

interface Props {
  slotId: string;
  defaultName: string;
  defaultTime: string;
}

const MedicinePreferencesDialog = ({ slotId, defaultName, defaultTime }: Props) => {
  const [open, setOpen] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customTime, setCustomTime] = React.useState('');
  const queryClient = useQueryClient();

  const { data: preference } = useQuery({
    queryKey: ['medicine-preferences', slotId],
    queryFn: async () => {
      console.log('Fetching medicine preferences for slot:', slotId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('medicine_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('slot_id', slotId)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        console.error('Error fetching preferences:', error);
        throw error;
      }

      console.log('Fetched preference:', data);
      return data as MedicinePreference | null;
    },
  });

  React.useEffect(() => {
    if (preference) {
      setCustomName(preference.custom_name || '');
      setCustomTime(preference.custom_time || '');
    } else {
      setCustomName('');
      setCustomTime('');
    }
  }, [preference]);

  const savePreferences = useMutation({
    mutationFn: async () => {
      console.log('Saving preferences:', { slotId, customName, customTime });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('medicine_preferences')
        .upsert({
          user_id: user.id,
          slot_id: slotId,
          custom_name: customName || null,
          custom_time: customTime || null,
        });

      if (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-preferences'] });
      toast.success('Preferences saved successfully!');
      setOpen(false);
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize {defaultName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="customName" className="text-sm font-medium">
              Custom Name
            </label>
            <Input
              id="customName"
              placeholder={defaultName}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="customTime" className="text-sm font-medium">
              Custom Time
            </label>
            <Input
              id="customTime"
              type="time"
              placeholder={defaultTime}
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => savePreferences.mutate()}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicinePreferencesDialog;