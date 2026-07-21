import React, { useState, useEffect, useRef } from 'react';
import templateService from '../services/templateService';
import trainingService from '../services/trainingService';

const exercicioVazio = () => ({ exerciseName: '', sets: '4', reps: '10', restTime: '60s', notes: '' });

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [exercicios, setExercicios] = useState([exercicioVazio()]);
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
    } catch (err) {
      showMsg('error', 'Erro ao carregar templates.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const abrirCriar = () => {
    setEditandoId(null);
    setNome(''); setDescricao('');
    setExercicios([exercicioVazio()]);
    setModalAberto(true);
  };

  const abrirEditar = (t) => {
    setEditandoId(t.id);
    setNome(t.name);
    setDescricao(t.description || '');
    setExercicios(t.exercises.length > 0
      ? t.exercises.map(e => ({ exerciseName: e.exerciseName, sets: String(e.sets), reps: String(e.reps), restTime: e.restTime, notes: e.notes || '' }))
      : [exercicioVazio()]
    );
    setModalAberto(true);
  };

  const handleExercicioChange = (idx, campo, valor) => {
    setExercicios(prev => prev.map((ex, i) => i === idx ? { ...ex, [campo]: valor } : ex));
  };

  const handleSelectSugestao = (idx, ex) => {
    handleExercicioChange(idx, 'exerciseName', ex.name);
    setSugestoesVisiveis(null);
  };

  const adicionarExercicio = () => setExercicios(prev => [...prev, exercicioVazio()]);
  const removerExercicio = (idx) => setExercicios(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const exValidos = exercicios.filter(ex => ex.exerciseName.trim());
    if (exValidos.length === 0) { showMsg('error', 'Adiciona pelo menos um exercício.'); return; }

    try {
      setLoadingForm(true);
      const payload = { name: nome.trim(), description: descricao.trim(), exercises: exValidos };
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
    } catch (err) {
      showMsg('error', 'Erro ao apagar template.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Templates de Treino</h1>
          <p className="mt-1 text-sm text-neutral-400">Cria planos reutilizáveis para aplicar rapidamente aos alunos.</p>
        </div>
        <button onClick={abrirCriar} className="px-4 py-2.5 text-sm font-bold text-white rounded-xl cursor-pointer bg-fitnessGym hover:bg-red-700 transition-colors">
          + Novo Template
        </button>
      </div>

      {message.text && (
        <div className={`p-4 text-sm rounded-2xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-sm text-center text-neutral-500">A carregar...</div>
      ) : templates.length === 0 ? (
        <div className="p-12 space-y-3 text-center border border-dashed border-neutral-800 rounded-2xl">
          <span className="text-4xl">📋</span>
          <h3 className="font-bold text-white">Nenhum template criado</h3>
          <p className="text-sm text-neutral-500">Cria o teu primeiro template de treino para reutilizar com os teus alunos.</p>
          <button onClick={abrirCriar} className="px-5 py-2 text-sm font-bold text-white cursor-pointer rounded-xl bg-fitnessGym hover:bg-red-700">
            + Criar Primeiro Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className="flex flex-col p-5 space-y-4 transition-colors border bg-neutral-900 border-neutral-800 rounded-2xl hover:border-neutral-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{t.name}</h3>
                  {t.description && <p className="mt-0.5 text-xs text-neutral-500 truncate">{t.description}</p>}
                </div>
                <span className="ml-2 flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-800 text-neutral-400">
                  {t.exercises.length} ex.
                </span>
              </div>

              <div className="space-y-1.5">
                {t.exercises.slice(0, 4).map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-2 text-xs">
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-500 text-[9px] font-bold">{idx + 1}</span>
                    <span className="truncate text-neutral-300">{ex.exerciseName}</span>
                    <span className="flex-shrink-0 text-neutral-600">{ex.sets}×{ex.reps}</span>
                  </div>
                ))}
                {t.exercises.length > 4 && (
                  <p className="text-[10px] text-neutral-600 pl-6">+{t.exercises.length - 4} mais...</p>
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
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl mb-10 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h2 className="font-bold text-white">{editandoId ? '✏️ Editar Template' : '➕ Novo Template'}</h2>
              <button onClick={() => setModalAberto(false)} className="text-sm cursor-pointer text-neutral-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-neutral-400">Nome do Template *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Perda de Peso A" className="w-full px-3 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-neutral-400">Descrição (opcional)</label>
                  <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Foco em cardio e força" className="w-full px-3 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-400">Exercícios</label>
                  <button type="button" onClick={adicionarExercicio} className="px-3 py-1 text-xs font-bold text-white rounded-lg cursor-pointer bg-neutral-800 hover:bg-neutral-700">+ Adicionar</button>
                </div>

                {exercicios.map((ex, idx) => (
                  <div key={idx} className="p-4 space-y-3 border bg-neutral-950 border-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Exercício {idx + 1}</span>
                      {exercicios.length > 1 && (
                        <button type="button" onClick={() => removerExercicio(idx)} className="ml-auto text-xs text-red-400 cursor-pointer hover:text-red-300">✕ Remover</button>
                      )}
                    </div>

                    {/* Nome com autocomplete */}
                    <div className="relative" ref={el => dropdownRefs.current[idx] = el}>
                      <input
                        type="text"
                        placeholder="Nome do exercício *"
                        value={ex.exerciseName}
                        onChange={e => { handleExercicioChange(idx, 'exerciseName', e.target.value); setSugestoesVisiveis(idx); }}
                        onFocus={() => { if (ex.exerciseName.trim().length >= 1) setSugestoesVisiveis(idx); }}
                        className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-900 border-neutral-700 rounded-xl focus:border-fitnessGym"
                        autoComplete="off"
                      />
                      {sugestoesVisiveis === idx && ex.exerciseName.trim().length >= 1 && (
                        <ul className="absolute z-50 w-full mt-1 overflow-y-auto border shadow-xl border-neutral-700 rounded-xl bg-neutral-900 max-h-40">
                          {biblioteca.filter(b => b.name.toLowerCase().includes(ex.exerciseName.toLowerCase())).slice(0, 6).map(b => (
                            <li key={b.id} onMouseDown={() => handleSelectSugestao(idx, b)} className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-neutral-800">
                              {b.name} <span className="text-[10px] text-neutral-500 ml-1">{b.category}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block mb-1 text-[10px] text-neutral-500">Séries</label>
                        <input type="number" value={ex.sets} onChange={e => handleExercicioChange(idx, 'sets', e.target.value)} className="w-full px-2 py-1.5 text-sm text-center text-white border outline-none bg-neutral-900 border-neutral-700 rounded-lg focus:border-fitnessGym" />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-neutral-500">Reps</label>
                        <input type="number" value={ex.reps} onChange={e => handleExercicioChange(idx, 'reps', e.target.value)} className="w-full px-2 py-1.5 text-sm text-center text-white border outline-none bg-neutral-900 border-neutral-700 rounded-lg focus:border-fitnessGym" />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-neutral-500">Descanso</label>
                        <input type="text" value={ex.restTime} onChange={e => handleExercicioChange(idx, 'restTime', e.target.value)} className="w-full px-2 py-1.5 text-sm text-center text-white border outline-none bg-neutral-900 border-neutral-700 rounded-lg focus:border-fitnessGym" />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-[10px] text-neutral-500">Notas (opcional)</label>
                      <input type="text" value={ex.notes} onChange={e => handleExercicioChange(idx, 'notes', e.target.value)} placeholder="Ex: Cadência lenta, foco na descida" className="w-full px-3 py-1.5 text-sm text-white border outline-none bg-neutral-900 border-neutral-700 rounded-xl focus:border-fitnessGym" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
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
              <p className="mt-1 text-xs text-neutral-400">Esta ação é permanente. Os planos de alunos que usaram este template não serão afetados.</p>
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