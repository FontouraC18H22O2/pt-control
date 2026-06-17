import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTrainerMetrics } from '../services/adminService'; // 🔥 Importa a nova função do serviço

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const isAdmin = role === 'ADMIN';

  // 🔥 NOVO: Estados para controlar os dados reais do PT e o estado de loading
  const [metrics, setMetrics] = useState({ totalAlunos: 0, totalPlanos: 0, totalExercicios: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(!isAdmin); // Só faz loading se não for admin

  // 🔥 NOVO: Procura as métricas na BD se o utilizador for um PT
  useEffect(() => {
    if (!isAdmin) {
      const carregarMetricas = async () => {
        try {
          const dados = await getTrainerMetrics();
          setMetrics(dados);
        } catch (err) {
          console.error('Erro ao popular dashboard do PT:', err);
        } finally {
          setLoadingMetrics(false);
        }
      };
      carregarMetricas();
    }
  }, [isAdmin]);

  // ==========================================
  // 👑 CASO 1: PAINEL DE CONTROLO EXCLUSIVO DO ADMIN
  // ==========================================
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Painel de Controlo Segurança</h1>
          <p className="text-sm text-neutral-400">
            Olá, <span className="font-semibold text-white">{user?.nome}</span>. Bem-vindo à consola central de administração global.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="p-5 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Controlo de Acessos</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">Ativos</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-neutral-400">Base de dados MariaDB operacional.</p>
          </div>

          <div className="p-5 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Serviço de Notificações</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-500">SMTP</span>
            </div>
            <p className="text-xs text-neutral-400">Disparos de e-mails automáticos ativos.</p>
          </div>

          <div className="p-5 space-y-2 border bg-neutral-900 border-neutral-800 rounded-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Nível de Segurança</p>
            <span className="text-3xl font-black text-blue-400">JWT + RBAC</span>
            <p className="text-xs text-neutral-400">Tokens de autenticação encriptados.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="p-6 space-y-4 border lg:col-span-1 bg-neutral-900 border-neutral-800 rounded-2xl">
            <h3 className="text-base font-bold text-white">Ações Administrativas</h3>
            <p className="text-xs leading-relaxed text-neutral-400">
              Como administrador, as tuas funções estão restritas à criação, auditoria e revogação de acessos na plataforma fitness.
            </p>
            <button
              onClick={() => navigate('/dashboard/personal-trainers')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer shadow-lg shadow-red-500/10"
            >
              Ir para Gestão de PTs
            </button>
          </div>

          <div className="p-6 space-y-4 border lg:col-span-2 bg-neutral-900 border-neutral-800 rounded-2xl">
            <h3 className="text-base font-bold text-white">Histórico Recente do Servidor</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 border bg-neutral-950 rounded-xl border-neutral-800/60">
                <span className="text-emerald-400">[SUCCESS] Token verificado via authMiddleware</span>
                <span className="text-neutral-500">Agora mesmo</span>
              </div>
              <div className="flex items-center justify-between p-3 border bg-neutral-950 rounded-xl border-neutral-800/60">
                <span className="text-neutral-300">[EMAIL] Notificação de registo enviada com sucesso</span>
                <span className="text-neutral-500">Há 5 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 💪 CASO 2: PAINEL DO PT (MANTIDO IGUAL, AGORA COM DADOS REAIS)
  // ==========================================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Painel do Treinador</h1>
        <p className="text-sm text-neutral-400">
          Olá, <span className="font-semibold text-white">{user?.nome}</span>. Visualiza o resumo das tuas atividades desportivas e alunos.
        </p>
      </div>

      {/* Cartões do PT alimentados pelo estado assíncrono */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Os Meus Alunos</p>
          <p className="mt-1 text-3xl font-black text-white">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">A carregar...</span> : metrics.totalAlunos}
          </p>
        </div>
        <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Planos Ativos</p>
          <p className="mt-1 text-3xl font-black text-white">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">A carregar...</span> : metrics.totalPlanos}
          </p>
        </div>
        <div className="p-5 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Exercícios na Galeria</p>
          <p className="mt-1 text-3xl font-black text-white">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">A carregar...</span> : metrics.totalExercicios}
          </p>
        </div>
      </div>

      <div className="p-10 text-sm text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 bg-neutral-900/20">
        🗂️ Seleciona uma das opções na barra lateral para começar a trabalhar.
      </div>
    </div>
  );
}