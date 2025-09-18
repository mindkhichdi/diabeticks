import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Utensils, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FoodAnalysisModal from './FoodAnalysisModal';

interface FoodLogForm {
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

interface AddFoodFormProps {
  onSubmit: (values: FoodLogForm) => void;
  mealTypes: {
    value: string;
    label: string;
    icon: any;
    color: string;
    textColor: string;
    borderColor: string;
  }[];
}

const AddFoodForm = ({ onSubmit, mealTypes }: AddFoodFormProps) => {
  const form = useForm<FoodLogForm>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    food_item: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  } | null>(null);

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append('image', file);

      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: formData,
      });

      if (error) throw error;

      if (data) {
        setAnalysisResults({
          food_item: data.food_item || 'Unknown Food',
          calories: data.calories,
          proteins: data.proteins,
          carbs: data.carbs,
          fats: data.fats,
        });
        setShowAnalysisModal(true);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = () => {
    if (analysisResults) {
      form.setValue('food_item', analysisResults.food_item);
      form.setValue('calories', analysisResults.calories);
      form.setValue('proteins', analysisResults.proteins);
      form.setValue('carbs', analysisResults.carbs);
      form.setValue('fats', analysisResults.fats);
      form.setValue('quantity', '1 serving');
      setShowAnalysisModal(false);
      toast.success('Food analysis added to form');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-background border border-border p-4 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="meal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Meal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mealTypes.map((type) => (
                          <SelectItem 
                            key={type.value} 
                            value={type.value}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              type.color,
                              "hover:opacity-90 transition-opacity"
                            )}
                          >
                            <type.icon className="w-4 h-4" />
                            <span className="font-medium">{type.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="food_item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Food Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter food item" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter quantity" {...field} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Calories</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Calories" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proteins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Proteins (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Proteins" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Carbs (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Carbs" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Fats (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Fats" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Utensils className="w-4 h-4 mr-2" />
              Add Food Log
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleImageCapture}
              disabled={isAnalyzing}
              className="flex-shrink-0 border-border text-foreground hover:bg-muted"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Take Picture'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </form>
      </Form>

      <FoodAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onSave={handleSaveAnalysis}
        foodData={analysisResults}
      />
    </>
  );
};

export default AddFoodForm;