import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTrainerMetrics } from '../services/adminService';
import { getSystemStatus } from '../services/diagnosticsService';

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

// Cartão de métrica reutilizável
function MetricCard({ icon, label, value, sub, color = 'text-white', loading }) {
  return (
    <div className="p-5 space-y-1 border bg-neutral-900 border-neutral-800 rounded-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-3xl font-black ${color}`}>
        {loading ? <span className="text-sm font-normal text-neutral-500">A carregar...</span> : value}
      </p>
      {sub && <p className="text-[11px] text-neutral-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';

  const [metrics, setMetrics] = useState({
    totalAlunos: 0, totalAlunosAtivos: 0, totalAlunosInativos: 0,
    totalPlanos: 0, planosMes: 0, totalExercicios: 0, ultimosAlunos: []
  });
  const [loadingMetrics, setLoadingMetrics] = useState(!isAdmin);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(isAdmin);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      const carregar = async () => {
        try {
          const dados = await getTrainerMetrics();
          setMetrics(dados);
        } catch (err) {
          console.error('Erro ao popular dashboard do PT:', err);
        } finally {
          setLoadingMetrics(false);
        }
      };
      carregar();
    }
  }, [isAdmin]);

  const carregarSystemStatus = async () => {
    try {
      setLoadingStatus(true);
      setStatusError('');
      const dados = await getSystemStatus();
      setSystemStatus(dados);
    } catch (err) {
      setStatusError(err.message || 'Não foi possível verificar o estado dos serviços.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isAdmin) carregarSystemStatus();
  }, [isAdmin]);

  // ==========================================
  // 👑 PAINEL ADMIN
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
            <div className="p-4 text-xs font-medium text-center text-red-400 border bg-red-950/20 border-red-900/30 rounded-xl">⚠️ {statusError}</div>
          ) : loadingStatus && !systemStatus ? (
            <div className="py-8 text-sm text-center text-neutral-500">A contactar os serviços ligados...</div>
          ) : systemStatus ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">⚙️ {systemStatus.backend.nome}</p>
                  <StatusBadge status={systemStatus.backend.status} />
                </div>
                <p className="text-[11px] text-neutral-500">Uptime: <span className="font-mono text-neutral-300">{systemStatus.backend.uptime}</span></p>
                <p className="text-[11px] text-neutral-500">Ambiente: <span className="font-mono text-neutral-300">{systemStatus.backend.ambiente}</span></p>
              </div>
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">🗄️ {systemStatus.database.nome}</p>
                  <StatusBadge status={systemStatus.database.status} />
                </div>
                <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.database.tempoResposta}</span></p>
                {systemStatus.database.erro && <p className="text-[11px] text-red-400 truncate">Erro: {systemStatus.database.erro}</p>}
              </div>
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">📧 {systemStatus.email.nome}</p>
                  <StatusBadge status={systemStatus.email.status} />
                </div>
                {systemStatus.email.tempoResposta && <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.email.tempoResposta}</span></p>}
                {systemStatus.email.erro && <p className="text-[11px] text-red-400 truncate">Erro: {systemStatus.email.erro}</p>}
                {systemStatus.email.status === 'não configurado' && <p className="text-[11px] text-amber-500/80">RESEND_API_KEY não definida no Railway.</p>}
              </div>
              <div className="p-4 space-y-2 border bg-neutral-950 border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-white">🖼️ {systemStatus.storage.nome}</p>
                  <StatusBadge status={systemStatus.storage.status} />
                </div>
                {systemStatus.storage.tempoResposta && <p className="text-[11px] text-neutral-500">Tempo resposta: <span className="font-mono text-neutral-300">{systemStatus.storage.tempoResposta}</span></p>}
                {systemStatus.storage.erro && <p className="text-[11px] text-red-400 truncate">Erro: {systemStatus.storage.erro}</p>}
                {systemStatus.storage.status === 'não configurado' && <p className="text-[11px] text-amber-500/80">Credenciais Cloudinary em falta no Railway.</p>}
              </div>
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
            <p className="text-xs leading-relaxed text-neutral-400">Como administrador, as tuas funções estão restritas à criação, auditoria e revogação de acessos na plataforma fitness.</p>
            <button onClick={() => navigate('/dashboard/personal-trainers')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer shadow-lg shadow-red-500/10">
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
  // 💪 PAINEL DO PT
  // ==========================================
  const totalAlunos = (metrics.totalAlunosAtivos || 0) + (metrics.totalAlunosInativos || 0);
  const percAtivos = totalAlunos > 0 ? Math.round((metrics.totalAlunosAtivos / totalAlunos) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Painel do Treinador</h1>
        <p className="text-sm text-neutral-400">
          Olá, <span className="font-semibold text-white">{user?.nome}</span>. Aqui tens o resumo da tua atividade.
        </p>
      </div>

      {/* Linha 1: 4 cartões de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Alunos ativos */}
        <div className="col-span-2 p-5 space-y-1 border bg-neutral-900 border-neutral-800 rounded-2xl sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Alunos Ativos</p>
            <span className="text-lg">💪</span>
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">...</span> : metrics.totalAlunosAtivos}
          </p>
          <p className="text-[11px] text-neutral-500">
            {loadingMetrics ? '' : `${metrics.totalAlunosInativos} inativo(s) • ${percAtivos}% taxa ativa`}
          </p>
        </div>

        {/* Alunos inativos */}
        <div className="col-span-2 p-5 space-y-1 border bg-neutral-900 border-neutral-800 rounded-2xl sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Alunos Inativos</p>
            <span className="text-lg">😴</span>
          </div>
          <p className="text-3xl font-black text-neutral-400">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">...</span> : metrics.totalAlunosInativos}
          </p>
          <p className="text-[11px] text-neutral-500">
            {loadingMetrics ? '' : `de ${totalAlunos} aluno(s) no total`}
          </p>
        </div>

        {/* Planos este mês */}
        <div className="col-span-2 p-5 space-y-1 border bg-neutral-900 border-neutral-800 rounded-2xl sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Planos Este Mês</p>
            <span className="text-lg">📅</span>
          </div>
          <p className="text-3xl font-black text-blue-400">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">...</span> : metrics.planosMes}
          </p>
          <p className="text-[11px] text-neutral-500">
            {loadingMetrics ? '' : `${metrics.totalPlanos} plano(s) no total`}
          </p>
        </div>

        {/* Exercícios na galeria */}
        <div className="col-span-2 p-5 space-y-1 border bg-neutral-900 border-neutral-800 rounded-2xl sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Minha Galeria</p>
            <span className="text-lg">🏋️</span>
          </div>
          <p className="text-3xl font-black text-red-400">
            {loadingMetrics ? <span className="text-sm font-normal text-neutral-500">...</span> : metrics.totalExercicios}
          </p>
          <p className="text-[11px] text-neutral-500">exercício(s) adicionados</p>
        </div>
      </div>

      {/* Linha 2: Barra de progresso ativos/inativos + Últimos alunos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Distribuição de alunos */}
        <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <h3 className="text-sm font-bold text-white">📊 Distribuição de Alunos</h3>
          {loadingMetrics ? (
            <div className="py-4 text-xs text-center text-neutral-500">A carregar...</div>
          ) : totalAlunos === 0 ? (
            <div className="py-4 text-xs italic text-center text-neutral-500">Nenhum aluno registado ainda.</div>
          ) : (
            <div className="space-y-3">
              {/* Barra de progresso */}
              <div className="w-full h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full transition-all duration-700 rounded-full bg-emerald-500"
                  style={{ width: `${percAtivos}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-neutral-400">Ativos: <span className="font-bold text-white">{metrics.totalAlunosAtivos}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 inline-block"></span>
                  <span className="text-neutral-400">Inativos: <span className="font-bold text-white">{metrics.totalAlunosInativos}</span></span>
                </div>
              </div>
              <div className="p-3 text-center border bg-neutral-950 rounded-xl border-neutral-800">
                <p className="text-2xl font-black text-white">{percAtivos}%</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">taxa de alunos ativos</p>
              </div>
            </div>
          )}
        </div>

        {/* Últimos alunos adicionados */}
        <div className="p-5 space-y-4 border bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">🆕 Últimos Alunos Adicionados</h3>
            <button onClick={() => navigate('/dashboard/alunos')} className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer transition-colors">Ver todos →</button>
          </div>
          {loadingMetrics ? (
            <div className="py-4 text-xs text-center text-neutral-500">A carregar...</div>
          ) : !metrics.ultimosAlunos || metrics.ultimosAlunos.length === 0 ? (
            <div className="py-4 text-xs italic text-center text-neutral-500">Nenhum aluno adicionado ainda.</div>
          ) : (
            <div className="space-y-2">
              {metrics.ultimosAlunos.map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between p-3 border bg-neutral-950 rounded-xl border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-neutral-700">
                      {aluno.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{aluno.fullName}</p>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(aluno.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    aluno.status === 'Ativo'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                  }`}>
                    {aluno.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Linha 3: Atalhos rápidos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button onClick={() => navigate('/dashboard/treinos')} className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group">
          <span className="text-2xl">📋</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Prescrever Treino</p>
          <p className="text-xs text-neutral-500">Criar ou editar um plano</p>
        </button>
        <button onClick={() => navigate('/dashboard/galeria')} className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group">
          <span className="text-2xl">🏋️</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Galeria de Exercícios</p>
          <p className="text-xs text-neutral-500">Adicionar novos GIFs</p>
        </button>
        <button onClick={() => navigate('/dashboard/alunos')} className="p-4 text-left transition-colors border cursor-pointer bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-2xl group">
          <span className="text-2xl">👥</span>
          <p className="mt-2 text-sm font-bold text-white group-hover:text-red-400">Gerir Alunos</p>
          <p className="text-xs text-neutral-500">Ver e editar atletas</p>
        </button>
      </div>
    </div>
  );
}