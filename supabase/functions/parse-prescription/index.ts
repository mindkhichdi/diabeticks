import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prescriptionId, imageUrl } = await req.json()

    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use GPT-4 Vision to analyze the prescription
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this prescription and extract the following information in JSON format: medicine name, dosage, and schedule. Only include these fields in your response.",
            },
            {
              type: "image_url",
              image_url: imageUrl,
            },
          ],
        },
      ],
    })

    const parsedData = JSON.parse(completion.data.choices[0].message.content)

    // Update the prescription record with the parsed data
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({
        medicine_name: parsedData.medicine_name,
        dosage: parsedData.dosage,
        schedule: parsedData.schedule,
      })
      .eq('id', prescriptionId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})