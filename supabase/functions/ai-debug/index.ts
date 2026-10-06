import { createOpenAI } from "npm:@ai-sdk/openai";
import { jsonSchema, Output, streamText } from "npm:ai";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";

Deno.serve(async () => {
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return respond({ error: "sem LOVABLE_API_KEY" }, 500);
  try {
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const schema = jsonSchema<{ valor: string }>({
      type: "object",
      additionalProperties: false,
      properties: { valor: { type: "string" } },
      required: ["valor"],
    });
    const result = streamText({
      model: provider.responses(MODEL),
      output: Output.object({ schema }),
      system: "Responda sempre em português.",
      prompt: "Diga apenas: funcionando",
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const output = await result.output;
    return respond({ ok: true, output });
  } catch (error) {
    return respond({
      ok: false,
      name: (error as Error)?.name,
      message: String(error).slice(0, 800),
      stack: (error as Error)?.stack?.slice(0, 1200),
    });
  }
});
