
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthKitData {
  workouts: {
    startDate: string;
    endDate: string;
    activityType: string;
    duration: number;
    activeEnergyBurned: number;
    distance?: number;
    stepCount?: number;
    heartRateAvg?: number;
    heartRateMax?: number;
    elevationAscended?: number;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // For Android Fit data
    if (req.headers.get('x-source') === 'android') {
      const body = await req.json() as any;
      console.log('Received Android Fit data:', body);
      
      // Process Android Fit data and format it to match our schema
      // Will implement based on Google Fit API response format
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // For Apple HealthKit data
    const healthData = await req.json() as HealthKitData;
    console.log('Received HealthKit data:', healthData);

    // Extract user ID from auth header
    const token = authHeader.replace('Bearer ', '')
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
      },
    })
    const userData = await response.json()
    const userId = userData.id

    // Process each workout and insert into the database
    const workouts = healthData.workouts.map(workout => ({
      user_id: userId,
      activity_type: workout.activityType.toLowerCase(),
      duration_minutes: Math.round(workout.duration / 60),
      calories_burned: Math.round(workout.activeEnergyBurned),
      steps: workout.stepCount,
      distance_km: workout.distance,
      date: workout.startDate.split('T')[0],
      device_source: 'Apple Health',
      heart_rate_avg: workout.heartRateAvg,
      heart_rate_max: workout.heartRateMax,
      elevation_gain: workout.elevationAscended,
      device_sync_id: `apple_health_${workout.startDate}`,
    }))

    // Insert workouts into the database
    const { error: insertError } = await supabaseClient
      .from('fitness_logs')
      .upsert(workouts, { 
        onConflict: 'device_sync_id',
        ignoreDuplicates: true 
      })

    if (insertError) {
      console.error('Error inserting workouts:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, workouts_synced: workouts.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
