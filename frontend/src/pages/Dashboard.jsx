import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTrainerMetrics } from '../services/adminService';
import { getSystemStatus } from '../services/diagnosticsService'; // 🔥 NOVO

// 🔥 NOVO: Badge de estado reutilizável (verde = online, vermelho = erro, cinza = não configurado/informativo)
function StatusBadge({ status }) {
  const config = {
    online: { cor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Online', dot: 'bg-emerald-500' },
    erro: { cor: 'bg-red-500/10 border-red-500/20 text-red-400', label: 'Erro', dot: 'bg-red-500' },
    'não configurado': { cor: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Não configurado', dot: 'bg-amber-500' },
    informativo: { cor: 'bg-blue-500/10 border-blue-500/20 text-blue-400', label: 'Info', dot: 'bg-blue-500' },
  };
  const c = config[status] || config['não configurado'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.cor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'online' ? 'animate-pulse' : ''}`}></span>
      {c.label}
    </span>
  );
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const isAdmin = role === 'ADMIN';

  // Estados para controlar os dados reais do PT e o estado de loading
  const [metrics, setMetrics] = useState({ totalAlunos: 0, totalPlanos: 0, totalExercicios: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(!isAdmin);

  // 🔥 NOVO: Estados para o diagnóstico de sistema do ADMIN
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(isAdmin);
  const [statusError, setStatusError] = useState('');

  // Procura as métricas na BD se o utilizador for um PT
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

  // 🔥 NOVO: Procura o estado dos serviços ligados se o utilizador for ADMIN
  const carregarSystemStatus = async () => {
    try {
      setLoadingStatus(true);
      setStatusError('');
      const dados = await getSystemStatus();
      setSystemStatus(dados);
    } catch (err) {
      console.error('Erro ao carregar diagnóstico do sistema:', err);
      setStatusError(err.message || 'Não foi possível verificar o estado dos serviços.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      carregarSystemStatus();
    }
  }, [isAdmin]);

  // ==========================================
  // 👑 CASO 1: PAINEL DE CONTROLO EXCLUSIVO DO ADMIN
  // ==========================================
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Painel de Controlo Segurança</h1>
            <p className="text-sm text-neutral-400">
              Olá, <span className="font-semibold text-white">{user?.nome}</span>. Bem-vindo à consola central de administração global.
            </p>
          </div>
          <button
            onClick={carregarSystemStatus}
            disabled={loadingStatus}
            className="px-4 py-2 text-xs font-bold transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-xl text-neutral-300 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingStatus ? '🔄 A verificar...' : '🔄 Atualizar Diagnóstico'}
          </button>
        </div>

        {/* 🔥 NOVO: Painel de Diagnóstico de Infraestrutura em tempo real */}
        <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white">🩺 Diagnóstico de Infraestrutura</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                {systemStatus
                  ? `Última verificação: ${new Date(systemStatus.resumo.verificadoEm).toLocaleTimeString('pt-PT')}`
                  : 'A testar a ligação a cada serviço...'}
              </p>
            </div>
            {systemStatus && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                systemStatus.resumo.tudoOk
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {systemStatus.resumo.tudoOk ? '✅ Tudo Operacional' : `⚠️ ${systemStatus.resumo.totalErros} Serviço(s) com Erro`}
              </span>
            )}
          </div>

          {statusError ? (
            <div className="p-4 text-xs font-medium text-center text-red-400 border bg-red-950/20 border-red-900/30 rounded-xl">
              ⚠️ {statusError}
            </div>
          ) : loadingStatus && !systemStatus ? (
            <div className="py-8 text-sm text-center text-neutral-500">A contactar os serviços ligados...</div>
          ) : systemStatus ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Backend / Railway */}
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">⚙️ {systemStatus.backend.nome}</p>
                  <StatusBadge status={systemStatus.backend.status} />
                </div>
                <p className="text-[11px] text-neutral-500">Uptime: <span className="font-mono text-neutral-300">{systemStatus.backend.uptime}</span></p>
                <p className="text-[11px] text-neutral-500">Ambiente: <span className="font-mono text-neutral-300">{systemStatus.backend.ambiente}</span></p>
              </div>

              {/* Base de Dados */}
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">🗄️ {systemStatus.database.nome}</p>
                  <StatusBadge status={systemStatus.database.status} />
                </div>
                <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.database.tempoResposta}</span></p>
                {systemStatus.database.erro && (
                  <p className="text-[11px] text-red-400 truncate" title={systemStatus.database.erro}>Erro: {systemStatus.database.erro}</p>
                )}
              </div>

              {/* Email / Resend */}
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">📧 {systemStatus.email.nome}</p>
                  <StatusBadge status={systemStatus.email.status} />
                </div>
                {systemStatus.email.tempoResposta && (
                  <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.email.tempoResposta}</span></p>
                )}
                {systemStatus.email.erro && (
                  <p className="text-[11px] text-red-400 truncate" title={systemStatus.email.erro}>Erro: {systemStatus.email.erro}</p>
                )}
                {systemStatus.email.status === 'não configurado' && (
                  <p className="text-[11px] text-amber-500/80">RESEND_API_KEY não definida no Railway.</p>
                )}
              </div>

              {/* Cloudinary */}
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">🖼️ {systemStatus.storage.nome}</p>
                  <StatusBadge status={systemStatus.storage.status} />
                </div>
                {systemStatus.storage.tempoResposta && (
                  <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.storage.tempoResposta}</span></p>
                )}
                {systemStatus.storage.erro && (
                  <p className="text-[11px] text-red-400 truncate" title={systemStatus.storage.erro}>Erro: {systemStatus.storage.erro}</p>
                )}
                {systemStatus.storage.status === 'não configurado' && (
                  <p className="text-[11px] text-amber-500/80">Credenciais Cloudinary em falta no Railway.</p>
                )}
              </div>

              {/* Frontend / Vercel */}
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl sm:col-span-2 lg:col-span-1">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">🌐 {systemStatus.frontend.nome}</p>
                  <StatusBadge status={systemStatus.frontend.status} />
                </div>
                <div className="space-y-1">
                  {systemStatus.frontend.dominiosPermitidos.map((dominio, i) => (
                    <p key={i} className="text-[11px] text-neutral-400 font-mono truncate">{dominio}</p>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-600">Domínios autorizados via CORS</p>
              </div>
            </div>
          ) : null}

          <p className="pt-2 text-[10px] text-neutral-600 border-t border-neutral-900">
            ℹ️ Este painel testa a ligação real a cada serviço a partir do backend. Não mostra prazos de subscrição do Railway/Vercel — esses dados não são expostos sem autenticação adicional nesses painéis externos.
          </p>
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
            <h3 className="text-base font-bold text-white">Nível de Segurança</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border bg-neutral-950 rounded-xl border-neutral-800/60">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">Autenticação</p>
                <p className="text-sm font-bold text-blue-400">JWT + RBAC</p>
              </div>
              <div className="p-3 border bg-neutral-950 rounded-xl border-neutral-800/60">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">Acessos</p>
                <p className="text-sm font-bold text-emerald-400">Controlados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 💪 CASO 2: PAINEL DO PT
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

      {/*NOVO: Atalhos rápidos para as ações mais usadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate('/dashboard/treinos')}
          className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group"
        >
          <span className="text-2xl">📋</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Prescrever Treino</p>
          <p className="text-xs text-neutral-500">Criar ou editar um plano</p>
        </button>
        <button
          onClick={() => navigate('/dashboard/galeria')}
          className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group"
        >
          <span className="text-2xl">🏋️</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Galeria de Exercícios</p>
          <p className="text-xs text-neutral-500">Adicionar novos GIFs</p>
        </button>
        <button
          onClick={() => navigate('/dashboard/alunos')}
          className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group"
        >
          <span className="text-2xl">👥</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Gerir Alunos</p>
          <p className="text-xs text-neutral-500">Ver e editar atletas</p>
        </button>
      </div>

      <div className="p-10 text-sm text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 bg-neutral-900/20">
        🗂️ Seleciona uma das opções na barra lateral para começar a trabalhar.
      </div>
    </div>
  );
}