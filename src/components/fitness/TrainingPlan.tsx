import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Zap, Target, Calendar, CheckCircle } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

interface DailyActivity {
  id: string;
  type: 'run' | 'bike' | 'swim' | 'strength' | 'rest' | 'cross-training';
  name: string;
  duration: number;
  intensity: 'easy' | 'moderate' | 'hard' | 'race-pace';
  distance?: number;
  description: string;
  completed?: boolean;
}

interface TrainingPlan {
  id: string;
  name: string;
  event: string;
  duration_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  weekly_activities: DailyActivity[][];
}

const trainingPlans: TrainingPlan[] = [
  {
    id: '5k-beginner',
    name: '5K Training Plan',
    event: '5K',
    duration_weeks: 8,
    difficulty: 'beginner',
    description: 'Perfect for first-time runners aiming to complete a 5K',
    weekly_activities: [
      [
        { id: '1', type: 'run', name: 'Easy Run', duration: 20, intensity: 'easy', distance: 2, description: 'Comfortable pace, focus on building endurance' },
        { id: '2', type: 'rest', name: 'Rest Day', duration: 0, intensity: 'easy', description: 'Complete rest or light stretching' },
        { id: '3', type: 'run', name: 'Interval Training', duration: 25, intensity: 'moderate', distance: 2.5, description: '5x 2-minute intervals at moderate pace' },
        { id: '4', type: 'cross-training', name: 'Cross Training', duration: 30, intensity: 'easy', description: 'Swimming, cycling, or strength training' },
        { id: '5', type: 'run', name: 'Easy Run', duration: 20, intensity: 'easy', distance: 2, description: 'Recovery run at comfortable pace' },
        { id: '6', type: 'rest', name: 'Rest Day', duration: 0, intensity: 'easy', description: 'Complete rest day' },
        { id: '7', type: 'run', name: 'Long Run', duration: 35, intensity: 'easy', distance: 3, description: 'Steady pace, build weekly mileage' }
      ]
    ]
  },
  {
    id: '10k-intermediate',
    name: '10K Training Plan',
    event: '10K',
    duration_weeks: 12,
    difficulty: 'intermediate',
    description: 'For runners with 5K experience ready for 10K challenge',
    weekly_activities: [
      [
        { id: '1', type: 'run', name: 'Easy Run', duration: 30, intensity: 'easy', distance: 4, description: 'Comfortable aerobic pace' },
        { id: '2', type: 'strength', name: 'Strength Training', duration: 45, intensity: 'moderate', description: 'Full body strength workout focusing on running muscles' },
        { id: '3', type: 'run', name: 'Tempo Run', duration: 35, intensity: 'moderate', distance: 5, description: '20 minutes at tempo pace with warm-up/cool-down' },
        { id: '4', type: 'cross-training', name: 'Cross Training', duration: 40, intensity: 'easy', description: 'Low-impact cardio activity' },
        { id: '5', type: 'run', name: 'Intervals', duration: 40, intensity: 'hard', distance: 5, description: '6x 3-minute intervals at 10K pace' },
        { id: '6', type: 'rest', name: 'Rest Day', duration: 0, intensity: 'easy', description: 'Complete rest or gentle yoga' },
        { id: '7', type: 'run', name: 'Long Run', duration: 50, intensity: 'easy', distance: 6, description: 'Build endurance at conversational pace' }
      ]
    ]
  },
  {
    id: 'marathon-advanced',
    name: 'Marathon Training Plan',
    event: 'Marathon',
    duration_weeks: 20,
    difficulty: 'advanced',
    description: 'Comprehensive 20-week plan for experienced runners',
    weekly_activities: [
      [
        { id: '1', type: 'run', name: 'Easy Run', duration: 45, intensity: 'easy', distance: 6, description: 'Recovery pace, aerobic base building' },
        { id: '2', type: 'strength', name: 'Strength + Core', duration: 60, intensity: 'moderate', description: 'Functional strength training with core focus' },
        { id: '3', type: 'run', name: 'Tempo Run', duration: 55, intensity: 'moderate', distance: 8, description: '30 minutes at marathon pace' },
        { id: '4', type: 'run', name: 'Easy Run', duration: 40, intensity: 'easy', distance: 5, description: 'Active recovery run' },
        { id: '5', type: 'run', name: 'Track Workout', duration: 60, intensity: 'hard', distance: 8, description: '5x 1000m at 5K pace with recovery' },
        { id: '6', type: 'cross-training', name: 'Cross Training', duration: 45, intensity: 'easy', description: 'Cycling or swimming for active recovery' },
        { id: '7', type: 'run', name: 'Long Run', duration: 120, intensity: 'easy', distance: 16, description: 'Progressive long run building weekly distance' }
      ]
    ]
  },
  {
    id: 'triathlon-sprint',
    name: 'Sprint Triathlon',
    event: 'Triathlon',
    duration_weeks: 12,
    difficulty: 'intermediate',
    description: 'Sprint distance triathlon (750m swim, 20km bike, 5km run)',
    weekly_activities: [
      [
        { id: '1', type: 'swim', name: 'Swim Technique', duration: 45, intensity: 'easy', distance: 1, description: 'Focus on technique and form drills' },
        { id: '2', type: 'bike', name: 'Bike Endurance', duration: 60, intensity: 'moderate', distance: 25, description: 'Steady aerobic effort on bike' },
        { id: '3', type: 'run', name: 'Brick Run', duration: 20, intensity: 'moderate', distance: 3, description: 'Run immediately after bike workout' },
        { id: '4', type: 'swim', name: 'Swim Intervals', duration: 40, intensity: 'hard', distance: 1.2, description: '8x 50m intervals at race pace' },
        { id: '5', type: 'strength', name: 'Functional Strength', duration: 45, intensity: 'moderate', description: 'Multi-sport specific strength training' },
        { id: '6', type: 'bike', name: 'Bike Intervals', duration: 50, intensity: 'hard', distance: 20, description: '5x 4-minute intervals at threshold' },
        { id: '7', type: 'run', name: 'Long Run', duration: 40, intensity: 'easy', distance: 5, description: 'Aerobic base building run' }
      ]
    ]
  },
  {
    id: 'ironman-advanced',
    name: 'Ironman Training',
    event: 'Ironman',
    duration_weeks: 24,
    difficulty: 'advanced',
    description: 'Full Ironman distance (3.8km swim, 180km bike, 42.2km run)',
    weekly_activities: [
      [
        { id: '1', type: 'swim', name: 'Endurance Swim', duration: 75, intensity: 'easy', distance: 3, description: 'Long aerobic swim building volume' },
        { id: '2', type: 'bike', name: 'Long Bike', duration: 180, intensity: 'easy', distance: 80, description: 'Aerobic base ride, nutrition practice' },
        { id: '3', type: 'run', name: 'Easy Run', duration: 45, intensity: 'easy', distance: 6, description: 'Recovery run, focus on form' },
        { id: '4', type: 'swim', name: 'Swim Intervals', duration: 60, intensity: 'hard', distance: 2.5, description: 'Race pace intervals and technique' },
        { id: '5', type: 'bike', name: 'Bike Intervals', duration: 90, intensity: 'moderate', distance: 40, description: 'Threshold and tempo intervals' },
        { id: '6', type: 'run', name: 'Brick Run', duration: 30, intensity: 'moderate', distance: 4, description: 'Run off bike at race pace' },
        { id: '7', type: 'run', name: 'Long Run', duration: 150, intensity: 'easy', distance: 20, description: 'Progressive long run with nutrition' }
      ]
    ]
  }
];

const intensityColors = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
  'race-pace': 'bg-purple-100 text-purple-800'
};

const activityIcons = {
  run: '🏃',
  bike: '🚴',
  swim: '🏊',
  strength: '💪',
  rest: '😴',
  'cross-training': '🔄'
};

const TrainingPlan = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const currentPlan = trainingPlans.find(plan => plan.id === selectedPlan);
  const currentWeekStart = startOfWeek(new Date());

  const toggleActivityComplete = (activityId: string) => {
    const newCompleted = new Set(completedActivities);
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId);
    } else {
      newCompleted.add(activityId);
    }
    setCompletedActivities(newCompleted);
  };

  const getDayOfWeek = (dayIndex: number) => {
    return format(addDays(currentWeekStart, dayIndex), 'EEEE');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-semibold text-primary">Training Plans</h2>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select a training plan" />
          </SelectTrigger>
          <SelectContent>
            {trainingPlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                <div className="flex items-center gap-2">
                  <span>{plan.event}</span>
                  <Badge variant="secondary" className="text-xs">
                    {plan.difficulty}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingPlans.map(plan => (
            <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlan(plan.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.event}</CardTitle>
                  <Badge variant="outline">{plan.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.duration_weeks} weeks
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {plan.event}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentPlan?.name}
                    <Badge variant="outline">{currentPlan?.difficulty}</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">{currentPlan?.description}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedPlan('')}>
                  Change Plan
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs value="week" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="overview">Plan Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="week" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Week {currentWeek} Activities</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                    disabled={currentWeek === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentWeek(Math.min(currentPlan?.duration_weeks || 1, currentWeek + 1))}
                    disabled={currentWeek === (currentPlan?.duration_weeks || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {currentPlan?.weekly_activities[0]?.map((activity, index) => (
                  <Card key={activity.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          {getDayOfWeek(index)}
                        </div>
                        <div className="text-2xl">{activityIcons[activity.type]}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{activity.name}</h4>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {activity.duration > 0 ? `${activity.duration} min` : 'Rest'}
                          </div>
                          
                          {activity.distance && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {activity.distance} km
                            </div>
                          )}
                          
                          <Badge className={`text-xs ${intensityColors[activity.intensity]}`}>
                            {activity.intensity}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        
                        <Button
                          size="sm"
                          variant={completedActivities.has(activity.id) ? "default" : "outline"}
                          className="w-full mt-2"
                          onClick={() => toggleActivityComplete(activity.id)}
                        >
                          {completedActivities.has(activity.id) ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </div>
                          ) : (
                            'Mark Complete'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{currentPlan?.duration_weeks}</div>
                    <div className="text-sm text-muted-foreground">Weeks</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{currentPlan?.weekly_activities[0]?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Days per week</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary capitalize">{currentPlan?.difficulty}</div>
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Training Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This {currentPlan?.event} training plan is designed for {currentPlan?.difficulty} level athletes.
                      {currentPlan?.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                      {Array.from(new Set(currentPlan?.weekly_activities[0]?.map(a => a.type) || [])).map(type => (
                        <div key={type} className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{activityIcons[type]}</span>
                          <span className="capitalize">{type.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default TrainingPlan;