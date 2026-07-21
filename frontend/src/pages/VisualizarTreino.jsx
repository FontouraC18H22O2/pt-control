import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function VisualizarTreino() {
  const { studentId } = useParams();
  const [studentName, setStudentName] = useState('');
  const [planos, setPlanos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const resolverGifUrl = (gifUrl) => {
    if (!gifUrl) return null;
    if (gifUrl.startsWith('http://') || gifUrl.startsWith('https://')) return gifUrl;
    return `${BACKEND_URL}${gifUrl}`;
  };

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const [resTreinos, resAvaliacoes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/training/public/student/${studentId}`),
          axios.get(`${BACKEND_URL}/api/assessments/public/student/${studentId}`)
        ]);
        setStudentName(resTreinos.data.studentName || 'Atleta');
        setPlanos(resTreinos.data.planos || []);
        setAvaliacoes(resAvaliacoes.data || []);
        if (resTreinos.data.planos?.length > 0) {
          setAbaAtiva(resTreinos.data.planos[0].dayNumber ?? 1);
        } else {
          setAbaAtiva('avaliacao');
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o teu plano de treino. Confirme o link enviado pelo teu treinador.');
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 text-white bg-neutral-950">
        <div className="w-10 h-10 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium text-neutral-400">A preparar a tua rotina de treino...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-white bg-neutral-950">
        <div className="w-full max-w-md p-6 text-center border border-red-900 bg-red-950/20 rounded-2xl">
          <p className="text-sm font-semibold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const planoAtivo = planos.find(p => p.dayNumber === abaAtiva);

  return (
    <div className="min-h-screen text-white bg-neutral-950 bg-gradient-to-br from-neutral-950 via-red-950/10 to-neutral-950 relative before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.04)_48%,rgba(220,38,38,0.08)_50%,rgba(220,38,38,0.04)_52%,transparent_55%)] before:pointer-events-none">
      {/* Cabeçalho */}
      <div className="p-4 border-b md:p-6 bg-neutral-900 border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-black tracking-widest text-red-500 uppercase">PT Control</span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
            Olá, {studentName}! 💪
          </h1>
          <p className="mt-1 text-sm text-neutral-400">Aqui tens o teu plano de treino completo.</p>
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="sticky top-0 z-10 border-b bg-neutral-900/95 backdrop-blur border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-none">
            {planos.map(plano => (
              <button
                key={plano.id}
                onClick={() => setAbaAtiva(plano.dayNumber)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  abaAtiva === plano.dayNumber
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-600'
                }`}
              >
                {plano.name || `Dia ${plano.dayNumber}`}
              </button>
            ))}
            {/* Aba de Avaliação Física (placeholder) */}
            <button
              onClick={() => setAbaAtiva('avaliacao')}
              className={`flex-shrink-0 px-5 py-3.5 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                abaAtiva === 'avaliacao'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-600'
              }`}
            >
              📊 Avaliação Física
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="max-w-4xl p-4 mx-auto space-y-4 md:p-6">

        {/* Aba de treino */}
        {abaAtiva !== 'avaliacao' && planoAtivo && (
          <>
            {planoAtivo.notes && (
              <div className="p-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
                <p className="text-xs font-bold tracking-wider uppercase text-neutral-400">Recomendações do Treinador:</p>
                <p className="mt-1 text-sm italic text-neutral-300">"{planoAtivo.notes}"</p>
              </div>
            )}

            {planoAtivo.exercises.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl">
                <p className="text-sm text-neutral-500">Nenhum exercício neste dia ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {planoAtivo.exercises.map((ex, index) => (
                  <div
                    key={ex.id || index}
                    className="flex flex-col overflow-hidden transition-colors border md:flex-row border-neutral-800 bg-neutral-900 rounded-2xl group hover:border-neutral-700"
                  >
                    {/* GIF */}
                    <div className="flex items-center justify-center w-full overflow-hidden border-b md:w-56 aspect-video md:aspect-square bg-neutral-950 md:border-b-0 md:border-r border-neutral-800">
                      {ex.gifUrl ? (
                        <img
                          src={resolverGifUrl(ex.gifUrl)}
                          alt={ex.exerciseName}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/400x400/171717/a3a3a3?text=Sem+GIF';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-neutral-600">
                          <span className="text-3xl">🏋️‍♂️</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Sem Demonstração</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between flex-1 p-5 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black bg-neutral-950 px-2 py-1 border border-neutral-800 rounded-md text-red-500 uppercase tracking-wider">
                          Exercício {index + 1}
                        </span>
                        <h3 className="pt-1 text-lg font-bold text-neutral-100 group-hover:text-red-500">
                          {ex.exerciseName}
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 text-center border bg-neutral-950/60 rounded-xl border-neutral-800/50">
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-500 uppercase">Séries</span>
                          <span className="text-sm font-black text-white">{ex.sets}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-500 uppercase">Reps</span>
                          <span className="text-sm font-black text-white">{ex.reps}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-500 uppercase">Descanso</span>
                          <span className="text-sm font-black text-red-400">{ex.restTime}</span>
                        </div>
                      </div>

                      {ex.notes && (
                        <div className="p-3 border bg-neutral-950/30 border-neutral-800/40 rounded-xl">
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nota de execução:</span>
                          <p className="text-xs italic text-neutral-300">"{ex.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Aba sem plano (dia novo ainda sem exercícios) */}
        {abaAtiva !== 'avaliacao' && !planoAtivo && (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-sm text-neutral-500">Nenhum plano disponível.</p>
          </div>
        )}

        {/* Aba de Avaliação Física */}
        {abaAtiva === 'avaliacao' && (
          <div className="space-y-4">
            {avaliacoes.length === 0 ? (
              <div className="p-10 space-y-3 text-center border border-dashed border-neutral-800 rounded-2xl">
                <span className="text-4xl">📊</span>
                <h3 className="text-lg font-bold text-white">Avaliação Física</h3>
                <p className="text-sm text-neutral-500">A tua avaliação física será disponibilizada aqui em breve pelo teu treinador.</p>
              </div>
            ) : (
              avaliacoes.map((av, idx) => (
                <div key={av.id} className="p-5 space-y-6 border bg-neutral-900 border-neutral-800 rounded-2xl">
                  {/* Cabeçalho */}
                  <div className="pb-3 border-b border-neutral-800">
                    <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">
                      {idx === 0 ? '📊 Avaliação Mais Recente' : '📊 Avaliação Anterior'}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      {new Date(av.assessmentDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>

                  {/* Corpo principal: silhueta + métricas */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                    {/* Silhueta SVG com medidas */}
                    <div className="flex flex-col items-center gap-3">
                      <svg viewBox="0 0 200 420" className="w-full max-w-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="100" cy="35" rx="22" ry="26" fill="#262626" stroke="#404040" strokeWidth="1.5"/>
                        <rect x="91" y="58" width="18" height="14" rx="4" fill="#262626" stroke="#404040" strokeWidth="1.5"/>
                        <path d="M65 72 Q60 90 58 130 Q56 160 62 190 L138 190 Q144 160 142 130 Q140 90 135 72 Z" fill="#262626" stroke="#404040" strokeWidth="1.5"/>
                        <path d="M65 80 Q45 100 40 140 Q38 160 42 175" stroke="#404040" strokeWidth="12" strokeLinecap="round" fill="none"/>
                        <path d="M135 80 Q155 100 160 140 Q162 160 158 175" stroke="#404040" strokeWidth="12" strokeLinecap="round" fill="none"/>
                        <path d="M85 190 Q80 230 78 270 Q76 310 78 350 Q79 365 84 375" stroke="#404040" strokeWidth="14" strokeLinecap="round" fill="none"/>
                        <path d="M115 190 Q120 230 122 270 Q124 310 122 350 Q121 365 116 375" stroke="#404040" strokeWidth="14" strokeLinecap="round" fill="none"/>
                        {/* Tórax */}
                        <circle cx="100" cy="105" r="5" fill="#ef4444"/>
                        <text x="108" y="102" fontSize="8" fill="#ef4444" fontWeight="bold">Tórax</text>
                        <text x="108" y="112" fontSize="8" fill="#ef4444">{av.torax ? `${av.torax}cm` : '—'}</text>
                        {/* Cintura */}
                        <circle cx="100" cy="140" r="5" fill="#f97316"/>
                        <text x="108" y="137" fontSize="8" fill="#f97316" fontWeight="bold">Cintura</text>
                        <text x="108" y="147" fontSize="8" fill="#f97316">{av.cintura ? `${av.cintura}cm` : '—'}</text>
                        {/* Abdómen */}
                        <circle cx="100" cy="162" r="5" fill="#eab308"/>
                        <text x="108" y="159" fontSize="8" fill="#eab308" fontWeight="bold">Abdómen</text>
                        <text x="108" y="169" fontSize="8" fill="#eab308">{av.abdomen ? `${av.abdomen}cm` : '—'}</text>
                        {/* Quadril */}
                        <circle cx="100" cy="183" r="5" fill="#22c55e"/>
                        <text x="108" y="180" fontSize="8" fill="#22c55e" fontWeight="bold">Quadril</text>
                        <text x="108" y="190" fontSize="8" fill="#22c55e">{av.quadril ? `${av.quadril}cm` : '—'}</text>
                        {/* Braço D */}
                        <circle cx="44" cy="125" r="5" fill="#3b82f6"/>
                        <text x="2" y="118" fontSize="7.5" fill="#3b82f6" fontWeight="bold">B.Dir</text>
                        <text x="2" y="128" fontSize="7.5" fill="#3b82f6">{av.bracoDireitoCm ? `${av.bracoDireitoCm}cm` : '—'}</text>
                        {/* Braço E */}
                        <circle cx="156" cy="125" r="5" fill="#8b5cf6"/>
                        <text x="162" y="118" fontSize="7.5" fill="#8b5cf6" fontWeight="bold">B.Esq</text>
                        <text x="162" y="128" fontSize="7.5" fill="#8b5cf6">{av.bracoEsquerdoCm ? `${av.bracoEsquerdoCm}cm` : '—'}</text>
                        {/* Perna D */}
                        <circle cx="80" cy="275" r="5" fill="#06b6d4"/>
                        <text x="20" y="268" fontSize="7.5" fill="#06b6d4" fontWeight="bold">P.Dir</text>
                        <text x="20" y="278" fontSize="7.5" fill="#06b6d4">{av.pernaDireitaCm ? `${av.pernaDireitaCm}cm` : '—'}</text>
                        {/* Perna E */}
                        <circle cx="120" cy="275" r="5" fill="#ec4899"/>
                        <text x="126" y="268" fontSize="7.5" fill="#ec4899" fontWeight="bold">P.Esq</text>
                        <text x="126" y="278" fontSize="7.5" fill="#ec4899">{av.pernaEsquerdaCm ? `${av.pernaEsquerdaCm}cm` : '—'}</text>
                      </svg>

                      {/* Métricas base */}
                      <div className="grid w-full grid-cols-3 gap-2">
                        {[['Peso', av.peso, 'kg'], ['Altura', av.altura, 'cm'], ['IMC', av.imc, '']].map(([l, v, u]) => (
                          <div key={l} className="p-3 text-center border bg-neutral-950 border-neutral-800 rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{l}</p>
                            <p className="text-base font-black text-white">{v ?? '—'}{v && u ? ` ${u}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dados detalhados */}
                    <div className="space-y-3">
                      {/* Composição corporal */}
                      <div className="p-4 border bg-neutral-950 border-neutral-800 rounded-xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">🧬 Composição Corporal</p>
                        <div className="space-y-2">
                          {[['% Massa Gorda', av.pctMassaGorda, '%'], ['% Água', av.pctAgua, '%'], ['Massa Muscular', av.kgMassaMuscular, 'kg'], ['Gordura Visceral', av.gorduraVisceral, ''], ['TMB', av.tmb, 'kcal'], ['Idade Metabólica', av.idadeMetabolica, 'anos']].map(([l, v, u]) => (
                            <div key={l} className="flex items-center justify-between">
                              <span className="text-xs text-neutral-400">{l}</span>
                              <span className="text-xs font-bold text-white">{v !== null && v !== undefined ? `${v}${u ? ` ${u}` : ''}` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Membros detalhados */}
                      <div className="p-4 border bg-neutral-950 border-neutral-800 rounded-xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">💪 Medidas dos Membros</p>
                        <div className="space-y-3">
                          {[
                            { label: 'Braço Direito', cm: av.bracoDireitoCm, pct: av.bracoDireitoPct, kg: av.bracoDireitoKg, color: 'text-blue-400' },
                            { label: 'Braço Esquerdo', cm: av.bracoEsquerdoCm, pct: av.bracoEsquerdoPct, kg: av.bracoEsquerdoKg, color: 'text-purple-400' },
                            { label: 'Perna Direita', cm: av.pernaDireitaCm, pct: av.pernaDireitaPct, kg: av.pernaDireitaKg, color: 'text-cyan-400' },
                            { label: 'Perna Esquerda', cm: av.pernaEsquerdaCm, pct: av.pernaEsquerdaPct, kg: av.pernaEsquerdaKg, color: 'text-pink-400' },
                          ].map(m => (
                            <div key={m.label}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${m.color}`}>{m.label}</p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[['cm', m.cm], ['%', m.pct], ['kg', m.kg]].map(([u, v]) => (
                                  <div key={u} className="p-1.5 text-center border bg-neutral-900 border-neutral-800 rounded-lg">
                                    <p className="text-[9px] text-neutral-500 uppercase">{u}</p>
                                    <p className="text-xs font-bold text-white">{v ?? '—'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Objetivos */}
                      {av.objetivos && (
                        <div className="p-4 border bg-neutral-950 border-neutral-800 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">🎯 Objetivos</p>
                          <p className="text-sm text-neutral-300">{av.objetivos}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}