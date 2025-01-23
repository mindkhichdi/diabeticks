import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FoodAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  foodData: {
    food_item: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  } | null;
}

const FoodAnalysisModal: React.FC<FoodAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSave,
  foodData,
}) => {
  if (!foodData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Food Analysis Results</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Food Item</h3>
              <p className="text-sm text-muted-foreground">{foodData.food_item}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Calories</h3>
                <p className="text-sm text-muted-foreground">{foodData.calories} kcal</p>
              </div>
              <div>
                <h3 className="font-medium">Proteins</h3>
                <p className="text-sm text-muted-foreground">{foodData.proteins}g</p>
              </div>
              <div>
                <h3 className="font-medium">Carbs</h3>
                <p className="text-sm text-muted-foreground">{foodData.carbs}g</p>
              </div>
              <div>
                <h3 className="font-medium">Fats</h3>
                <p className="text-sm text-muted-foreground">{foodData.fats}g</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save to Food Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FoodAnalysisModal;