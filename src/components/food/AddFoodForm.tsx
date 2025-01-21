import { useRef } from 'react';
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
import { Utensils, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FoodLogForm {
  meal_type: string;
  food_item: string;
  quantity: string;
  calories?: number;
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

  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-food-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      if (data.calories) {
        form.setValue('calories', data.calories);
        toast.success('Calories extracted from image');
      } else {
        toast.error('Could not detect calories from image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calories</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter calories" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            <Utensils className="w-4 h-4 mr-2" />
            Add Food Log
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={handleImageCapture}
            className="flex-shrink-0"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Picture
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