import React, { useState, useEffect } from "react";
import studentService from "../services/studentService";
import trainingService from "../services/trainingService";
import whatsappService from "../services/whatsappService";

export default function Treinos() {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [notes, setNotes] = useState("");
  const [exercicios, setExercicios] = useState([]);

  // Estados de controlo do formulário de novo exercício
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("10");
  const [restTime, setRestTime] = useState("60s");
  const [exNotes, setExNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // 🔥 Controla se o plano visualizado tem alterações pendentes de gravação
  const [isModificado, setIsModificado] = useState(false);

  // Carregar lista de alunos para a caixa de seleção (Select)
  useEffect(() => {
    const carregarAlunos = async () => {
      try {
        const dados = await studentService.getAllStudents();
        setAlunos(dados.filter((a) => a.status === "Ativo"));
      } catch (err) {
        showMsg("error", "Falha ao carregar atletas para o menu.");
      }
    };
    carregarAlunos();
  }, []);

  // Escutar a troca de aluno para carregar o plano existente no MySQL
  useEffect(() => {
    if (!alunoSelecionadoId) {
      limparFormularioCompleto();
      return;
    }
    carregarPlanoAluno(alunoSelecionadoId);
  }, [alunoSelecionadoId]);

  const carregarPlanoAluno = async (id) => {
    try {
      setLoading(true);
      const plano = await trainingService.getPlanByStudent(id);
      if (plano) {
        setNotes(plano.notes || "");
        setExercicios(
          plano.exercises.map((ex) => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            notes: ex.notes,
          })),
        );
      } else {
        setNotes("");
        setExercicios([]);
      }
      // 🔥 Acabou de carregar do banco, o estado atual está idêntico ao MySQL
      setIsModificado(false);
    } catch (err) {
      showMsg("error", "Erro ao carregar o plano deste aluno.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Adicionar exercício dinamicamente à lista local da tabela
  const handleAddExercicio = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const novoEx = {
      exerciseName: exerciseName.trim(),
      sets: parseInt(sets) || 4,
      reps: parseInt(reps) || 10,
      restTime: restTime.trim() || "60s",
      notes: exNotes.trim(),
    };

    setExercicios([...exercicios, novoEx]);
    
    // 🔥 Ativa o bloqueio porque a lista local mudou em relação ao banco
    setIsModificado(true);

    setExerciseName("");
    setExNotes("");
  };

  // Remover exercício da lista local antes de guardar
  const handleRemoveExercicioLocal = (indexParaRemover) => {
    setExercicios(exercicios.filter((_, idx) => idx !== indexParaRemover));
    // 🔥 Ativa o bloqueio porque removeu um item localmente
    setIsModificado(true);
  };

  const limparFormularioCompleto = () => {
    setNotes("");
    setExercicios([]);
    setAlunoSelecionadoId("");
    setIsModificado(false);
  };

  // Submeter o plano completo estruturado para o Backend
  const handleSavePlanoGeral = async () => {
    if (!alunoSelecionadoId) {
      showMsg("error", "Selecione primeiro um atleta da lista.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        studentId: alunoSelecionadoId,
        notes: notes.trim(),
        exercises: exercicios,
      };

      await trainingService.saveTrainingPlan(payload);
      
      // 🔥 Desbloqueia o botão do WhatsApp: O plano local agora está salvo no MySQL!
      setIsModificado(false);

      showMsg(
        "success",
        "Plano de treino updated e sincronizado no MySQL com sucesso!",
      );
    } catch (err) {
      showMsg("error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Prescrever Treinos
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Selecione um atleta ativo e monte a sua rotina de exercícios personalizada.
        </p>
      </div>

      {/* Alertas Rápidos */}
      {message.text && (
        <div
          className={`p-4 text-sm rounded-2xl border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-fitnessGym"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* Seleção de Aluno */}
      <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-neutral-400">
          Aluno*
        </label>
        <select
          value={alunoSelecionadoId}
          onChange={(e) => setAlunoSelecionadoId(e.target.value)}
          className="w-full max-w-md px-4 py-3 text-sm text-white transition-colors border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
        >
          <option value="">
            Escolha um aluno na lista para gerir o treino...
          </option>
          {alunos.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome} ({aluno.whatsapp})
            </option>
          ))}
        </select>
      </div>

      {alunoSelecionadoId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulário lateral de Adicionar Exercício */}
          <div className="p-5 space-y-4 border h-fit bg-neutral-900 border-neutral-800 rounded-2xl">
            <h2 className="pb-2 text-lg font-bold text-white border-b border-neutral-800">
              ➕ Adicionar Exercício
            </h2>
            <form onSubmit={handleAddExercicio} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Leg Press 45º"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Séries</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Reps</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Descanso</label>
                  <input
                    type="text"
                    value={restTime}
                    onChange={(e) => setRestTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400">
                  Notas / Instruções Técnicas
                </label>
                <textarea
                  placeholder="Ex: Carga progressiva, cadência 3-1-1..."
                  rows="2"
                  value={exNotes}
                  onChange={(e) => setExNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-white border outline-none resize-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-medium text-white transition-colors cursor-pointer bg-neutral-800 hover:bg-neutral-700 rounded-xl"
              >
                Injetar na Lista
              </button>
            </form>
          </div>

          {/* Tabela de Visualização Global do Treino Ativo */}
          <div className="space-y-4 lg:col-span-2">
            <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h2 className="text-lg font-bold text-white">
                  📋 Estrutura da Ficha de Treino
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  {exercicios.length} Exercício(s)
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-sm text-center text-neutral-500">
                  🔄 A ler informações em tempo real do banco de dados...
                </div>
              ) : (
                <>
                  {/* Caixa de Observações Gerais do Plano */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                      Observações do Plano de Treino (Foco Geral)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Foco em hipertrofia - Progressão de carga na última série."
                      value={notes}
                      // 🔥 Atualiza as notas e liga o estado modificado
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setIsModificado(true);
                      }}
                      className="w-full px-4 py-3 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600"
                    />
                  </div>

                  {/* Lista de Exercícios Adicionados */}
                  <div className="overflow-hidden border border-neutral-800 rounded-xl bg-neutral-950">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-medium tracking-wider uppercase border-b bg-neutral-900 text-neutral-400 border-neutral-800">
                          <th className="p-3">Exercício</th>
                          <th className="p-3 text-center">Séries</th>
                          <th className="p-3 text-center">Reps</th>
                          <th className="p-3 text-center">Descanso</th>
                          <th className="p-3">Notas Técnicas</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {exercicios.length > 0 ? (
                          exercicios.map((ex, index) => (
                            <tr
                              key={index}
                              className="transition-colors hover:bg-neutral-900/40"
                            >
                              <td className="p-3 font-semibold text-white">
                                {ex.exerciseName}
                              </td>
                              <td className="p-3 font-mono text-center">
                                {ex.sets}
                              </td>
                              <td className="p-3 font-mono text-center">
                                {ex.reps}
                              </td>
                              <td className="p-3 font-mono text-center text-neutral-400">
                                {ex.restTime}
                              </td>
                              <td
                                className="p-3 text-xs text-neutral-400 max-w-[180px] truncate"
                                title={ex.notes}
                              >
                                {ex.notes || "-"}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() =>
                                    handleRemoveExercicioLocal(index)
                                  }
                                  className="text-xs font-medium text-red-400 transition-colors cursor-pointer hover:text-red-500"
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="p-6 text-xs italic text-center text-neutral-600"
                            >
                              Nenhum exercício adicionado a este plano de treino. Comece a injetar no painel lateral.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Painel Inferior de Gravação e Envio */}
                  <div className="flex justify-end gap-3 pt-2">
                    
                    {/* Botão Enviar por WhatsApp Controlado */}
                    <button
                      onClick={() => {
                        const alunoAtual = alunos.find(
                          (a) => a.id === parseInt(alunoSelecionadoId),
                        );
                        if (!alunoAtual) return;

                        const urlUrl = whatsappService.enviarPlanoTreino(
                          alunoAtual.whatsapp,
                          alunoAtual.nome,
                          exercicios,
                          notes,
                        );

                        if (urlUrl) {
                          window.open(urlUrl, "_blank");
                        }
                      }}
                      // 🔥 Bloqueia se não houver exercícios OU se houver alterações por salvar no banco
                      disabled={exercicios.length === 0 || isModificado}
                      className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors cursor-pointer border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      title={isModificado ? "Grave as alterações no MySQL primeiro para poder partilhar" : "Enviar ficha atual"}
                    >
                      <img
                        src="/whatsapp.png"
                        alt="WhatsApp"
                        className="object-contain w-5 h-5"
                      />
                      {/* 🔥 Texto Dinâmico */}
                      {isModificado ? "Grave para Ativar Envio" : "Enviar para o WhatsApp"}
                    </button>

                    <button
                      onClick={handleSavePlanoGeral}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-fitnessGym hover:bg-emerald-600 text-neutral-950 font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      {loading ? "A Gravar..." : "Sincronizar Plano no MySQL"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}