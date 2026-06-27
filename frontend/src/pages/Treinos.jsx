import React, { useState, useEffect, useRef } from "react";
import studentService from "../services/studentService";
import trainingService from "../services/trainingService";
import whatsappService from "../services/whatsappService";
import WeightModal from "../components/WeightModal";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const resolverGifUrl = (gifUrl) => {
  if (!gifUrl) return null;
  if (gifUrl.startsWith("http://") || gifUrl.startsWith("https://")) return gifUrl;
  return `${BACKEND_URL}${gifUrl}`;
};

// Número máximo de dias suportados
const MAX_DIAS = 7;

export default function Treinos() {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  // Planos — lista de todos os dias do aluno
  const [planos, setPlanos] = useState([]); // [{ id, name, dayNumber, notes, exercises }]
  const [diaSelecionado, setDiaSelecionado] = useState(1); // dayNumber ativo (1-7)

  // Estado do dia atual em edição
  const [notes, setNotes] = useState("");
  const [exercicios, setExercicios] = useState([]);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [isModificado, setIsModificado] = useState(false);

  // Biblioteca de exercícios
  const [biblioteca, setBiblioteca] = useState([]);
  const [bibliotecaLoading, setBibliotecaLoading] = useState(false);

  // Formulário de novo exercício
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseSelected, setExerciseSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("10");
  const [restTime, setRestTime] = useState("60s");
  const [exNotes, setExNotes] = useState("");
  const dropdownRef = useRef(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [indexEditando, setIndexEditando] = useState(null);
  const [exercicioEditado, setExercicioEditado] = useState({ sets: "", reps: "", restTime: "", notes: "" });

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExerciseName, setModalExerciseName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [whatsappTexto, setWhatsappTexto] = useState("");

  // Modal confirmar apagar dia
  const [confirmarApagarDia, setConfirmarApagarDia] = useState(false);

  // ─── Click fora do dropdown ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Carregar alunos ativos ───────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await studentService.getAllStudents();
        setAlunos(dados.filter((a) => a.status === "Ativo"));
      } catch {
        showMsg("error", "Falha ao carregar atletas.");
      }
    };
    carregar();
  }, []);

  // ─── Carregar biblioteca ──────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      try {
        setBibliotecaLoading(true);
        const dados = await trainingService.getAllExercises();
        setBiblioteca(dados);
      } catch {} finally {
        setBibliotecaLoading(false);
      }
    };
    carregar();
  }, []);

  // ─── Ao mudar de aluno ────────────────────────────────────
  useEffect(() => {
    if (!alunoSelecionadoId) {
      setPlanos([]); setDiaSelecionado(1); setNotes(""); setExercicios([]);
      setSavedPlanId(null); setIsModificado(false); setAlunoSelecionado(null);
      return;
    }
    const aluno = alunos.find(a => a.id === parseInt(alunoSelecionadoId));
    setAlunoSelecionado(aluno || null);
    carregarPlanosAluno(alunoSelecionadoId);
  }, [alunoSelecionadoId]);

  // ─── Ao mudar de dia selecionado ─────────────────────────
  useEffect(() => {
    const plano = planos.find(p => p.dayNumber === diaSelecionado);
    if (plano) {
      setSavedPlanId(plano.id);
      setNotes(plano.notes || "");
      setExercicios(plano.exercises || []);
    } else {
      setSavedPlanId(null);
      setNotes("");
      setExercicios([]);
    }
    setIsModificado(false);
    setIndexEditando(null);
  }, [diaSelecionado, planos]);

  const carregarPlanosAluno = async (id) => {
    try {
      setLoading(true);
      const dados = await trainingService.getPlansByStudent(id);
      setPlanos(dados || []);
      // Seleciona o dia 1 por defeito, ou o primeiro dia disponível
      const diasDisponiveis = dados?.map(p => p.dayNumber).filter(Boolean).sort() || [];
      setDiaSelecionado(diasDisponiveis[0] || 1);
    } catch (err) {
      showMsg("error", "Erro ao carregar os planos deste aluno.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // ─── Quantos dias o aluno tem (existentes na BD) ─────────
  const diasExistentes = planos.map(p => p.dayNumber).filter(Boolean).sort((a,b) => a-b);
  const proximoDia = Math.min(MAX_DIAS, (Math.max(0, ...diasExistentes) + 1));
  const podeAdicionarDia = diasExistentes.length < MAX_DIAS;

  // ─── Exercícios ───────────────────────────────────────────
  const sugestoes = exerciseSearch.trim().length >= 1
    ? biblioteca.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectExercise = (ex) => { setExerciseSelected(ex); setExerciseSearch(ex.name); setShowDropdown(false); };

  const handleSelectGifDropdown = (e) => {
    const url = e.target.value;
    if (!url) { setExerciseSelected(prev => prev ? { ...prev, gifUrl: null } : null); return; }
    const ex = biblioteca.find(ex => ex.gifUrl === url);
    if (ex) {
      setExerciseSelected({ id: ex.id, name: exerciseSelected?.name || ex.name, gifUrl: ex.gifUrl, category: ex.category });
      if (!exerciseSearch.trim()) setExerciseSearch(ex.name);
    } else {
      setExerciseSelected(prev => ({ ...prev, gifUrl: url }));
    }
  };

  const handleAddExercicio = (e) => {
    e.preventDefault();
    const nome = exerciseSelected?.name || exerciseSearch.trim();
    if (!nome) return;
    setExercicios([...exercicios, {
      exerciseName: nome,
      gifUrl: exerciseSelected?.gifUrl || null,
      sets: parseInt(sets) || 4,
      reps: parseInt(reps) || 10,
      restTime: restTime.trim() || "60s",
      notes: exNotes.trim()
    }]);
    setIsModificado(true);
    setExerciseSearch(""); setExerciseSelected(null); setExNotes("");
  };

  const handleRemoveExercicio = (idx) => {
    setExercicios(exercicios.filter((_, i) => i !== idx));
    setIsModificado(true);
  };

  const handleIniciarEdicao = (index, ex) => {
    setIndexEditando(index);
    setExercicioEditado({ sets: ex.sets, reps: ex.reps, restTime: ex.restTime, notes: ex.notes || "" });
  };

  const handleSalvarEdicao = (index) => {
    const novos = [...exercicios];
    novos[index] = { ...novos[index], sets: parseInt(exercicioEditado.sets) || 4, reps: parseInt(exercicioEditado.reps) || 10, restTime: exercicioEditado.restTime.trim() || "60s", notes: exercicioEditado.notes.trim() };
    setExercicios(novos);
    setIsModificado(true);
    setIndexEditando(null);
  };

  // ─── Guardar plano do dia atual ───────────────────────────
  const handleSavePlano = async () => {
    if (!alunoSelecionadoId) { showMsg("error", "Selecione primeiro um atleta."); return; }
    try {
      setLoading(true);
      const payload = {
        studentId: alunoSelecionadoId,
        name: `Dia ${diaSelecionado}`,
        dayNumber: diaSelecionado,
        notes: notes.trim(),
        exercises: exercicios
      };
      const resultado = await trainingService.saveTrainingPlan(payload);
      setSavedPlanId(resultado.plan?.id || null);
      await carregarPlanosAluno(alunoSelecionadoId);
      showMsg("success", `Plano do Dia ${diaSelecionado} guardado com sucesso!`);
    } catch (err) {
      showMsg("error", typeof err === 'string' ? err : "Erro ao guardar o plano.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Apagar dia atual ─────────────────────────────────────
  const handleApagarDia = async () => {
    if (!savedPlanId) { setConfirmarApagarDia(false); showMsg("error", "Este dia ainda não foi guardado."); return; }
    try {
      setLoading(true);
      await trainingService.deletePlan(savedPlanId);
      await carregarPlanosAluno(alunoSelecionadoId);
      setConfirmarApagarDia(false);
      showMsg("success", `Dia ${diaSelecionado} eliminado.`);
    } catch (err) {
      showMsg("error", "Erro ao eliminar o plano.");
    } finally {
      setLoading(false);
    }
  };

  // ─── WhatsApp ─────────────────────────────────────────────
  const handleAbrirPreviewWhatsApp = () => {
    if (!alunoSelecionado) return;
    const textoMapeado = whatsappService.gerarTextoMensagem(
      alunoSelecionado.nome,
      exercicios,
      notes,
      savedPlanId
    );
    setWhatsappTexto(textoMapeado);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Prescrever Treinos</h1>
        <p className="mt-1 text-sm text-neutral-400">Selecione um aluno e gira os seus planos de treino por dia.</p>
      </div>

      {/* Alerta */}
      {message.text && (
        <div className={`p-4 text-sm rounded-2xl border ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* Seleção de Aluno */}
      <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-neutral-400">Aluno*</label>
        <select
          value={alunoSelecionadoId}
          onChange={(e) => setAlunoSelecionadoId(e.target.value)}
          className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
        >
          <option value="">Escolha um aluno na lista...</option>
          {alunos.map(a => (
            <option key={a.id} value={a.id}>{a.nome} ({a.whatsapp})</option>
          ))}
        </select>
      </div>

      {alunoSelecionadoId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

          {/* ── COLUNA ESQUERDA: Dias ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="p-4 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
              <h3 className="pb-2 text-xs font-bold tracking-wider uppercase border-b text-neutral-400 border-neutral-800">
                📅 Dias de Treino
              </h3>

              {loading ? (
                <div className="py-4 text-xs text-center text-neutral-500">A carregar...</div>
              ) : (
                <div className="space-y-1.5">
                  {/* Dias de 1 a 7, mostra os que existem + próximo disponível */}
                  {Array.from({ length: MAX_DIAS }, (_, i) => i + 1).map(dia => {
                    const plano = planos.find(p => p.dayNumber === dia);
                    const existe = !!plano;
                    const isAtivo = diaSelecionado === dia;
                    // Só mostra dias que existem OU o próximo a criar
                    if (!existe && dia !== proximoDia) return null;

                    return (
                      <button
                        key={dia}
                        onClick={() => { if (isModificado && !window.confirm("Tens alterações não guardadas. Continuar?")) return; setDiaSelecionado(dia); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isAtivo
                            ? "bg-fitnessGym text-white shadow-lg shadow-red-500/20"
                            : existe
                              ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                              : "border border-dashed border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
                        }`}
                      >
                        <span>Dia {dia}</span>
                        {existe ? (
                          <span className="text-[10px] opacity-70">{plano.exercises?.length || 0} ex.</span>
                        ) : (
                          <span className="text-[10px]">+ Novo</span>
                        )}
                      </button>
                    );
                  })}

                  {!podeAdicionarDia && (
                    <p className="pt-1 text-[10px] text-center text-neutral-600">Máximo de 7 dias atingido.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── COLUNA DIREITA: Formulário + Exercícios ────── */}
          <div className="space-y-4 lg:col-span-3">

            {/* Cabeçalho do dia selecionado */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  📋 Dia {diaSelecionado}
                  {planos.find(p => p.dayNumber === diaSelecionado) ? "" : " — Novo Plano"}
                </h2>
                <p className="text-xs text-neutral-500">
                  {exercicios.length} exercício(s) · {isModificado ? <span className="text-amber-400">● Não guardado</span> : <span className="text-emerald-400">● Guardado</span>}
                </p>
              </div>
              {savedPlanId && (
                <button
                  onClick={() => setConfirmarApagarDia(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-400 transition-colors border rounded-lg cursor-pointer border-red-900/30 hover:bg-red-950/20"
                >
                  🗑️ Apagar Dia
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Formulário de adicionar exercício */}
              <div className="p-5 space-y-4 border h-fit bg-neutral-900 border-neutral-800 rounded-2xl xl:col-span-1">
                <h3 className="pb-2 text-sm font-bold text-white border-b border-neutral-800">➕ Adicionar Exercício</h3>
                <form onSubmit={handleAddExercicio} className="space-y-3">
                  <div className="space-y-1" ref={dropdownRef}>
                    <label className="text-xs text-neutral-400">
                      Nome * {bibliotecaLoading && <span className="text-neutral-600">(a carregar...)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Leg Press 45º"
                        value={exerciseSearch}
                        onChange={(e) => { setExerciseSearch(e.target.value); setExerciseSelected(null); setShowDropdown(true); }}
                        onFocus={() => { if (exerciseSearch.trim().length >= 1) setShowDropdown(true); }}
                        className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                        required autoComplete="off"
                      />
                      {showDropdown && sugestoes.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 overflow-y-auto border shadow-xl border-neutral-700 rounded-xl bg-neutral-900 max-h-48">
                          {sugestoes.map(ex => (
                            <li key={ex.id} onMouseDown={() => handleSelectExercise(ex)} className="flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer hover:bg-neutral-800">
                              {ex.gifUrl ? (
                                <img src={resolverGifUrl(ex.gifUrl)} alt={ex.name} className="flex-shrink-0 object-cover border rounded-lg w-9 h-9 border-neutral-700" onError={e => e.target.style.display = "none"} />
                              ) : (
                                <div className="flex items-center justify-center flex-shrink-0 text-xs border rounded-lg w-9 h-9 border-neutral-800 bg-neutral-950 text-neutral-600">🏋️</div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{ex.name}</p>
                                <p className="text-[10px] text-neutral-500 uppercase">{ex.category}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">GIF de Suporte</label>
                    <select value={exerciseSelected?.gifUrl || ""} onChange={handleSelectGifDropdown} className="w-full px-3 py-2 text-xs text-white border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym">
                      <option value="">-- Sem GIF --</option>
                      {biblioteca.filter(ex => ex.gifUrl).map(ex => (
                        <option key={`gif-${ex.id}`} value={ex.gifUrl}>{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  {exerciseSelected?.gifUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded-xl bg-neutral-950 border-neutral-800">
                      <img src={resolverGifUrl(exerciseSelected.gifUrl)} alt={exerciseSelected.name} className="flex-shrink-0 object-cover w-12 h-12 border rounded-lg border-neutral-800" />
                      <span className="text-[10px] text-emerald-400">✔ GIF Vinculado</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400">Séries</label>
                      <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Reps</label>
                      <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Descanso</label>
                      <input type="text" value={restTime} onChange={e => setRestTime(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400">Notas</label>
                    <textarea rows="2" value={exNotes} onChange={e => setExNotes(e.target.value)} placeholder="Ex: Carga progressiva..." className="w-full px-3 py-2 mt-0.5 text-xs text-white border outline-none resize-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" />
                  </div>

                  <button type="submit" className="w-full py-2 text-xs font-medium text-white transition-colors cursor-pointer bg-neutral-800 hover:bg-neutral-700 rounded-xl">
                    Injetar na Lista
                  </button>
                </form>
              </div>

              {/* Zona de exercícios do dia */}
              <div className="space-y-4 xl:col-span-2">
                <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Observações do Dia</label>
                    <input
                      type="text"
                      placeholder="Ex: Foco em hipertrofia..."
                      value={notes}
                      onChange={e => { setNotes(e.target.value); setIsModificado(true); }}
                      className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600"
                    />
                  </div>

                  {/* DESKTOP: Tabela */}
                  <div className="hidden overflow-hidden border md:block border-neutral-800 rounded-xl bg-neutral-950">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-medium tracking-wider uppercase border-b bg-neutral-900 text-neutral-400 border-neutral-800">
                          <th className="p-3">GIF</th>
                          <th className="p-3">Exercício</th>
                          <th className="p-3 text-center">Séries</th>
                          <th className="p-3 text-center">Reps</th>
                          <th className="p-3 text-center">Descanso</th>
                          <th className="p-3">Notas</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {exercicios.length > 0 ? exercicios.map((ex, index) => {
                          const estaEditando = indexEditando === index;
                          return (
                            <tr key={index} className="transition-colors hover:bg-neutral-900/40">
                              <td className="w-16 p-3 text-center">
                                {ex.gifUrl ? (
                                  <img src={resolverGifUrl(ex.gifUrl)} alt={ex.exerciseName} className="object-cover w-10 h-10 mx-auto border rounded-lg border-neutral-800" onError={e => e.target.style.display = "none"} />
                                ) : (
                                  <div className="flex items-center justify-center w-10 h-10 mx-auto text-xs border rounded-lg border-neutral-800 bg-neutral-900 text-neutral-600">—</div>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-white">{ex.exerciseName}</td>
                              <td className="p-3 font-mono text-center">
                                {estaEditando ? <input type="number" value={exercicioEditado.sets} onChange={e => setExercicioEditado(p => ({...p, sets: e.target.value}))} className="px-1 py-1 text-xs text-center text-white border rounded outline-none w-14 bg-neutral-950 border-neutral-800 focus:border-red-500" /> : ex.sets}
                              </td>
                              <td className="p-3 font-mono text-center">
                                {estaEditando ? <input type="number" value={exercicioEditado.reps} onChange={e => setExercicioEditado(p => ({...p, reps: e.target.value}))} className="px-1 py-1 text-xs text-center text-white border rounded outline-none w-14 bg-neutral-950 border-neutral-800 focus:border-red-500" /> : ex.reps}
                              </td>
                              <td className="p-3 font-mono text-center text-neutral-400">
                                {estaEditando ? <input type="text" value={exercicioEditado.restTime} onChange={e => setExercicioEditado(p => ({...p, restTime: e.target.value}))} className="w-16 px-1 py-1 text-xs text-center text-white border rounded outline-none bg-neutral-950 border-neutral-800 focus:border-red-500" /> : ex.restTime}
                              </td>
                              <td className="p-3 text-xs text-neutral-400 max-w-[100px] truncate">
                                {estaEditando ? <input type="text" value={exercicioEditado.notes} onChange={e => setExercicioEditado(p => ({...p, notes: e.target.value}))} className="w-full px-2 py-1 text-xs text-white border rounded outline-none bg-neutral-950 border-neutral-800 focus:border-red-500" /> : ex.notes || "—"}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {estaEditando ? (
                                    <>
                                      <button onClick={() => handleSalvarEdicao(index)} className="text-xs font-bold cursor-pointer text-emerald-400 hover:text-emerald-300">Gravar</button>
                                      <button onClick={() => setIndexEditando(null)} className="text-xs cursor-pointer text-neutral-500 hover:text-neutral-400">Cancelar</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleIniciarEdicao(index, ex)} className="text-xs transition-colors cursor-pointer text-neutral-400 hover:text-white">✏️</button>
                                      <button onClick={() => { setModalExerciseName(ex.exerciseName); setIsModalOpen(true); }} disabled={isModificado} className={`text-xs cursor-pointer ${isModificado ? "text-neutral-600 opacity-40" : "text-fitnessGym hover:text-emerald-400"}`}>📈</button>
                                      <button onClick={() => handleRemoveExercicio(index)} className="text-xs text-red-400 transition-colors cursor-pointer hover:text-red-500">✕</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="7" className="p-6 text-xs italic text-center text-neutral-600">Nenhum exercício. Adiciona pelo formulário ao lado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE: Cartões */}
                  <div className="space-y-3 md:hidden">
                    {exercicios.length > 0 ? exercicios.map((ex, index) => {
                      const estaEditando = indexEditando === index;
                      return (
                        <div key={index} className="p-4 space-y-3 border bg-neutral-950 border-neutral-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            {ex.gifUrl ? (
                              <img src={resolverGifUrl(ex.gifUrl)} alt={ex.exerciseName} className="flex-shrink-0 object-cover border rounded-lg w-14 h-14 border-neutral-800" onError={e => e.target.style.display = "none"} />
                            ) : (
                              <div className="flex items-center justify-center flex-shrink-0 text-xs border rounded-lg w-14 h-14 border-neutral-800 bg-neutral-900 text-neutral-600">—</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{ex.exerciseName}</p>
                              {ex.notes && !estaEditando && <p className="mt-0.5 text-[11px] text-neutral-500 italic truncate">{ex.notes}</p>}
                            </div>
                          </div>
                          {estaEditando ? (
                            <div className="grid grid-cols-3 gap-2">
                              <div><label className="text-[10px] text-neutral-500">Séries</label><input type="number" value={exercicioEditado.sets} onChange={e => setExercicioEditado(p => ({...p, sets: e.target.value}))} className="w-full px-2 py-1.5 mt-1 text-sm text-center text-white border rounded-lg outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" /></div>
                              <div><label className="text-[10px] text-neutral-500">Reps</label><input type="number" value={exercicioEditado.reps} onChange={e => setExercicioEditado(p => ({...p, reps: e.target.value}))} className="w-full px-2 py-1.5 mt-1 text-sm text-center text-white border rounded-lg outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" /></div>
                              <div><label className="text-[10px] text-neutral-500">Descanso</label><input type="text" value={exercicioEditado.restTime} onChange={e => setExercicioEditado(p => ({...p, restTime: e.target.value}))} className="w-full px-2 py-1.5 mt-1 text-sm text-center text-white border rounded-lg outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" /></div>
                              <div className="col-span-3"><label className="text-[10px] text-neutral-500">Notas</label><input type="text" value={exercicioEditado.notes} onChange={e => setExercicioEditado(p => ({...p, notes: e.target.value}))} className="w-full px-2 py-1.5 mt-1 text-sm text-white border rounded-lg outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" /></div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2 p-3 text-center border bg-neutral-900 rounded-xl border-neutral-800/50">
                              <div><span className="block text-[10px] font-bold text-neutral-500 uppercase">Séries</span><span className="text-sm font-black text-white">{ex.sets}</span></div>
                              <div><span className="block text-[10px] font-bold text-neutral-500 uppercase">Reps</span><span className="text-sm font-black text-white">{ex.reps}</span></div>
                              <div><span className="block text-[10px] font-bold text-neutral-500 uppercase">Descanso</span><span className="text-sm font-black text-red-400">{ex.restTime}</span></div>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1 border-t border-neutral-800">
                            {estaEditando ? (
                              <>
                                <button onClick={() => handleSalvarEdicao(index)} className="flex-1 py-2 text-xs font-bold text-white rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700">✓ Gravar</button>
                                <button onClick={() => setIndexEditando(null)} className="flex-1 py-2 text-xs border rounded-lg cursor-pointer text-neutral-400 border-neutral-700 hover:bg-neutral-800">Cancelar</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleIniciarEdicao(index, ex)} className="flex-1 py-2 text-xs border rounded-lg cursor-pointer text-neutral-300 border-neutral-700 hover:bg-neutral-800">✏️ Editar</button>
                                <button onClick={() => { setModalExerciseName(ex.exerciseName); setIsModalOpen(true); }} disabled={isModificado} className={`flex-1 py-2 text-xs rounded-lg cursor-pointer ${isModificado ? "text-neutral-600 border border-neutral-800 opacity-40" : "text-fitnessGym border border-fitnessGym/30 hover:bg-fitnessGym/10"}`}>📈 Cargas</button>
                                <button onClick={() => handleRemoveExercicio(index)} className="flex-1 py-2 text-xs text-red-400 border rounded-lg cursor-pointer border-red-900/30 hover:bg-red-950/20">Remover</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-6 text-xs italic text-center border border-dashed text-neutral-600 border-neutral-800 rounded-xl">Nenhum exercício adicionado ainda.</div>
                    )}
                  </div>

                  {/* Botões de ação */}
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={handleAbrirPreviewWhatsApp}
                      disabled={exercicios.length === 0 || isModificado || !alunoSelecionadoId}
                      className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors cursor-pointer border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
                    >
                      <img src="/whatsapp.png" alt="WhatsApp" className="object-contain w-5 h-5" />
                      {isModificado ? "Grave para Ativar" : "Enviar para o WhatsApp"}
                    </button>
                    <button
                      onClick={handleSavePlano}
                      disabled={loading}
                      className="w-full px-6 py-2.5 rounded-xl bg-fitnessGym hover:bg-red-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-red-500/10 disabled:opacity-40 sm:w-auto"
                    >
                      {loading ? "A Gravar..." : `Sincronizar Dia ${diaSelecionado}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cargas */}
      <WeightModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} studentId={alunoSelecionadoId} exerciseName={modalExerciseName} />

      {/* Modal Confirmar Apagar Dia */}
      {confirmarApagarDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 space-y-4 text-center border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto border rounded-full bg-red-500/10 border-red-500/20">
              <span className="text-lg">🗑️</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Eliminar Dia {diaSelecionado}?</h3>
              <p className="mt-1 text-xs text-neutral-400">Todos os exercícios deste dia serão apagados permanentemente.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarApagarDia(false)} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 cursor-pointer">Cancelar</button>
              <button onClick={handleApagarDia} className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 cursor-pointer">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview WhatsApp */}
      {isPreviewOpen && alunoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b bg-neutral-950/60 border-neutral-800">
              <div>
                <h3 className="text-xs font-black tracking-wider text-red-500 uppercase">Confirmação de Envio</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Destinatário: {alunoSelecionado.nome} · Dia {diaSelecionado}</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 text-sm cursor-pointer text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-[#0b141a] max-h-[380px] overflow-y-auto">
              <div className="max-w-[85%] ml-auto bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none p-3 shadow-md">
                <pre className="font-sans text-xs leading-relaxed whitespace-pre-wrap">{whatsappTexto}</pre>
                <div className="text-[10px] text-[#8696a0] text-right mt-1 font-mono">
                  {new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} ✔✔
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 border-t bg-neutral-950/40 border-neutral-800">
              <button onClick={() => setIsPreviewOpen(false)} className="w-full py-2.5 text-xs font-bold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl cursor-pointer">Ajustar</button>
              <button
                onClick={() => {
                  const url = whatsappService.enviarPlanoTreino(alunoSelecionado.whatsapp, alunoSelecionado.nome, exercicios, notes, savedPlanId);
                  if (url) window.open(url, "_blank");
                  setIsPreviewOpen(false);
                }}
                className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-fitnessGym text-white hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}