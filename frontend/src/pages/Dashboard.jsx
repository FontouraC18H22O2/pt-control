import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dashboardService from "../services/dashboardService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalPlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carregar os dados reais do MySQL assim que o ecrã abre
  useEffect(() => {
    const carregarMetricas = async () => {
      try {
        setLoading(true);
        const dados = await dashboardService.getStats();
        setStats(dados);
      } catch (err) {
        setError(
          "Não foi possível sincronizar os dados do Dashboard em tempo real.",
        );
      } finally {
        setLoading(false);
      }
    };

    carregarMetricas();
  }, []);

  // Cálculo da percentagem de retenção/atividade de alunos
  const taxaAtividade =
    stats.totalStudents > 0
      ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-neutral-400 text-sm">
        <div className="space-y-2 text-center">
          <div className="text-2xl animate-spin">🔄</div>
          <p>A calcular métricas e estatísticas do ginásio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bloco de Boas-Vindas */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Painel de Controlo
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Bem-vindo de volta! Aqui está o resumo operacional e de retenção dos
          teus atletas.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-400 border bg-red-500/10 border-red-500/20 rounded-2xl">
          ⚠️ {error}
        </div>
      )}

      {/* Grid de Cartões de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total de Alunos */}
        <div className="p-6 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Total de Atletas
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-extrabold text-white">
              {stats.totalStudents}
            </span>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-xs text-neutral-500">Registados globalmente</p>
        </div>

        {/* Card 2: Alunos Ativos */}
        <div className="p-6 space-y-2 border border-l-4 bg-neutral-900 border-neutral-800 rounded-2xl border-l-fitnessGym">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Atletas Ativos
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-extrabold text-fitnessGym">
              {stats.activeStudents}
            </span>
            <span className="text-lg">🟢</span>
          </div>
          <p className="text-xs text-neutral-500">
            Com acesso ativo ao ginásio
          </p>
        </div>

        {/* Card 3: Alunos Inativos */}
        <div className="p-6 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Atletas Inativos
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-extrabold text-neutral-400">
              {stats.inactiveStudents}
            </span>
            <span className="text-lg">🔴</span>
          </div>
          <p className="text-xs text-neutral-500">
            Subscrição ou treino suspenso
          </p>
        </div>

        {/* Card 4: Fichas de Treino */}
        <div className="p-6 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Fichas de Treino
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-extrabold text-white">
              {stats.totalPlans}
            </span>
            <span className="text-lg">🏋️‍♂️</span>
          </div>
          <p className="text-xs text-neutral-500">
            Rotinas montadas no sistema
          </p>
        </div>
      </div>

      {/* Secção Intermédia: Taxa de Saúde Operacional */}
      <div className="grid items-center grid-cols-1 gap-6 p-6 border bg-neutral-900 border-neutral-800 rounded-2xl md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-lg font-bold text-white">
            Taxa de Ocupação Ativa
          </h2>
          <p className="text-sm text-neutral-400">
            Esta métrica representa a percentagem de alunos matriculados que
            estão a treinar ativamente sob a tua tutela neste momento. Mantém
            este valor acima dos 80% para garantir uma boa taxa de retenção!
          </p>
        </div>
        <div className="p-4 text-center border bg-neutral-950 rounded-xl border-neutral-800">
          <div className="mb-1 font-mono text-5xl font-black text-fitnessGym">
            {taxaAtividade}%
          </div>
          <div className="text-xs font-bold tracking-widest uppercase text-neutral-500">
            Atletas Engajados
          </div>
        </div>
      </div>

      {/* Painel Inferior: Atalhos de Ação Rápida */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-400">
          Ações Operacionais Rápidas
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/dashboard/alunos")} // 👈 Atualizado para o caminho aninhado correto
            className="p-4 space-y-1 text-left text-white transition-all border cursor-pointer bg-neutral-950 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700 rounded-xl"
          >
            <div className="text-sm font-bold">➕ Matricular Atleta</div>
            <div className="text-xs text-neutral-500">
              Adicionar novos alunos à base de dados.
            </div>
          </button>

          <button
            onClick={() => navigate("/dashboard/treinos")} // 👈 Atualizado para o caminho aninhado correto
            className="p-4 space-y-1 text-left text-white transition-all border cursor-pointer bg-neutral-950 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700 rounded-xl"
          >
            <div className="text-sm font-bold">📝 Prescrever Nova Rotina</div>
            <div className="text-xs text-neutral-500">
              Montar ou alterar fichas de exercício.
            </div>
          </button>

          <div className="p-4 space-y-1 border bg-neutral-900/30 border-neutral-800 text-neutral-400 rounded-xl opacity-60">
            <div className="text-sm font-bold text-neutral-500">
              📊 Relatórios Financeiros
            </div>
            <div className="text-xs text-neutral-600">
              Brevemente (Módulo de Faturação).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
