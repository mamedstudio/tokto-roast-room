import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal) {
      return NextResponse.json({ error: "Proposta não enviada." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    
    if (!apiKey) {
      return NextResponse.json({ error: "A variável GEMINI_API_KEY não foi encontrada na Vercel." }, { status: 500 });
    }

    const promptText = `
Você é o moderador da mesa redonda Roast Room.
Analise a seguinte proposta de negócio:
"${proposal}"

Gere uma discussão de 7 falas encadeadas em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos)
- "graham" (Paul Graham)
- "hormozi" (Alex Hormozi)
- "gary" (Gary Vee)
- "dan" (Dan Martell)
- "gino" (Gino Wickman)
- "buffett" (Warren Buffett)

Devolva APENAS uma matriz JSON válida (sem markdown, sem blocos de texto) exatamente neste formato:
[
  {
    "orador": "hormozi",
    "alvo": "Proposta Geral",
    "texto": "Texto curto da fala.",
    "resumo": "Resumo de 1 frase.",
    "voto": "Sim"
  }
]
`;

    // Chamada direta via REST API à versão v1beta oficial
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Erro devolvido pela Google API:", geminiData);
      return NextResponse.json({ 
        error: geminiData.error?.message || "Erro na API do Gemini" 
      }, { status: geminiRes.status });
    }

    let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    rawText = rawText.trim();
    if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
    if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

    const debate = JSON.parse(rawText);
    return NextResponse.json({ debate });

  } catch (error) {
    console.error("Erro interno no backend:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
