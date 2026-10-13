import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal || !proposal.trim()) {
      return NextResponse.json({ error: "Proposta não enviada." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;

    if (!apiKey) {
      return NextResponse.json({ error: "Chave GROQ_API_KEY não configurada na Vercel." }, { status: 500 });
    }

    const systemPrompt = `Você é o moderador de uma mesa redonda corporativa (Roast Room).
Analise a seguinte proposta de negócio de forma afiada, realista e profunda:
"${proposal}"

Gere uma discussão de 7 falas encadeadas em tom perspicaz em PORTUGUÊS (Brasil) com os conselheiros:
- "bezos" (Jeff Bezos: obsessão no cliente, balcão, atrito)
- "graham" (Paul Graham: startup inicial, fazer manual no começo)
- "hormozi" (Alex Hormozi: precificação, margem, oferta de alto valor)
- "gary" (Gary Vee: volume de conteúdo, atenção local, redes sociais)
- "dan" (Dan Martell: automação, tempo do fundador, processos)
- "gino" (Gino Wickman: execução, scorecard semanal, métricas práticas)
- "buffett" (Warren Buffett: margem de segurança, custo de tráfego vs lucro)

Responda ESTRITAMENTE em formato JSON com o seguinte formato:
{
  "debate": [
    {
      "orador": "hormozi",
      "alvo": "Proposta Geral",
      "texto": "Fala incisiva do conselheiro em até 3 frases.",
      "resumo": "Resumo de 1 frase para o painel lateral.",
      "voto": "Sim"
    }
  ]
}`;

    // Lista de modelos suportados pela Groq em ordem de preferência
    const modelosPossiveis = [
      "llama-3.3-70b-versatile",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768"
    ];

    let resposta = null;
    let ultimoErro = null;

    for (const model of modelosPossiveis) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Analise criticamente:\n${proposal}` }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();

        if (res.ok) {
          resposta = data;
          break; // Sucesso, sai do loop
        } else {
          ultimoErro = data.error?.message || `Erro no modelo ${model}`;
          // Se for erro de modelo inexistente, tenta o próximo da lista
          if (res.status === 404 || (data.error?.message && data.error.message.includes("does not exist"))) {
            continue;
          } else {
            return NextResponse.json({ error: ultimoErro }, { status: res.status });
          }
        }
      } catch (err) {
        ultimoErro = err.message;
      }
    }

    if (!resposta) {
      return NextResponse.json({ error: `Nenhum modelo da Groq respondeu: ${ultimoErro}` }, { status: 500 });
    }

    const content = resposta.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const debate = parsed.debate || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) || [];

    return NextResponse.json({ debate });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento da IA." }, { status: 500 });
  }
}
