import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `You are reading a medical prescription (one or more page images). Extract every medicine prescribed.
Respond with ONLY a JSON object, no markdown:
{"medicines": [{"name": string, "dosage": string (strength/amount per dose, e.g. "500 mg", "1 tablet"; "" if unclear), "schedule": string (the instructions as written, e.g. "twice daily after meals"; "" if none), "times": string[] (24h "HH:mm" clock times of each daily dose), "notes": string (other instructions, e.g. duration; "" if none)}]}
Rules for "times": morning 08:00, afternoon 14:00, evening 18:00, night/bedtime 21:00. With meals: breakfast 08:00, lunch 13:00, dinner 20:00. Patterns like 1-0-1 mean morning and night (08:00, 20:00); 1-1-1 means 08:00, 14:00, 20:00. "Once daily" with no time is 08:00. "As needed"/SOS gives an empty list.
Only include what is legible on the page. Never invent medicines. If the image is not a prescription or nothing is legible, respond {"error": "not_prescription"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const { images } = await req.json().catch(() => ({}));
    const valid = Array.isArray(images) && images.length > 0 && images.length <= 4 &&
      images.every((i) => typeof i === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(i) && i.length < 8_000_000);
    if (!valid) return json({ error: "Please upload a clear photo of your prescription." }, 400);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: PROMPT },
            ...images.map((image_url: string) => ({ type: "input_image", image_url })),
          ],
        }],
        store: false,
        reasoning: { effort: "low" },
      }),
    });

    if (!upstream.ok) {
      console.error("gateway", upstream.status, await upstream.text());
      const msg = upstream.status === 429 ? "Too many requests right now. Try again in a minute."
        : upstream.status === 402 ? "AI credits have run out."
        : "Couldn't read that prescription right now.";
      return json({ error: msg }, upstream.status);
    }

    const data = await upstream.json();
    const text: string = data.output_text ?? (data.output ?? [])
      .flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "Couldn't read that prescription. Try a clearer photo." }, 502);
    const r = JSON.parse(m[0]);
    if (r.error) return json({ error: "That doesn't look like a prescription." }, 422);

    const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
    const medicines = (Array.isArray(r.medicines) ? r.medicines : []).slice(0, 20)
      .map((x: any) => ({
        name: str(x.name, 120),
        dosage: str(x.dosage, 60),
        schedule: str(x.schedule, 120),
        times: (Array.isArray(x.times) ? x.times : [])
          .map((t: unknown) => String(t))
          .filter((t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))
          .slice(0, 6),
        notes: str(x.notes, 200),
      }))
      .filter((x: any) => x.name);
    return json({ medicines });
  } catch (e) {
    console.error(e);
    return json({ error: "Couldn't read that prescription right now." }, 500);
  }
});
