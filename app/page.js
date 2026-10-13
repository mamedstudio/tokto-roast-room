'use client';
import { useState } from 'react';

const CONSELHEIROS = [
  { id: "bezos", nome: "Jeff Bezos", foto: "https://unavatar.io/twitter/JeffBezos?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Bezos", defaultVoto: "Sim" },
  { id: "graham", nome: "Paul Graham", foto: "https://unavatar.io/twitter/paulg?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Paul", defaultVoto: "Sim" },
  { id: "hormozi", nome: "Alex Hormozi", foto: "https://unavatar.io/twitter/AlexHormozi?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Hormozi", defaultVoto: "Sim" },
  { id: "gary", nome: "Gary Vee", foto: "https://unavatar.io/twitter/garyvee?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Gary", defaultVoto: "Sim" },
  { id: "dan", nome: "Dan Martell", foto: "https://unavatar.io/twitter/danmartell?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Dan", defaultVoto: "Alerta" },
  { id: "gino", nome: "Gino Wickman", foto: "https://unavatar.io/twitter/GinoWickman?fallback=https://api.dicebear.com/7.x/bottts/svg?seed=Gino", defaultVoto: "Sim" },
  { id: "buffett", nome: "Warren Buffett", foto: "https://api.dicebear.com/7.x/micah/svg?seed=Buffett", defaultVoto: "Sim" }
];

export default function RoastRoomPage() {
  const [proposal, setProposal] = useState("Tokto & CupomClic: marketplace local com cupons agressivos (15% embutidos), criador de 10k a 1% de comissão e calculadora de tráfego.");
  const [loading, setLoading] = useState(false);
  const [debate, setDebate] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);

  const iniciarDebate = async () => {
    if (!proposal.trim()) return;
    setLoading(true);
    try {
      // Chamada para a action server-side sem depender de rotas de pasta
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na resposta do servidor");
      
      if (data.debate && data.debate.length > 0) {
        setDebate(data.debate);
        setIndiceAtual(0);
      }
    } catch (err) {
      alert("Erro ao convocar mesa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const falaAtual = debate[indiceAtual] || null;
  const oradorAtual = falaAtual ? CONSELHEIROS.find(c => c.id === falaAtual.orador) : null;

  return (
    <div className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col font-sans select-none">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 text-white font-black px-2 py-0.5 rounded text-xs">CMS</div>
          <h1 className="text-sm font-bold">Roast Room <span className="text-slate-500 font-normal ml-2">Tokto & CupomClic</span></h1>
        </div>
        {debate.length > 0 && (
          <span className="text-xs bg-slate-900 border border-slate-800 text-sky-400 px-3 py-1 rounded font-mono">
            Vez {indiceAtual + 1} de {debate.length}
          </span>
        )}
      </header>

      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex gap-2">
        <input 
          type="text" 
          value={proposal} 
          onChange={(e) => setProposal(e.target.value)}
          placeholder="Descreva a ideia ou modelo de negócio..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
        />
        <button 
          onClick={iniciarDebate} 
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-lg transition"
        >
          {loading ? "Reunindo Conselho..." : "Convocar Mesa"}
        </button>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <section className="flex-1 flex flex-col p-6 justify-between relative border-r border-slate-800/80">
          
          <div className="relative py-12 flex items-center justify-center min-h-[260px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-800" fill="none" strokeWidth="1.5" strokeDasharray="4 4">
              <path d="M 120 160 Q 450 30 780 160" className="stroke-sky-900/30" />
            </svg>

            <div className="grid grid-cols-7 gap-2 md:gap-3 w-full max-w-4xl relative z-10">
              {CONSELHEIROS.map((c, i) => {
                const isActive = oradorAtual?.id === c.id;
                const offsetStyle = [
                  "translate-y-8", "translate-y-3.5", "translate-y-0.5", 
                  "translate-y-0", 
                  "translate-y-0.5", "translate-y-3.5", "translate-y-8"
                ][i];

                return (
                  <div 
                    key={c.id} 
                    className={`${offsetStyle} flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${
                      isActive 
                        ? 'border-sky-400 bg-slate-800 scale-105 shadow-[0_0_30px_rgba(56,189,248,0.5)] z-20' 
                        : 'border-slate-800 bg-slate-900/40 opacity-70'
                    }`}
                  >
                    <img 
                      src={c.foto} 
                      alt={c.nome} 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-slate-700 mb-2 bg-slate-800" 
                    />
                    <span className="text-[10px] md:text-xs font-bold text-slate-200 truncate w-full text-center">{c.nome}</span>
                    <span className={`text-[9px] font-semibold mt-0.5 ${c.defaultVoto === 'Sim' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {c.defaultVoto}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative shadow-2xl min-h-[140px] flex flex-col justify-between">
            {falaAtual ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sky-400 font-bold text-sm">{oradorAtual?.nome}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Pushes back on: {falaAtual.alvo}
                  </span>
                </div>
                <p className="text-sm md:text-base text-slate-200 leading-relaxed italic">
                  "{falaAtual.texto}"
                </p>
              </div>
            ) : (
              <div className="text-slate-500 text-sm italic text-center py-6">
                Clique em "Convocar Mesa" para iniciar o debate com a IA.
              </div>
            )}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                {debate.length > 0 ? `Turno ${indiceAtual + 1} de ${debate.length}` : 'Aguardando início'}
              </span>
              <button 
                onClick={() => setIndiceAtual((prev) => (prev + 1) % debate.length)}
                disabled={debate.length === 0}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold px-4 py-1.5 rounded transition"
              >
                Avançar Fala →
              </button>
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-72 bg-slate-950/80 p-4 overflow-y-auto border-t lg:border-t-0 border-slate-800 text-xs">
          <h2 className="font-bold uppercase tracking-wider text-slate-500 mb-3 text-[10px]">Pontos-Chave (Key Points)</h2>
          <div className="space-y-2">
            {debate.slice(0, indiceAtual + 1).map((d, idx) => {
              const adv = CONSELHEIROS.find(c => c.id === d.orador);
              return (
                <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-0.5">{adv?.nome}</span>
                  <span className="text-slate-300 text-[11px] leading-tight block">{d.resumo}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}
