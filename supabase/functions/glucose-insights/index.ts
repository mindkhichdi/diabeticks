import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You help people with diabetes understand their own logged readings (HbA1c %, fasting and post-meal glucose in mg/dL).
Be warm, plain-spoken and brief. Never diagnose, never change or recommend medication doses. Describe patterns only from the data given.
Respond with ONLY a JSON object, no markdown fences:
{"summary": string (2-4 sentences), "trends": string[] (3-5 short bullet observations with dates/numbers), "questions": string[] (3-5 questions to ask their clinician)}`;

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

    const { data: rows, error } = await supabase
      .from("blood_sugar_readings")
      .select("date, hba1c, fasting, post_prandial")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .limit(200);
    if (error) throw error;
    if (!rows?.length) return json({ error: "Log a few readings first." }, 400);

    const lines = rows.map((r) =>
      [r.date, r.hba1c != null && `HbA1c ${r.hba1c}%`, r.fasting != null && `fasting ${r.fasting}`, r.post_prandial != null && `post-meal ${r.post_prandial}`]
        .filter(Boolean).join(", "));

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: `My readings (oldest first). Targets: fasting 80-130, post-meal under 180.\n${lines.join("\n")}`,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    const runId = upstream.headers.get("X-Lovable-AIG-Run-ID");
    const extra = runId ? { "X-Lovable-AIG-Run-ID": runId } : {};

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("gateway", upstream.status, t);
      const msg = upstream.status === 429 ? "Too many requests right now. Try again in a minute."
        : upstream.status === 402 ? "AI credits have run out. Add credits in Settings → Plans & credits."
        : "Couldn't generate insights right now.";
      return new Response(JSON.stringify({ error: msg }), { status: upstream.status, headers: { ...cors, ...extra, "Content-Type": "application/json" } });
    }

    const reader = upstream.body!.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", streamErr = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          else if (ev.type === "error" || ev.type === "response.failed") streamErr = ev.message ?? ev.response?.error?.message ?? "failed";
        } catch { /* partial */ }
      }
    }
    if (streamErr || !text.trim()) {
      console.error("stream", streamErr);
      return json({ error: "The AI didn't return insights. Please try again later." }, 502);
    }
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    return new Response(JSON.stringify(parsed), { headers: { ...cors, ...extra, "Content-Type": "application/json" } });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: cors });
    console.error(e);
    return json({ error: "Couldn't generate insights right now." }, 500);
  }
});
