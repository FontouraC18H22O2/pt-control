import React, { useState, useEffect, useRef } from 'react';
import templateService from '../services/templateService';
import trainingService from '../services/trainingService';

const exercicioVazio = () => ({ exerciseName: '', sets: '4', reps: '10', restTime: '60s', notes: '' });
const diaVazio = (num) => ({ dayNumber: num, exercises: [exercicioVazio()] });

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [templatesFiltrados, setTemplatesFiltrados] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dias, setDias] = useState([diaVazio(1)]);
  const [diaAtivo, setDiaAtivo] = useState(1);
  const [loadingForm, setLoadingForm] = useState(false);

  // Biblioteca para autocomplete
  const [biblioteca, setBiblioteca] = useState([]);
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(null);
  const dropdownRefs = useRef({});

  // Confirmar apagar
  const [confirmarApagar, setConfirmarApagar] = useState(null);

  useEffect(() => {
    carregarTemplates();
    trainingService.getAllExercises().then(setBiblioteca).catch(() => {});
  }, []);

  // Filtro de pesquisa
  useEffect(() => {
    if (!pesquisa.trim()) {
      setTemplatesFiltrados(templates);
    } else {
      const termo = pesquisa.toLowerCase();
      setTemplatesFiltrados(templates.filter(t =>
        t.name.toLowerCase().includes(termo) ||
        t.description?.toLowerCase().includes(termo) ||
        t.exercises?.some(ex => ex.exerciseName.toLowerCase().includes(termo))
      ));
    }
  }, [pesquisa, templates]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!Object.values(dropdownRefs.current).some(r => r?.contains(e.target))) {
        setSugestoesVisiveis(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const carregarTemplates = async () => {
    try {
      setLoading(true);
      const dados = await templateService.getAll();
      setTemplates(dados);
    } catch {
      showMsg('error', 'Erro ao carregar templates.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ─── Dias ────────────────────────────────────────────────
  const adicionarDia = () => {
    const proximoNum = Math.max(...dias.map(d => d.dayNumber)) + 1;
    if (proximoNum > 7) return;
    setDias(prev => [...prev, diaVazio(proximoNum)]);
    setDiaAtivo(proximoNum);
  };

  const removerDia = (dayNumber) => {
    if (dias.length === 1) return;
    setDias(prev => prev.filter(d => d.dayNumber !== dayNumber));
    setDiaAtivo(dias.find(d => d.dayNumber !== dayNumber)?.dayNumber || 1);
  };

  const diaAtivoObj = dias.find(d => d.dayNumber === diaAtivo);

  // ─── Exercícios do dia ativo ─────────────────────────────
  const atualizarExercicio = (exIdx, campo, valor) => {
    setDias(prev => prev.map(d =>
      d.dayNumber === diaAtivo
        ? { ...d, exercises: d.exercises.map((ex, i) => i === exIdx ? { ...ex, [campo]: valor } : ex) }
        : d
    ));
  };

  const adicionarExercicio = () => {
    setDias(prev => prev.map(d =>
      d.dayNumber === diaAtivo ? { ...d, exercises: [...d.exercises, exercicioVazio()] } : d
    ));
  };

  const removerExercicio = (exIdx) => {
    setDias(prev => prev.map(d =>
      d.dayNumber === diaAtivo
        ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) }
        : d
    ));
  };

  const handleSelectSugestao = (exIdx, ex) => {
    atualizarExercicio(exIdx, 'exerciseName', ex.name);
    setSugestoesVisiveis(null);
  };

  // ─── Abrir modal ─────────────────────────────────────────
  const abrirCriar = () => {
    setEditandoId(null);
    setNome(''); setDescricao('');
    setDias([diaVazio(1)]);
    setDiaAtivo(1);
    setModalAberto(true);
  };

  const abrirEditar = (t) => {
    setEditandoId(t.id);
    setNome(t.name);
    setDescricao(t.description || '');

    // Agrupar exercícios por dia
    const diasAgrupados = [];
    const maxDia = Math.max(...(t.exercises.map(e => e.dayNumber || 1)), 1);
    for (let d = 1; d <= maxDia; d++) {
      const exsDoDia = t.exercises.filter(e => (e.dayNumber || 1) === d);
      diasAgrupados.push({
        dayNumber: d,
        exercises: exsDoDia.length > 0
          ? exsDoDia.map(e => ({ exerciseName: e.exerciseName, sets: String(e.sets), reps: String(e.reps), restTime: e.restTime, notes: e.notes || '' }))
          : [exercicioVazio()]
      });
    }
    setDias(diasAgrupados.length > 0 ? diasAgrupados : [diaVazio(1)]);
    setDiaAtivo(1);
    setModalAberto(true);
  };

  // ─── Submeter ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    // Flatten exercícios com dayNumber
    const todosExercicios = dias.flatMap(d =>
      d.exercises
        .filter(ex => ex.exerciseName.trim())
        .map((ex, idx) => ({ ...ex, dayNumber: d.dayNumber, orderIndex: idx }))
    );

    if (todosExercicios.length === 0) {
      showMsg('error', 'Adiciona pelo menos um exercício.');
      return;
    }

    try {
      setLoadingForm(true);
      const payload = { name: nome.trim(), description: descricao.trim(), exercises: todosExercicios };
      if (editandoId) {
        await templateService.update(editandoId, payload);
        showMsg('success', 'Template atualizado!');
      } else {
        await templateService.create(payload);
        showMsg('success', 'Template criado com sucesso!');
      }
      setModalAberto(false);
      await carregarTemplates();
    } catch (err) {
      showMsg('error', typeof err === 'string' ? err : 'Erro ao guardar template.');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleApagar = async (id) => {
    try {
      await templateService.delete(id);
      showMsg('success', 'Template eliminado.');
      setConfirmarApagar(null);
      await carregarTemplates();
    } catch {
      showMsg('error', 'Erro ao apagar template.');
    }
  };

  // ─── Helpers para exibição ────────────────────────────────
  const getDiasDoTemplate = (t) => {
    const nums = [...new Set(t.exercises.map(e => e.dayNumber || 1))].sort((a, b) => a - b);
    return nums;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Templates de Treino</h1>
          <p className="mt-1 text-sm text-neutral-400">Cria planos reutilizáveis com múltiplos dias para aplicar aos alunos.</p>
        </div>
        <button onClick={abrirCriar} className="px-4 py-2.5 text-sm font-bold text-white rounded-xl cursor-pointer bg-fitnessGym hover:bg-red-700 transition-colors whitespace-nowrap">
          + Novo Template
        </button>
      </div>

      {message.text && (
        <div className={`p-4 text-sm rounded-2xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* 🔥 Barra de pesquisa */}
      {templates.length > 0 && (
        <div className="relative">
          <svg className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por nome, descrição ou exercício..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-white border outline-none bg-neutral-900 border-neutral-800 rounded-xl focus:border-fitnessGym"
          />
          {pesquisa && (
            <button onClick={() => setPesquisa('')} className="absolute -translate-y-1/2 cursor-pointer right-3 top-1/2 text-neutral-500 hover:text-white">✕</button>
          )}
        </div>
      )}

      {/* Grid de templates */}
      {loading ? (
        <div className="py-20 text-sm text-center text-neutral-500">A carregar...</div>
      ) : templates.length === 0 ? (
        <div className="p-12 space-y-3 text-center border border-dashed border-neutral-800 rounded-2xl">
          <span className="text-4xl">📋</span>
          <h3 className="font-bold text-white">Nenhum template criado</h3>
          <p className="text-sm text-neutral-500">Cria o teu primeiro template com múltiplos dias de treino.</p>
          <button onClick={abrirCriar} className="px-5 py-2 text-sm font-bold text-white cursor-pointer rounded-xl bg-fitnessGym hover:bg-red-700">
            + Criar Primeiro Template
          </button>
        </div>
      ) : templatesFiltrados.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-neutral-800 rounded-2xl">
          <p className="text-sm text-neutral-500">Nenhum template encontrado para "<span className="text-white">{pesquisa}</span>".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templatesFiltrados.map(t => {
            const diasDoTemplate = getDiasDoTemplate(t);
            return (
              <div key={t.id} className="flex flex-col p-5 space-y-4 transition-colors border bg-neutral-900 border-neutral-800 rounded-2xl hover:border-neutral-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{t.name}</h3>
                    {t.description && <p className="mt-0.5 text-xs text-neutral-500 truncate">{t.description}</p>}
                  </div>
                  <div className="flex gap-1.5 ml-2 flex-shrink-0">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-800 text-neutral-400">
                      {diasDoTemplate.length} dia(s)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-800 text-neutral-400">
                      {t.exercises.length} ex.
                    </span>
                  </div>
                </div>

                {/* Prévia dos dias */}
                <div className="space-y-2">
                  {diasDoTemplate.slice(0, 3).map(dayNum => {
                    const exsDoDia = t.exercises.filter(e => (e.dayNumber || 1) === dayNum);
                    return (
                      <div key={dayNum} className="p-2.5 border bg-neutral-950 border-neutral-800 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Dia {dayNum}</p>
                        {exsDoDia.slice(0, 2).map((ex, idx) => (
                          <p key={idx} className="text-xs truncate text-neutral-400">• {ex.exerciseName} — {ex.sets}×{ex.reps}</p>
                        ))}
                        {exsDoDia.length > 2 && <p className="text-[10px] text-neutral-600">+{exsDoDia.length - 2} mais...</p>}
                      </div>
                    );
                  })}
                  {diasDoTemplate.length > 3 && (
                    <p className="text-[10px] text-neutral-600 pl-1">+{diasDoTemplate.length - 3} dia(s) mais...</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 mt-auto border-t border-neutral-800">
                  <button onClick={() => abrirEditar(t)} className="flex-1 py-2 text-xs font-semibold transition-colors border cursor-pointer rounded-xl text-neutral-300 border-neutral-700 hover:bg-neutral-800">
                    ✏️ Editar
                  </button>
                  <button onClick={() => setConfirmarApagar(t.id)} className="px-3 py-2 text-xs transition-colors border cursor-pointer rounded-xl text-neutral-500 border-neutral-700 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Criar/Editar ─────────────────────────────── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl mb-10 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h2 className="font-bold text-white">{editandoId ? '✏️ Editar Template' : '➕ Novo Template'}</h2>
              <button onClick={() => setModalAberto(false)} className="text-sm cursor-pointer text-neutral-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Nome e Descrição */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-neutral-400">Nome do Template *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Perda de Peso" className="w-full px-3 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-neutral-400">Descrição (opcional)</label>
                  <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: 3 dias, foco em cardio" className="w-full px-3 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" />
                </div>
              </div>

              {/* Abas de dias */}
              <div>
                <div className="flex items-center gap-2 pb-1 mb-4 overflow-x-auto">
                  {dias.map(d => (
                    <button
                      key={d.dayNumber}
                      type="button"
                      onClick={() => setDiaAtivo(d.dayNumber)}
                      className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border ${
                        diaAtivo === d.dayNumber
                          ? 'bg-fitnessGym border-fitnessGym text-white'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Dia {d.dayNumber}
                      <span className="ml-1.5 text-[10px] opacity-70">({d.exercises.filter(e => e.exerciseName.trim()).length} ex.)</span>
                    </button>
                  ))}
                  {dias.length < 7 && (
                    <button type="button" onClick={adicionarDia} className="flex-shrink-0 px-3 py-2 text-xs font-bold transition-colors border border-dashed cursor-pointer border-neutral-700 rounded-xl text-neutral-500 hover:text-white hover:border-neutral-500">
                      + Dia
                    </button>
                  )}
                  {dias.length > 1 && (
                    <button type="button" onClick={() => removerDia(diaAtivo)} className="flex-shrink-0 px-3 py-2 ml-auto text-xs text-red-400 transition-colors border cursor-pointer border-red-900/30 rounded-xl hover:bg-red-950/20">
                      🗑️ Remover Dia {diaAtivo}
                    </button>
                  )}
                </div>

                {/* Exercícios do dia ativo */}
                {diaAtivoObj && (
                  <div className="space-y-3">
                    {diaAtivoObj.exercises.map((ex, exIdx) => {
                      const chave = `${diaAtivo}-${exIdx}`;
                      const sugestoes = ex.exerciseName.trim().length >= 1
                        ? biblioteca.filter(b => b.name.toLowerCase().includes(ex.exerciseName.toLowerCase())).slice(0, 6)
                        : [];
                      return (
                        <div key={exIdx} className="p-4 space-y-3 border bg-neutral-950 border-neutral-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">Exercício {exIdx + 1}</span>
                            {diaAtivoObj.exercises.length > 1 && (
                              <button type="button" onClick={() => removerExercicio(exIdx)} className="ml-auto text-xs text-red-400 cursor-pointer hover:text-red-300">✕</button>
                            )}
                          </div>

                          <div className="relative" ref={el => dropdownRefs.current[chave] = el}>
                            <input
                              type="text"
                              placeholder="Nome do exercício *"
                              value={ex.exerciseName}
                              onChange={e => { atualizarExercicio(exIdx, 'exerciseName', e.target.value); setSugestoesVisiveis(chave); }}
                              onFocus={() => { if (ex.exerciseName.trim().length >= 1) setSugestoesVisiveis(chave); }}
                              className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-900 border-neutral-700 rounded-xl focus:border-fitnessGym"
                              autoComplete="off"
                            />
                            {sugestoesVisiveis === chave && sugestoes.length > 0 && (
                              <ul className="absolute z-50 w-full mt-1 overflow-y-auto border shadow-xl border-neutral-700 rounded-xl bg-neutral-900 max-h-40">
                                {sugestoes.map(b => (
                                  <li key={b.id} onMouseDown={() => handleSelectSugestao(exIdx, b)} className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-neutral-800">
                                    {b.name} <span className="text-[10px] text-neutral-500 ml-1">{b.category}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {[['Séries', 'sets'], ['Reps', 'reps'], ['Descanso', 'restTime']].map(([label, campo]) => (
                              <div key={campo}>
                                <label className="block mb-1 text-[10px] text-neutral-500">{label}</label>
                                <input
                                  type={campo === 'restTime' ? 'text' : 'number'}
                                  value={ex[campo]}
                                  onChange={e => atualizarExercicio(exIdx, campo, e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm text-center text-white border outline-none bg-neutral-900 border-neutral-700 rounded-lg focus:border-fitnessGym"
                                />
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] text-neutral-500">Notas (opcional)</label>
                            <input type="text" value={ex.notes} onChange={e => atualizarExercicio(exIdx, 'notes', e.target.value)} placeholder="Ex: Cadência lenta" className="w-full px-3 py-1.5 text-sm text-white border outline-none bg-neutral-900 border-neutral-700 rounded-xl focus:border-fitnessGym" />
                          </div>
                        </div>
                      );
                    })}

                    <button type="button" onClick={adicionarExercicio} className="w-full py-2 text-xs font-bold transition-colors border border-dashed cursor-pointer border-neutral-700 rounded-xl text-neutral-500 hover:text-white hover:border-neutral-500">
                      + Adicionar Exercício ao Dia {diaAtivo}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-neutral-800">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-2.5 text-sm border rounded-xl cursor-pointer text-neutral-400 border-neutral-700 hover:bg-neutral-800">Cancelar</button>
                <button type="submit" disabled={loadingForm} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl cursor-pointer bg-fitnessGym hover:bg-red-700 disabled:opacity-50">
                  {loadingForm ? 'A guardar...' : editandoId ? 'Guardar Alterações' : 'Criar Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar apagar */}
      {confirmarApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 space-y-4 text-center border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <span className="text-3xl">🗑️</span>
            <div>
              <h3 className="font-bold text-white">Eliminar Template?</h3>
              <p className="mt-1 text-xs text-neutral-400">Esta ação é permanente. Os planos de alunos já exportados não serão afetados.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarApagar(null)} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 cursor-pointer">Cancelar</button>
              <button onClick={() => handleApagar(confirmarApagar)} className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}