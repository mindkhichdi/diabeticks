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
import { Camera, Loader2 } from 'lucide-react';
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

export interface MealType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AddFoodFormProps {
  onSubmit: (values: FoodLogForm) => void;
  mealTypes: MealType[];
  defaultMealType?: string;
  isSaving?: boolean;
}

const numberFields = [
  { name: 'carbs', label: 'Carbs (g)' },
  { name: 'calories', label: 'Calories' },
  { name: 'proteins', label: 'Protein (g)' },
  { name: 'fats', label: 'Fat (g)' },
] as const;

const AddFoodForm = ({ onSubmit, mealTypes, defaultMealType, isSaving }: AddFoodFormProps) => {
  const form = useForm<FoodLogForm>({ defaultValues: { meal_type: defaultMealType ?? mealTypes[0].value, food_item: '', quantity: '' } });
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
      toast.error("Couldn't read that photo. Try again or enter the details yourself.");
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
      toast.success('Details filled in from your photo');
    }
  };

  const submit = (values: FoodLogForm) => {
    // Empty number inputs come through as NaN.
    const clean = (n?: number) => (n == null || Number.isNaN(n) ? undefined : n);
    onSubmit({
      ...values,
      calories: clean(values.calories),
      proteins: clean(values.proteins),
      carbs: clean(values.carbs),
      fats: clean(values.fats),
    });
  };

  const inputClass = 'h-12 rounded-xl text-base bg-card';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleImageCapture}
            disabled={isAnalyzing}
            className="w-full border-2 border-dashed"
          >
            {isAnalyzing ? <Loader2 className="!size-5 animate-spin" /> : <Camera className="!size-5" />}
            {isAnalyzing ? 'Reading your photo…' : 'Take a photo to fill this in'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <FormField
            control={form.control}
            name="meal_type"
            rules={{ required: 'Choose a meal' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Meal</FormLabel>
                <div role="radiogroup" className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-muted">
                  {mealTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={field.value === type.value}
                      onClick={() => field.onChange(type.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold transition-colors',
                        field.value === type.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <type.icon className="w-5 h-5" />
                      {type.label}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <FormField
              control={form.control}
              name="food_item"
              rules={{ required: 'Enter what you ate' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">What did you eat?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Brown rice" {...field} className={inputClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              rules={{ required: 'Enter an amount' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="1 cup" {...field} className={inputClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-bold mb-2">Nutrition <span className="font-normal text-muted-foreground">(optional)</span></legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {numberFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          className={cn(inputClass, 'tabular')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save food'}
          </Button>
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