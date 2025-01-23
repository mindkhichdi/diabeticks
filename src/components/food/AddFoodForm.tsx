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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      // Show image preview
      setPreviewUrl(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('image', file);

      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: formData,
      });

      if (error) throw error;

      if (data) {
        form.setValue('calories', data.calories);
        form.setValue('proteins', data.proteins);
        form.setValue('carbs', data.carbs);
        form.setValue('fats', data.fats);
        toast.success('Food analysis complete');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="meal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
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
                  <FormLabel>Food Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter food item" {...field} />
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
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quantity" {...field} />
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
                    <FormLabel>Calories</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Calories" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                    <FormLabel>Proteins (g)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Proteins" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                    <FormLabel>Carbs (g)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Carbs" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                    <FormLabel>Fats (g)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Fats" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {previewUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={previewUrl} 
                  alt="Food preview" 
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            <Utensils className="w-4 h-4 mr-2" />
            Add Food Log
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleImageCapture}
            disabled={isAnalyzing}
            className="flex-shrink-0"
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
  );
};

export default AddFoodForm;