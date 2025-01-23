import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const formData = await req.formData()
    const image = formData.get('image')

    if (!image) {
      throw new Error('No image provided')
    }

    console.log('Received image, sending to OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and extract the following information in JSON format: food_item (name of the food), calories (numeric), proteins (in g), carbs (in g), and fats (in g). Return ONLY the JSON object with these 5 values, nothing else.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${await image.text()}`,
                },
              },
            ],
          },
        ],
      }),
    })

    console.log('Received response from OpenAI')

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    console.log('OpenAI response data:', data)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response format:', data)
      throw new Error('Invalid response format from OpenAI')
    }

    const content = data.choices[0].message.content
    console.log('Extracted content:', content)

    let nutritionInfo
    try {
      nutritionInfo = JSON.parse(content)
    } catch (error) {
      console.error('Error parsing OpenAI response as JSON:', error)
      console.error('Raw content:', content)
      throw new Error('Failed to parse nutrition information from OpenAI response')
    }

    // Validate the required fields
    const requiredFields = ['food_item', 'calories', 'proteins', 'carbs', 'fats']
    for (const field of requiredFields) {
      if (!(field in nutritionInfo)) {
        console.error('Missing required field in nutrition info:', field)
        console.error('Received nutrition info:', nutritionInfo)
        throw new Error(`Missing required field: ${field}`)
      }
    }

    return new Response(
      JSON.stringify(nutritionInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-food-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})