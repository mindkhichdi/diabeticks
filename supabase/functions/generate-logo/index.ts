import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!token) {
      console.error('HUGGING_FACE_ACCESS_TOKEN not set')
      throw new Error('HUGGING_FACE_ACCESS_TOKEN not set')
    }

    console.log('Initializing Hugging Face client...')
    const hf = new HfInference(token)
    
    console.log('Generating logo with prompt...')
    const prompt = "A modern, minimalist logo for a diabetes tracking app called Diabeticks. The logo should be simple and clean, combining a medical cross with a water droplet shape. Use soft purple colors. Flat design style, vector art look. White background."

    const image = await hf.textToImage({
      inputs: prompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    })

    console.log('Image generated successfully, converting to base64...')
    const arrayBuffer = await image.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log('Returning generated logo...')
    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${base64}` }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in generate-logo function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate logo', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})