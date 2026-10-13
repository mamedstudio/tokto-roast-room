import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal) {
      return NextResponse.json({ error: "Proposta não enviada." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

    if (!apiKey) {
      return NextResponse.json({ error: "Chave GEMINI_API_KEY não configurada na Vercel." }, { status: 500 });
    }

    const systemPrompt = `
Você é o moderador da mesa redonda Roast Room.
Analise criticamente a seguinte proposta de negócio:
"${proposal}"

Gere uma discussão de 7 falas encadeadas em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos)
- "graham" (Paul Graham)
- "hormozi" (Alex Hormozi)
- "gary" (Gary Vee)
- "dan" (Dan Martell)
- "gino" (Gino Wickman)
- "buffett" (Warren Buffett)

Responda ESTRITAMENTE com um array JSON válido (sem qualquer texto antes ou depois, sem crases markdown) neste formato:
[
  {
    "orador": "hormozi",
    "alvo": "Proposta Geral",
    "texto": "Texto curto da fala.",
    "resumo": "Resumo de 1 frase para o painel lateral.",
    "voto": "Sim"
  }
]
`;

    // Lista de modelos ordenados por prioridade para contornar picos de procura (503)
    const modelos = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelos) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const data = await res.json();

        if (res.ok) {
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
          rawText = rawText.trim();
          if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
          if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

          const debate = JSON.parse(rawText);
          return NextResponse.json({ debate });
        } else {
          lastError = data.error?.message || `Erro no modelo ${modelName}`;
          // Se for erro de quota/alta procura (503), avança para a próxima tentativa no ciclo
          if (res.status === 503 || res.status === 429) {
            continue;
          } else {
            return NextResponse.json({ error: lastError }, { status: res.status });
          }
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return NextResponse.json({ error: `Serviço temporariamente ocupado: ${lastError}` }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
