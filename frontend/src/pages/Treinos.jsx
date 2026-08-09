import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import studentService from "../services/studentService";
import trainingService from "../services/trainingService";
import whatsappService from "../services/whatsappService";
import templateService from "../services/templateService";
import WeightModal from "../components/WeightModal";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_DIAS = 7;

const resolverGifUrl = (gifUrl) => {
  if (!gifUrl) return null;
  if (gifUrl.startsWith("http://") || gifUrl.startsWith("https://")) return gifUrl;
  return `${BACKEND_URL}${gifUrl}`;
};

// Contador global para UIDs únicos
let uidCounter = 0;
const gerarUid = () => `uid-${++uidCounter}-${Date.now()}`;

// ─── Item desktop com drag HTML5 nativo ──────────────────────
function DragRow({ ex, index, dragIndex, dropIndex, isDraggingActive, onDragStart, onDragOver, onDrop, onDragEnd, estaEditando, exercicioEditado, setExercicioEditado, handleIniciarEdicao, handleSalvarEdicao, setIndexEditando, handleRemoveExercicio, isModificado, setModalExerciseName, setIsModalOpen }) {
  const isBeingDragged = dragIndex === index;
  const isDropTarget = dropIndex === index && isDraggingActive && dragIndex !== index;

  return (
    <div
      draggable={false}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={e => { e.preventDefault(); onDrop(index); }}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        isBeingDragged
          ? 'opacity-30 bg-neutral-800 border-neutral-700 scale-[0.98]'
          : isDropTarget
            ? 'border-red-500/50 bg-red-500/5'
            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Handle HTML5 drag */}
      <div
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(index); }}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 transition-colors shrink-0 p-1 select-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>

      {/* GIF */}
      <div className="shrink-0">
        {ex.gifUrl ? (
          <img src={resolverGifUrl(ex.gifUrl)} alt={ex.exerciseName} className="object-cover w-10 h-10 border rounded-lg border-neutral-800" onError={e => e.target.style.display = "none"} />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 text-xs border rounded-lg border-neutral-800 bg-neutral-900 text-neutral-600">—</div>
        )}
      </div>

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{ex.exerciseName}</p>
        {ex.notes && !estaEditando && <p className="text-[10px] text-neutral-500 italic truncate">{ex.notes}</p>}
      </div>

      {/* Séries / Reps / Descanso */}
      {estaEditando ? (
        <div className="flex items-center gap-2 shrink-0">
          <input type="number" value={exercicioEditado.sets} onChange={e => setExercicioEditado(p => ({...p, sets: e.target.value}))} className="w-12 px-1 py-1 text-xs text-center text-white border rounded outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" />
          <span className="text-neutral-600 text-xs">×</span>
          <input type="number" value={exercicioEditado.reps} onChange={e => setExercicioEditado(p => ({...p, reps: e.target.value}))} className="w-12 px-1 py-1 text-xs text-center text-white border rounded outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" />
          <input type="text" value={exercicioEditado.restTime} onChange={e => setExercicioEditado(p => ({...p, restTime: e.target.value}))} className="w-14 px-1 py-1 text-xs text-center text-white border rounded outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" />
          <input type="text" value={exercicioEditado.notes} onChange={e => setExercicioEditado(p => ({...p, notes: e.target.value}))} placeholder="Notas" className="w-24 px-2 py-1 text-xs text-white border rounded outline-none bg-neutral-900 border-neutral-700 focus:border-red-500" />
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <span className="text-white font-bold">{ex.sets}<span className="text-neutral-600">×</span>{ex.reps}</span>
          <span className="text-red-400">{ex.restTime}</span>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1.5 shrink-0">
        {estaEditando ? (
          <>
            <button onClick={() => handleSalvarEdicao(index)} className="text-xs font-bold cursor-pointer text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg bg-emerald-500/10">✓</button>
            <button onClick={() => setIndexEditando(null)} className="text-xs cursor-pointer text-neutral-500 hover:text-neutral-400 px-2 py-1 rounded-lg bg-neutral-800">✕</button>
          </>
        ) : (
          <>
            <button onClick={() => handleIniciarEdicao(index, ex)} className="text-xs transition-colors cursor-pointer text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800">✏️</button>
            <button onClick={() => { setModalExerciseName(ex.exerciseName); setIsModalOpen(true); }} disabled={isModificado} className={`text-xs cursor-pointer p-1.5 rounded-lg ${isModificado ? "text-neutral-600 opacity-40" : "text-fitnessGym hover:bg-neutral-800"}`}>📈</button>
            <button onClick={() => handleRemoveExercicio(index)} className="text-xs text-red-400 transition-colors cursor-pointer hover:text-red-500 p-1.5 rounded-lg hover:bg-red-950/20">✕</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Cartão sortable mobile ───────────────────────────────────
function SortableCard({ ex, index, estaEditando, exercicioEditado, setExercicioEditado, handleIniciarEdicao, handleSalvarEdicao, setIndexEditando, handleRemoveExercicio, isModificado, setModalExerciseName, setIsModalOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex._uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-4 space-y-3 border bg-neutral-950 border-neutral-800 rounded-xl">
      <div className="flex items-center gap-3">
        {/* Handle mobile */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 touch-none shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </button>
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
}

// ─── Componente principal ─────────────────────────────────────
export default function Treinos() {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(1);
  const [notes, setNotes] = useState("");
  const [exercicios, setExercicios] = useState([]);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [isModificado, setIsModificado] = useState(false);
  const [biblioteca, setBiblioteca] = useState([]);
  const [bibliotecaLoading, setBibliotecaLoading] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseSelected, setExerciseSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("10");
  const [restTime, setRestTime] = useState("60s");
  const [exNotes, setExNotes] = useState("");
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [indexEditando, setIndexEditando] = useState(null);
  const [exercicioEditado, setExercicioEditado] = useState({ sets: "", reps: "", restTime: "", notes: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExerciseName, setModalExerciseName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [whatsappTexto, setWhatsappTexto] = useState("");
  const [confirmarApagarDia, setConfirmarApagarDia] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [modalTemplateAberto, setModalTemplateAberto] = useState(false);
  const [modalConflito, setModalConflito] = useState(null);

  // ─── Drag HTML5 nativo (desktop) ─────────────────────────────
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Rastreia posição do rato durante o drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingActive) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDraggingActive]);

  const handleDragStartNative = (index) => {
    setDragIndex(index);
    setIsDraggingActive(true);
    setIndexEditando(null);
  };

  const handleDragOverNative = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setDropIndex(index);
  };

  const handleDropNative = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setExercicios(prev => {
      const nova = [...prev];
      const [item] = nova.splice(dragIndex, 1);
      nova.splice(index, 0, item);
      return nova;
    });
    setIsModificado(true);
    setDragIndex(null);
    setDropIndex(null);
    setIsDraggingActive(false);
  };

  const handleDragEndNative = () => {
    setDragIndex(null);
    setDropIndex(null);
    setIsDraggingActive(false);
  };

  // ─── DnD @dnd-kit sensors (mobile) ───────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Referência ao scroll container do dashboard para o DnD calcular posições corretamente
  useEffect(() => {
  }, []);

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Rastrear posição do cursor globalmente
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDragStart = (event) => {
    const { active } = event;
    const ex = exercicios.find(e => e._uid === active.id);
    setActiveDragItem(ex || null);
    setIndexEditando(null);
  };

  // 🔥 Move em tempo real enquanto arrasta — dá a animação de reorder
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setExercicios(prev => {
      const oldIndex = prev.findIndex(e => e._uid === active.id);
      const newIndex = prev.findIndex(e => e._uid === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;
    // A reorder já aconteceu no onDragOver, só marcamos como modificado
    setIsModificado(true);
  };

  // Garante que todos os exercícios têm _uid antes de criar os IDs
  useEffect(() => {
    setExercicios(prev => prev.map((ex, i) => ({
      ...ex,
      _uid: ex._uid || gerarUid()
    })));
  }, []);

  // IDs únicos estáveis para o dnd-kit
  const sortableIds = exercicios.map(e => e._uid).filter(Boolean);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    studentService.getAllStudents().then(d => setAlunos(d.filter(a => a.status === "Ativo"))).catch(() => showMsg("error", "Falha ao carregar atletas."));
  }, []);

  useEffect(() => {
    setBibliotecaLoading(true);
    trainingService.getAllExercises().then(setBiblioteca).catch(() => {}).finally(() => setBibliotecaLoading(false));
  }, []);

  useEffect(() => {
    templateService.getAll().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!alunoSelecionadoId) {
      setPlanos([]); setDiaSelecionado(1); setNotes(""); setExercicios([]);
      setSavedPlanId(null); setIsModificado(false); setAlunoSelecionado(null);
      return;
    }
    setAlunoSelecionado(alunos.find(a => a.id === parseInt(alunoSelecionadoId)) || null);
    carregarPlanosAluno(alunoSelecionadoId);
  }, [alunoSelecionadoId]);

  useEffect(() => {
    const plano = planos.find(p => p.dayNumber === diaSelecionado);
    if (plano) {
      setSavedPlanId(plano.id);
      setNotes(plano.notes || "");
      // Adiciona _uid estável a cada exercício carregado da BD
      setExercicios((plano.exercises || []).map((ex, i) => ({
        ...ex,
        _uid: ex._uid || gerarUid()
      })));
    }
    else { setSavedPlanId(null); setNotes(""); setExercicios([]); }
    setIsModificado(false); setIndexEditando(null);
  }, [diaSelecionado, planos]);

  const carregarPlanosAluno = async (id) => {
    try {
      setLoading(true);
      const dados = await trainingService.getPlansByStudent(id);
      setPlanos(dados || []);
      const diasDisponiveis = dados?.map(p => p.dayNumber).filter(Boolean).sort() || [];
      setDiaSelecionado(diasDisponiveis[0] || 1);
    } catch { showMsg("error", "Erro ao carregar os planos deste aluno."); }
    finally { setLoading(false); }
  };

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: "", text: "" }), 4000); };

  const diasExistentes = planos.map(p => p.dayNumber).filter(Boolean).sort((a,b) => a-b);
  const proximoDia = Math.min(MAX_DIAS, (Math.max(0, ...diasExistentes) + 1));
  const podeAdicionarDia = diasExistentes.length < MAX_DIAS;

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
    } else { setExerciseSelected(prev => ({ ...prev, gifUrl: url })); }
  };

  const handleAddExercicio = (e) => {
    e.preventDefault();
    const nome = exerciseSelected?.name || exerciseSearch.trim();
    if (!nome) return;
    setExercicios([...exercicios, {
      _uid: gerarUid(),
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

  const handleRemoveExercicio = (idx) => { setExercicios(exercicios.filter((_, i) => i !== idx)); setIsModificado(true); };

  const handleIniciarEdicao = (index, ex) => { setIndexEditando(index); setExercicioEditado({ sets: ex.sets, reps: ex.reps, restTime: ex.restTime, notes: ex.notes || "" }); };

  const handleSalvarEdicao = (index) => {
    const novos = [...exercicios];
    novos[index] = { ...novos[index], sets: parseInt(exercicioEditado.sets) || 4, reps: parseInt(exercicioEditado.reps) || 10, restTime: exercicioEditado.restTime.trim() || "60s", notes: exercicioEditado.notes.trim() };
    setExercicios(novos); setIsModificado(true); setIndexEditando(null);
  };

  const handleImportarTemplate = async (template) => {
    const diasDoTemplate = [...new Set(template.exercises.map(e => e.dayNumber || 1))].sort((a,b) => a-b);
    if (diasDoTemplate.length === 0) { showMsg('error', 'Este template não tem exercícios.'); setModalTemplateAberto(false); return; }
    if (planos.length > 0) { setModalConflito({ template, diasDoTemplate }); setModalTemplateAberto(false); }
    else { await exportarTemplate(template, diasDoTemplate, false); setModalTemplateAberto(false); }
  };

  const exportarTemplate = async (template, diasDoTemplate, substituir) => {
    try {
      setLoading(true);
      for (const dayNum of diasDoTemplate) {
        const exsDoDia = template.exercises.filter(e => (e.dayNumber || 1) === dayNum).map(ex => ({ exerciseName: ex.exerciseName, gifUrl: biblioteca.find(b => b.name.toLowerCase() === ex.exerciseName.toLowerCase())?.gifUrl || null, sets: ex.sets, reps: ex.reps, restTime: ex.restTime, notes: ex.notes || '' }));
        if (substituir) { const pe = planos.find(p => p.dayNumber === dayNum); if (pe?.id) await trainingService.deletePlan(pe.id); }
        await trainingService.saveTrainingPlan({ studentId: alunoSelecionadoId, name: `Dia ${dayNum}`, dayNumber: dayNum, notes: '', exercises: exsDoDia });
      }
      await carregarPlanosAluno(alunoSelecionadoId); setDiaSelecionado(diasDoTemplate[0]);
      showMsg('success', `Template "${template.name}" exportado! (${diasDoTemplate.length} dia(s))`);
    } catch { showMsg('error', 'Erro ao exportar template.'); }
    finally { setLoading(false); setModalConflito(null); }
  };

  const handleConflitoSubstituir = () => exportarTemplate(modalConflito.template, modalConflito.diasDoTemplate, true);
  const handleConflitoAdicionar = () => exportarTemplate(modalConflito.template, modalConflito.diasDoTemplate, false);

  const handleSavePlano = async () => {
    if (!alunoSelecionadoId) { showMsg("error", "Selecione primeiro um atleta."); return; }
    try {
      setLoading(true);
      const resultado = await trainingService.saveTrainingPlan({ studentId: alunoSelecionadoId, name: `Dia ${diaSelecionado}`, dayNumber: diaSelecionado, notes: notes.trim(), exercises: exercicios });
      setSavedPlanId(resultado.plan?.id || null);
      await carregarPlanosAluno(alunoSelecionadoId);
      showMsg("success", `Plano do Dia ${diaSelecionado} guardado com sucesso!`);
    } catch (err) { showMsg("error", typeof err === 'string' ? err : "Erro ao guardar o plano."); }
    finally { setLoading(false); }
  };

  const handleApagarDia = async () => {
    if (!savedPlanId) { setConfirmarApagarDia(false); showMsg("error", "Este dia ainda não foi guardado."); return; }
    try {
      setLoading(true);
      await trainingService.deletePlan(savedPlanId);
      await carregarPlanosAluno(alunoSelecionadoId);
      setConfirmarApagarDia(false);
      showMsg("success", `Dia ${diaSelecionado} eliminado.`);
    } catch { showMsg("error", "Erro ao eliminar o plano."); }
    finally { setLoading(false); }
  };

  const handleAbrirPreviewWhatsApp = () => {
    if (!alunoSelecionado) return;
    setWhatsappTexto(whatsappService.gerarTextoMensagem(alunoSelecionado.nome, exercicios, notes, alunoSelecionadoId));
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Prescrever Treinos</h1>
        <p className="mt-1 text-sm text-neutral-400">Selecione um aluno e gira os seus planos de treino por dia.</p>
      </div>

      {message.text && (
        <div className={`p-4 text-sm rounded-2xl border ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-neutral-400">Aluno*</label>
        <select value={alunoSelecionadoId} onChange={(e) => setAlunoSelecionadoId(e.target.value)} className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym">
          <option value="">Escolha um aluno na lista...</option>
          {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.whatsapp})</option>)}
        </select>
      </div>

      {alunoSelecionadoId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Coluna dias */}
          <div className="lg:col-span-1">
            <div className="p-4 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
              <h3 className="pb-2 text-xs font-bold tracking-wider uppercase border-b text-neutral-400 border-neutral-800">📅 Dias de Treino</h3>
              {loading ? (
                <div className="py-4 text-xs text-center text-neutral-500">A carregar...</div>
              ) : (
                <div className="space-y-1.5">
                  {Array.from({ length: MAX_DIAS }, (_, i) => i + 1).map(dia => {
                    const plano = planos.find(p => p.dayNumber === dia);
                    const existe = !!plano;
                    const isAtivo = diaSelecionado === dia;
                    if (!existe && dia !== proximoDia) return null;
                    return (
                      <button key={dia} onClick={() => { if (isModificado && !window.confirm("Tens alterações não guardadas. Continuar?")) return; setDiaSelecionado(dia); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isAtivo ? "bg-fitnessGym text-white shadow-lg shadow-red-500/20" : existe ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "border border-dashed border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"}`}>
                        <span>Dia {dia}</span>
                        {existe ? <span className="text-[10px] opacity-70">{plano.exercises?.length || 0} ex.</span> : <span className="text-[10px]">+ Novo</span>}
                      </button>
                    );
                  })}
                  {!podeAdicionarDia && <p className="pt-1 text-[10px] text-center text-neutral-600">Máximo de 7 dias atingido.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">📋 Dia {diaSelecionado}{planos.find(p => p.dayNumber === diaSelecionado) ? "" : " — Novo Plano"}</h2>
                <p className="text-xs text-neutral-500">{exercicios.length} exercício(s) · {isModificado ? <span className="text-amber-400">● Não guardado</span> : <span className="text-emerald-400">● Guardado</span>}</p>
              </div>
              <div className="flex items-center gap-2">
                {templates.length > 0 && (
                  <button onClick={() => setModalTemplateAberto(true)} className="px-3 py-1.5 text-xs font-bold text-white transition-colors border rounded-lg cursor-pointer border-neutral-700 bg-neutral-800 hover:bg-neutral-700">📋 Importar Template</button>
                )}
                {savedPlanId && (
                  <button onClick={() => setConfirmarApagarDia(true)} className="px-3 py-1.5 text-xs font-medium text-red-400 transition-colors border rounded-lg cursor-pointer border-red-900/30 hover:bg-red-950/20">🗑️ Apagar Dia</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Formulário */}
              <div className="p-5 space-y-4 border h-fit bg-neutral-900 border-neutral-800 rounded-2xl xl:col-span-1">
                <h3 className="pb-2 text-sm font-bold text-white border-b border-neutral-800">➕ Adicionar Exercício</h3>
                <form onSubmit={handleAddExercicio} className="space-y-3">
                  <div className="space-y-1" ref={dropdownRef}>
                    <label className="text-xs text-neutral-400">Nome * {bibliotecaLoading && <span className="text-neutral-600">(a carregar...)</span>}</label>
                    <div className="relative">
                      <input type="text" placeholder="Ex: Leg Press 45º" value={exerciseSearch} onChange={(e) => { setExerciseSearch(e.target.value); setExerciseSelected(null); setShowDropdown(true); }} onFocus={() => { if (exerciseSearch.trim().length >= 1) setShowDropdown(true); }} className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" required autoComplete="off" />
                      {showDropdown && sugestoes.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 overflow-y-auto border shadow-xl border-neutral-700 rounded-xl bg-neutral-900 max-h-48">
                          {sugestoes.map(ex => (
                            <li key={ex.id} onMouseDown={() => handleSelectExercise(ex)} className="flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer hover:bg-neutral-800">
                              {ex.gifUrl ? <img src={resolverGifUrl(ex.gifUrl)} alt={ex.name} className="flex-shrink-0 object-cover border rounded-lg w-9 h-9 border-neutral-700" onError={e => e.target.style.display = "none"} /> : <div className="flex items-center justify-center flex-shrink-0 text-xs border rounded-lg w-9 h-9 border-neutral-800 bg-neutral-950 text-neutral-600">🏋️</div>}
                              <div className="min-w-0"><p className="text-xs font-semibold text-white truncate">{ex.name}</p><p className="text-[10px] text-neutral-500 uppercase">{ex.category}</p></div>
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
                      {biblioteca.filter(ex => ex.gifUrl).map(ex => <option key={`gif-${ex.id}`} value={ex.gifUrl}>{ex.name}</option>)}
                    </select>
                  </div>
                  {exerciseSelected?.gifUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded-xl bg-neutral-950 border-neutral-800">
                      <img src={resolverGifUrl(exerciseSelected.gifUrl)} alt={exerciseSelected.name} className="flex-shrink-0 object-cover w-12 h-12 border rounded-lg border-neutral-800" />
                      <span className="text-[10px] text-emerald-400">✔ GIF Vinculado</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-[10px] text-neutral-400">Séries</label><input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" /></div>
                    <div><label className="text-[10px] text-neutral-400">Reps</label><input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" /></div>
                    <div><label className="text-[10px] text-neutral-400">Descanso</label><input type="text" value={restTime} onChange={e => setRestTime(e.target.value)} className="w-full px-2 py-1.5 mt-0.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-lg focus:border-fitnessGym" /></div>
                  </div>
                  <div><label className="text-[10px] text-neutral-400">Notas</label><textarea rows="2" value={exNotes} onChange={e => setExNotes(e.target.value)} placeholder="Ex: Carga progressiva..." className="w-full px-3 py-2 mt-0.5 text-xs text-white border outline-none resize-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym" /></div>
                  <button type="submit" className="w-full py-2 text-xs font-medium text-white transition-colors cursor-pointer bg-neutral-800 hover:bg-neutral-700 rounded-xl">Injetar na Lista</button>
                </form>
              </div>

              {/* Zona de exercícios */}
              <div className="space-y-4 xl:col-span-2">
                <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">🏋️ Plano de Treino — Dia {diaSelecionado}</label>
                    <input type="text" placeholder="Ex: Foco em hipertrofia..." value={notes} onChange={e => { setNotes(e.target.value); setIsModificado(true); }} className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600" />
                  </div>

                  {/* Indicador de drag */}
                  {exercicios.length > 1 && (
                    <p className="text-[10px] text-neutral-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      Arrasta pelo ícone ⠿ para reordenar os exercícios
                    </p>
                  )}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                    measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                  >
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>

                      {/* DESKTOP: drag HTML5 nativo */}
                      <div className="hidden md:block space-y-2">
                        {exercicios.length > 0 ? exercicios.map((ex, index) => (
                          <DragRow
                            key={ex._uid || index}
                            ex={ex}
                            index={index}
                            dragIndex={dragIndex}
                            dropIndex={dropIndex}
                            isDraggingActive={isDraggingActive}
                            onDragStart={handleDragStartNative}
                            onDragOver={handleDragOverNative}
                            onDrop={handleDropNative}
                            onDragEnd={handleDragEndNative}
                            estaEditando={indexEditando === index}
                            exercicioEditado={exercicioEditado}
                            setExercicioEditado={setExercicioEditado}
                            handleIniciarEdicao={handleIniciarEdicao}
                            handleSalvarEdicao={handleSalvarEdicao}
                            setIndexEditando={setIndexEditando}
                            handleRemoveExercicio={handleRemoveExercicio}
                            isModificado={isModificado}
                            setModalExerciseName={setModalExerciseName}
                            setIsModalOpen={setIsModalOpen}
                          />
                        )) : (
                          <div className="p-6 text-xs italic text-center border border-dashed text-neutral-600 border-neutral-800 rounded-xl">Nenhum exercício. Adiciona pelo formulário ao lado.</div>
                        )}
                      </div>

                      {/* MOBILE: Cartões */}
                      <div className="space-y-3 md:hidden">
                        {exercicios.length > 0 ? exercicios.map((ex, index) => (
                          <SortableCard
                            key={ex._uid}
                            ex={ex}
                            index={index}
                            estaEditando={indexEditando === index}
                            exercicioEditado={exercicioEditado}
                            setExercicioEditado={setExercicioEditado}
                            handleIniciarEdicao={handleIniciarEdicao}
                            handleSalvarEdicao={handleSalvarEdicao}
                            setIndexEditando={setIndexEditando}
                            handleRemoveExercicio={handleRemoveExercicio}
                            isModificado={isModificado}
                            setModalExerciseName={setModalExerciseName}
                            setIsModalOpen={setIsModalOpen}
                          />
                        )) : (
                          <div className="p-6 text-xs italic text-center border border-dashed text-neutral-600 border-neutral-800 rounded-xl">Nenhum exercício adicionado ainda.</div>
                        )}
                      </div>

                    </SortableContext>

                    {/* Overlay manual via portal — segue o cursor com position:fixed */}
                    {activeDragItem && createPortal(
                      <div
                        style={{
                          position: 'fixed',
                          left: cursorPos.x + 16,
                          top: cursorPos.y - 24,
                          width: '380px',
                          zIndex: 9999,
                          pointerEvents: 'none',
                        }}
                        className="bg-neutral-800 border border-red-500/40 rounded-xl shadow-2xl shadow-black/80 px-4 py-3 flex items-center gap-3 opacity-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                        {activeDragItem.gifUrl ? (
                          <img src={resolverGifUrl(activeDragItem.gifUrl)} alt={activeDragItem.exerciseName} className="w-10 h-10 object-cover rounded-lg border border-neutral-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-600 text-xs flex items-center justify-center shrink-0">—</div>
                        )}
                        <span className="font-bold text-white truncate flex-1">{activeDragItem.exerciseName}</span>
                        <span className="text-xs text-neutral-400 shrink-0 font-mono">{activeDragItem.sets}×{activeDragItem.reps} · {activeDragItem.restTime}</span>
                      </div>,
                      document.body
                    )}
                  </DndContext>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button onClick={handleAbrirPreviewWhatsApp} disabled={exercicios.length === 0 || isModificado || !alunoSelecionadoId} className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors cursor-pointer border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto">
                      <img src="/whatsapp.png" alt="WhatsApp" className="object-contain w-5 h-5" />
                      {isModificado ? "Grave para Ativar" : "Enviar para o WhatsApp"}
                    </button>
                    <button onClick={handleSavePlano} disabled={loading} className="w-full px-6 py-2.5 rounded-xl bg-fitnessGym hover:bg-red-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-red-500/10 disabled:opacity-40 sm:w-auto">
                      {loading ? "A Gravar..." : `Sincronizar Dia ${diaSelecionado}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WeightModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} studentId={alunoSelecionadoId} exerciseName={modalExerciseName} />

      {confirmarApagarDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 space-y-4 text-center border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto border rounded-full bg-red-500/10 border-red-500/20"><span className="text-lg">🗑️</span></div>
            <div><h3 className="font-bold text-white">Eliminar Dia {diaSelecionado}?</h3><p className="mt-1 text-xs text-neutral-400">Todos os exercícios deste dia serão apagados permanentemente.</p></div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarApagarDia(false)} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 cursor-pointer">Cancelar</button>
              <button onClick={handleApagarDia} className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 cursor-pointer">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && alunoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b bg-neutral-950/60 border-neutral-800">
              <div><h3 className="text-xs font-black tracking-wider text-red-500 uppercase">Confirmação de Envio</h3><p className="text-xs text-neutral-400 mt-0.5">Destinatário: {alunoSelecionado.nome} · Dia {diaSelecionado}</p></div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 text-sm cursor-pointer text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-[#0b141a] max-h-[380px] overflow-y-auto">
              <div className="max-w-[85%] ml-auto bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none p-3 shadow-md">
                <pre className="font-sans text-xs leading-relaxed whitespace-pre-wrap">{whatsappTexto}</pre>
                <div className="text-[10px] text-[#8696a0] text-right mt-1 font-mono">{new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} ✔✔</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 border-t bg-neutral-950/40 border-neutral-800">
              <button onClick={() => setIsPreviewOpen(false)} className="w-full py-2.5 text-xs font-bold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl cursor-pointer">Ajustar</button>
              <button onClick={() => { const url = whatsappService.enviarPlanoTreino(alunoSelecionado.whatsapp, alunoSelecionado.nome, exercicios, notes, alunoSelecionadoId); if (url) window.open(url, "_blank"); setIsPreviewOpen(false); }} className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-fitnessGym text-white hover:bg-red-700 rounded-xl cursor-pointer">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {modalTemplateAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div><h3 className="font-bold text-white">📋 Importar Template</h3><p className="text-xs text-neutral-500 mt-0.5">Escolhe um template para o Dia {diaSelecionado}</p></div>
              <button onClick={() => setModalTemplateAberto(false)} className="text-sm cursor-pointer text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {templates.map(t => (
                <div key={t.id} className="p-4 transition-colors border cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl hover:border-neutral-700" onClick={() => handleImportarTemplate(t)}>
                  <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-white">{t.name}</h4><span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">{t.exercises.length} ex.</span></div>
                  {t.description && <p className="mb-2 text-xs text-neutral-500">{t.description}</p>}
                  <div className="space-y-1">{t.exercises.slice(0, 3).map((ex, idx) => <p key={idx} className="text-xs text-neutral-400">• {ex.exerciseName} — {ex.sets}×{ex.reps}</p>)}{t.exercises.length > 3 && <p className="text-[10px] text-neutral-600">+{t.exercises.length - 3} mais...</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalConflito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 space-y-4 text-center border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            <span className="text-3xl">⚠️</span>
            <div><h3 className="font-bold text-white">Já existem planos</h3><p className="mt-1 text-xs text-neutral-400">O aluno já tem {planos.length} plano(s). O template <span className="font-semibold text-white">"{modalConflito.template.name}"</span> tem {modalConflito.diasDoTemplate.length} dia(s). O que queres fazer?</p></div>
            <div className="space-y-2">
              <button onClick={handleConflitoSubstituir} className="w-full py-2.5 text-xs font-bold text-white rounded-xl bg-fitnessGym hover:bg-red-700 cursor-pointer">🔄 Substituir dias existentes</button>
              <button onClick={handleConflitoAdicionar} className="w-full py-2.5 text-xs font-bold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer">➕ Adicionar sem substituir</button>
              <button onClick={() => setModalConflito(null)} className="w-full py-2 text-xs cursor-pointer text-neutral-500 hover:text-neutral-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador ↕ que segue o rato durante drag no desktop */}
      {isDraggingActive && createPortal(
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 14,
            top: mousePos.y - 14,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-red-500/40 shadow-xl shadow-black/60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="text-[11px] font-bold text-red-400">Mover</span>
        </div>,
        document.body
      )}

    </div>
  );
}