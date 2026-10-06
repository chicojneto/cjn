import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";

Deno.serve(async () => {
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return respond({ error: "sem LOVABLE_API_KEY" }, 500);
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: MODEL,
        input: "Diga apenas: funcionando",
        reasoning: { effort: "low" },
        store: false,
      }),
    });
    const text = await response.text();
    return respond({ status: response.status, body: text.slice(0, 1500) });
  } catch (error) {
    return respond({ ok: false, message: String(error).slice(0, 800) });
  }
});
