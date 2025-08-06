import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const userStatsSchema = z.object({
  height_cm: z.number().min(50).max(300).optional(),
  weight_kg: z.number().min(20).max(500).optional(),
  age: z.number().min(1).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']).optional(),
  diabetes_type: z.enum(['type1', 'type2', 'gestational', 'prediabetes']).optional(),
  blood_sugar_target_min: z.number().min(50).max(200).default(80),
  blood_sugar_target_max: z.number().min(100).max(300).default(130),
  a1c_target: z.number().min(4).max(15).optional(),
  medication_affects_appetite: z.boolean().default(false),
  allergies: z.array(z.string()).optional(),
  food_preferences: z.array(z.string()).optional(),
  dietary_restrictions: z.array(z.string()).optional(),
  favorite_foods: z.array(z.string()).optional(),
  disliked_foods: z.array(z.string()).optional(),
});

interface UserStatsData extends z.infer<typeof userStatsSchema> {
  allergies?: string[];
  food_preferences?: string[];
  dietary_restrictions?: string[];
  favorite_foods?: string[];
  disliked_foods?: string[];
}

interface UserStatsFormProps {
  onSubmit: (data: UserStatsData) => void;
  initialData?: Partial<UserStatsData>;
  isLoading?: boolean;
}

interface PreferencesSectionProps {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  title,
  items,
  onAdd,
  onRemove,
  placeholder
}) => {
  const [newItem, setNewItem] = React.useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button type="button" onClick={handleAdd} variant="outline" size="sm">
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {item}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onRemove(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const UserStatsForm: React.FC<UserStatsFormProps> = ({ onSubmit, initialData, isLoading = false }) => {
  const [allergies, setAllergies] = React.useState<string[]>(initialData?.allergies || []);
  const [foodPreferences, setFoodPreferences] = React.useState<string[]>(initialData?.food_preferences || []);
  const [dietaryRestrictions, setDietaryRestrictions] = React.useState<string[]>(initialData?.dietary_restrictions || []);
  const [favoriteFoods, setFavoriteFoods] = React.useState<string[]>(initialData?.favorite_foods || []);
  const [dislikedFoods, setDislikedFoods] = React.useState<string[]>(initialData?.disliked_foods || []);

  const form = useForm<z.infer<typeof userStatsSchema>>({
    resolver: zodResolver(userStatsSchema),
    defaultValues: {
      height_cm: initialData?.height_cm,
      weight_kg: initialData?.weight_kg,
      age: initialData?.age,
      gender: initialData?.gender,
      activity_level: initialData?.activity_level,
      diabetes_type: initialData?.diabetes_type,
      blood_sugar_target_min: initialData?.blood_sugar_target_min || 80,
      blood_sugar_target_max: initialData?.blood_sugar_target_max || 130,
      a1c_target: initialData?.a1c_target,
      medication_affects_appetite: initialData?.medication_affects_appetite || false,
    },
  });

  const handleSubmit = (data: z.infer<typeof userStatsSchema>) => {
    const formData: UserStatsData = {
      ...data,
      allergies,
      food_preferences: foodPreferences,
      dietary_restrictions: dietaryRestrictions,
      favorite_foods: favoriteFoods,
      disliked_foods: dislikedFoods,
    };
    onSubmit(formData);
    toast.success('Profile updated successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Profile & Food Preferences</CardTitle>
        <CardDescription>
          Help us create personalized meal plans by providing your health information and food preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                {...form.register('height_cm', { valueAsNumber: true })}
                placeholder="170"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                {...form.register('weight_kg', { valueAsNumber: true })}
                placeholder="70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                {...form.register('age', { valueAsNumber: true })}
                placeholder="30"
              />
            </div>
          </div>

          {/* Gender and Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select onValueChange={(value) => form.setValue('gender', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select onValueChange={(value) => form.setValue('activity_level', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                  <SelectItem value="extra_active">Extra Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Diabetes Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diabetes Type</Label>
              <Select onValueChange={(value) => form.setValue('diabetes_type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select diabetes type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="type1">Type 1</SelectItem>
                  <SelectItem value="type2">Type 2</SelectItem>
                  <SelectItem value="gestational">Gestational</SelectItem>
                  <SelectItem value="prediabetes">Prediabetes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_min">Blood Sugar Target Min (mg/dL)</Label>
                <Input
                  id="target_min"
                  type="number"
                  {...form.register('blood_sugar_target_min', { valueAsNumber: true })}
                  placeholder="80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_max">Blood Sugar Target Max (mg/dL)</Label>
                <Input
                  id="target_max"
                  type="number"
                  {...form.register('blood_sugar_target_max', { valueAsNumber: true })}
                  placeholder="130"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a1c">A1C Target (%)</Label>
                <Input
                  id="a1c"
                  type="number"
                  step="0.1"
                  {...form.register('a1c_target', { valueAsNumber: true })}
                  placeholder="7.0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="medication_affects_appetite"
                checked={form.watch('medication_affects_appetite')}
                onCheckedChange={(checked) => 
                  form.setValue('medication_affects_appetite', checked as boolean)
                }
              />
              <Label htmlFor="medication_affects_appetite">
                My medication affects my appetite
              </Label>
            </div>
          </div>

          {/* Food Preferences */}
          <div className="space-y-4">
            <PreferencesSection
              title="Allergies"
              items={allergies}
              onAdd={(item) => setAllergies([...allergies, item])}
              onRemove={(item) => setAllergies(allergies.filter(a => a !== item))}
              placeholder="e.g., nuts, dairy, shellfish"
            />

            <PreferencesSection
              title="Dietary Restrictions"
              items={dietaryRestrictions}
              onAdd={(item) => setDietaryRestrictions([...dietaryRestrictions, item])}
              onRemove={(item) => setDietaryRestrictions(dietaryRestrictions.filter(d => d !== item))}
              placeholder="e.g., vegetarian, gluten-free, low-sodium"
            />

            <PreferencesSection
              title="Food Preferences"
              items={foodPreferences}
              onAdd={(item) => setFoodPreferences([...foodPreferences, item])}
              onRemove={(item) => setFoodPreferences(foodPreferences.filter(p => p !== item))}
              placeholder="e.g., Mediterranean, low-carb, high-protein"
            />

            <PreferencesSection
              title="Favorite Foods"
              items={favoriteFoods}
              onAdd={(item) => setFavoriteFoods([...favoriteFoods, item])}
              onRemove={(item) => setFavoriteFoods(favoriteFoods.filter(f => f !== item))}
              placeholder="e.g., salmon, broccoli, quinoa"
            />

            <PreferencesSection
              title="Foods to Avoid"
              items={dislikedFoods}
              onAdd={(item) => setDislikedFoods([...dislikedFoods, item])}
              onRemove={(item) => setDislikedFoods(dislikedFoods.filter(d => d !== item))}
              placeholder="e.g., mushrooms, spicy food"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserStatsForm;