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
Analise criticamente a seguinte proposta:
"${proposal}"

Gere uma discussão de 7 falas encadeadas em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos: obsessão no cliente, balcão, atrito)
- "graham" (Paul Graham: startup inicial, fazer manual no começo)
- "hormozi" (Alex Hormozi: precificação, margem, oferta de alto valor)
- "gary" (Gary Vee: volume de conteúdo, atenção local, redes sociais)
- "dan" (Dan Martell: automação, tempo do fundador, processos)
- "gino" (Gino Wickman: execução, scorecard semanal, métricas práticas)
- "buffett" (Warren Buffett: margem de segurança, custo de tráfego vs lucro)

Responda ESTRITAMENTE com um array JSON válido (sem texto antes ou depois, sem crases markdown) neste formato:
[
  {
    "orador": "hormozi",
    "alvo": "Proposta Geral",
    "texto": "Fala curta e incisiva aqui.",
    "resumo": "Resumo de 1 frase para o painel lateral.",
    "voto": "Sim"
  }
]
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Erro na API Gemini" }, { status: res.status });
    }

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    rawText = rawText.trim();
    if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
    if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

    const debate = JSON.parse(rawText);
    return NextResponse.json({ debate });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
