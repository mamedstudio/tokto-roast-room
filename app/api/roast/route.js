import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal) {
      return NextResponse.json({ error: "Proposta não enviada." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;

    if (!apiKey) {
      return NextResponse.json({ error: "Chave GROQ_API_KEY não configurada na Vercel." }, { status: 500 });
    }

    const systemPrompt = `
Você é o moderador da mesa redonda corporativa Roast Room.
Analise a proposta e gere uma discussão de 7 falas em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos: obsessão no cliente, balcão, atrito)
- "graham" (Paul Graham: startup inicial, fazer manual no começo)
- "hormozi" (Alex Hormozi: precificação, margem, oferta de alto valor)
- "gary" (Gary Vee: volume de conteúdo, atenção local, redes sociais)
- "dan" (Dan Martell: automação, tempo do fundador, processos)
- "gino" (Gino Wickman: execução, scorecard semanal, métricas práticas)
- "buffett" (Warren Buffett: margem de segurança, custo de tráfego vs lucro)

Responda OBRIGATORIAMENTE com um objeto JSON no seguinte formato:
{
  "debate": [
    {
      "orador": "hormozi",
      "alvo": "Proposta Geral",
      "texto": "Fala incisiva e curta aqui.",
      "resumo": "Resumo de 1 frase para o painel lateral.",
      "voto": "Sim"
    }
  ]
}
`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Proposta a dissecar:\n${proposal}` }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ 
        error: data.error?.message || "Erro na API Groq" 
      }, { status: res.status });
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const debate = parsed.debate || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) || [];

    return NextResponse.json({ debate });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar o debate." }, { status: 500 });
  }
}
