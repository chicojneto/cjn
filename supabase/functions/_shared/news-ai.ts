import { createOpenAI } from "npm:@ai-sdk/openai";
import { jsonSchema, NoObjectGeneratedError, Output, streamText } from "npm:ai";
import { createRunIdFetch } from "./ai-run-id.ts";

const MODEL = "openai/gpt-6-astra";
const ALLOWED_ASSETS = ["NASDAQ", "SP500", "DOW", "XAUUSD", "EURUSD", "USDJPY", "MACRO"] as const;

type Classification = {
  titulo_pt: string;
  resumo: string;
  ativos: string[];
  relevancia: number;
};

const classificationSchema = jsonSchema<Classification>({
  type: "object",
  additionalProperties: false,
  properties: {
    titulo_pt: { type: "string" },
    resumo: { type: "string" },
    ativos: { type: "array", items: { type: "string", enum: [...ALLOWED_ASSETS] } },
    relevancia: { type: "integer", enum: [0, 1, 2, 3] },
  },
  required: ["titulo_pt", "resumo", "ativos", "relevancia"],
});

export async function classifyNews(input: { title: string; description: string }, apiKey: string, signal: AbortSignal) {
  const runIdFetch = createRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    abortSignal: signal,
    output: Output.object({ schema: classificationSchema }),
    system: "Você é editor de notícias para day traders. Produza conteúdo factual, conciso e em português do Brasil. Nunca invente fatos além do título e da descrição recebidos.",
    prompt: `Classifique esta notícia. Traduza o título se necessário. Escreva resumo próprio com no máximo 2 frases, sem copiar frases da descrição. Ativos permitidos: ${ALLOWED_ASSETS.join(", ")}. Relevância: 3 move mercado agora (payroll, CPI, Fed, guerra, choque de petróleo); 2 contexto importante (BC, dados secundários, big techs); 1 pano de fundo; 0 irrelevante (loteria, política local sem efeito, compra de ações por executivo, celebridade).\n\nTítulo: ${input.title}\nDescrição curta: ${input.description}`,
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

  try {
    const output = await result.output;
    return {
      titulo_pt: output.titulo_pt.trim().slice(0, 500),
      resumo: output.resumo.trim().slice(0, 1000),
      ativos: output.ativos.filter((asset) => ALLOWED_ASSETS.includes(asset as typeof ALLOWED_ASSETS[number])),
      relevancia: Math.max(0, Math.min(3, Math.round(output.relevancia))),
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error(`Resposta estruturada inválida: ${error.text.slice(0, 200)}`);
    }
    throw error;
  }
}
