import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal) {
      return NextResponse.json({ error: "Proposta não enviada." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const systemPrompt = `
Você é o moderador de uma mesa redonda corporativa chamada Roast Room.
Existem 7 conselheiros na mesa:
1. "bezos" (Jeff Bezos - obsessão pelo cliente, eliminação de atrito, flywheel)
2. "graham" (Paul Graham - startup raiz, tração, fazer coisas manuais que não escalam)
3. "hormozi" (Alex Hormozi - oferta irresistível, precificação, CAC/LTV, incentivos)
4. "gary" (Gary Vee - atenção orgânica, redes sociais, criadores, urgência de volume)
5. "dan" (Dan Martell - processos, automação, não ser gargalo da operação)
6. "gino" (Gino Wickman - EOS, execução disciplinada, scorecard, número vital semanal)
7. "buffett" (Warren Buffett - fosso defensivo, margem de segurança, saúde do fluxo de caixa)

Analise a proposta enviada pelo fundador e gere exatamente uma discussão em 7 rodadas encadeadas em PORTUGUÊS (Brasil).
Cada rodada deve ser um objeto JSON com:
- "orador": o id do conselheiro (bezos, graham, hormozi, gary, dan, gino ou buffett)
- "alvo": quem ele está rebatendo ou confrontando (ex: "Alex Hormozi", "Paul Graham" ou "Proposta Geral")
- "texto": a fala direta dele em tom provocativo, perspicaz e com a personalidade característica dele (máximo 3 frases)
- "resumo": resumo de 1 linha para o painel lateral
- "voto": "Sim" ou "Alerta"

Retorne EXCLUSIVAMENTE um array JSON válido sem blocos de markdown. Exemplo:
[
  { "orador": "hormozi", "alvo": "Proposta Geral", "texto": "...", "resumo": "...", "voto": "Sim" }
]
`;

    const result = await model.generateContent(
      `${systemPrompt}\n\nProposta do fundador para dissecar:\n${proposal}`
    );

    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    return NextResponse.json({ debate: data });

  } catch (error) {
    console.error("Erro na API Roast:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
