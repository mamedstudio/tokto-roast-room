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
Você é o moderador da mesa redonda Roast Room.
Analise criticamente a proposta e gere uma discussão com 7 falas encadeadas em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos: obsessão no cliente, balcão, atrito)
- "graham" (Paul Graham: startup inicial, fazer manual no começo)
- "hormozi" (Alex Hormozi: precificação, margem, oferta de alto valor)
- "gary" (Gary Vee: volume de conteúdo, atenção local, redes sociais)
- "dan" (Dan Martell: automação, tempo do fundador, processos)
- "gino" (Gino Wickman: execução, scorecard semanal, métricas práticas)
- "buffett" (Warren Buffett: margem de segurança, custo de tráfego vs lucro)

Responda ESTRITAMENTE com um array JSON válido (sem crases markdown, sem texto antes ou depois) no formato:
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

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Proposta: ${proposal}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Erro na API Groq" }, { status: res.status });
    }

    let content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    
    // Suporte caso o modelo devolva { "debate": [...] } ou diretamente a lista
    const debate = Array.isArray(parsed) ? parsed : (parsed.debate || parsed.falas || Object.values(parsed)[0] || []);

    return NextResponse.json({ debate });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: error.message || "Falha ao processar o debate." }, { status: 500 });
  }
}
