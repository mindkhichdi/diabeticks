import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditGoalsDialogProps {
  currentGoals: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
  onGoalsUpdate: (newGoals: { calories: number; proteins: number; carbs: number; fats: number; }) => void;
}

const EditGoalsDialog = ({ currentGoals, onGoalsUpdate }: EditGoalsDialogProps) => {
  const [goals, setGoals] = React.useState(currentGoals);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          daily_protein_goal: goals.proteins,
          daily_carbs_goal: goals.carbs,
          daily_fats_goal: goals.fats,
        })
        .eq('id', session.session.user.id);

      if (error) throw error;

      onGoalsUpdate(goals);
      setIsOpen(false);
      toast.success('Goals updated successfully');
    } catch (error) {
      console.error('Error updating goals:', error);
      toast.error('Failed to update goals');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Daily Goals</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Daily Calories Goal</label>
            <Input
              type="number"
              value={goals.calories}
              onChange={(e) => setGoals(prev => ({ ...prev, calories: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Daily Protein Goal (g)</label>
            <Input
              type="number"
              value={goals.proteins}
              onChange={(e) => setGoals(prev => ({ ...prev, proteins: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Daily Carbs Goal (g)</label>
            <Input
              type="number"
              value={goals.carbs}
              onChange={(e) => setGoals(prev => ({ ...prev, carbs: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Daily Fats Goal (g)</label>
            <Input
              type="number"
              value={goals.fats}
              onChange={(e) => setGoals(prev => ({ ...prev, fats: Number(e.target.value) }))}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Save Goals
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalsDialog;