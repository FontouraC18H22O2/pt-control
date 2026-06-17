import React, { useEffect, useState } from 'react';
import { getPendingAccessRequests, updateAccessRequestStatus } from '../services/adminService';

export default function AccessRequests() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // 🔥 Estados para o Modal de Confirmação Customizado
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ id: null, status: '', nome: '' });

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const dados = await getPendingAccessRequests();
      setPedidos(dados);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao carregar solicitações de acesso.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  // 1. Abre o modal e guarda os dados do pedido clicado
  const abrirConfirmacao = (id, status, nome) => {
    setModalConfig({ id, status, nome });
    setModalOpen(true);
  };

  // 2. Executa a ação real após o clique no modal customizado
  const executarDecisao = async () => {
    const { id, status } = modalConfig;
    setModalOpen(false); // Fecha o modal imediatamente

    try {
      setActionLoading(id);
      await updateAccessRequestStatus(id, status);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || 'Não foi possível atualizar o estado do pedido.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-white">
        <div className="w-8 h-8 border-b-2 border-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 space-y-6 text-white bg-neutral-950">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Solicitações de Acesso</h1>
        <p className="text-sm text-neutral-400">
          Analise e gira os pedidos de novos Personal Trainers que querem entrar na plataforma.
        </p>
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div className="p-4 text-sm text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Lista de Pedidos */}
      {pedidos.length === 0 ? (
        <div className="p-8 text-center border bg-neutral-900 border-neutral-800 rounded-2xl">
          <span className="block mb-2 text-4xl">📥</span>
          <p className="text-sm text-neutral-400">Não existem solicitações de acesso pendentes de momento.</p>
        </div>
      ) : (
        <div className="overflow-hidden border bg-neutral-900 border-neutral-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold tracking-wider uppercase border-b bg-neutral-950/50 border-neutral-800 text-neutral-400">
                <th className="p-4">Candidato</th>
                <th className="p-4">Mensagem / Objetivo</th>
                <th className="p-4">Data do Pedido</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-neutral-800">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="transition-colors hover:bg-neutral-950/30">
                  <td className="p-4">
                    <div className="font-bold text-neutral-200">{pedido.nome}</div>
                    <div className="text-xs text-neutral-500">{pedido.email}</div>
                  </td>
                  <td className="max-w-xs p-4 md:max-w-md">
                    <p className="italic break-words text-neutral-400">
                      "{pedido.mensagem || 'Nenhuma mensagem enviada.'}"
                    </p>
                  </td>
                  <td className="p-4 text-xs text-neutral-500">
                    {new Date(pedido.createdAt).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => abrirConfirmacao(pedido.id, 'Aprovado', pedido.nome)}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {actionLoading === pedido.id ? '...' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => abrirConfirmacao(pedido.id, 'Recusado', pedido.nome)}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {actionLoading === pedido.id ? '...' : 'Recusar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔥 MODAL DE CONFIRMAÇÃO CUSTOMIZADO (Substitui o window.confirm) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 duration-150 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl animate-in fade-in zoom-in-95">
            <h3 className="mb-2 text-lg font-black text-neutral-100">
              Confirmar Ação
            </h3>
            <p className="mb-6 text-sm text-neutral-400">
              Tens a certeza de que desejas marcar a solicitação de{' '}
              <span className="font-bold text-neutral-200">{modalConfig.nome}</span> como{' '}
              <span className={`font-bold ${modalConfig.status === 'Aprovado' ? 'text-emerald-400' : 'text-red-400'}`}>
                {modalConfig.status.toLowerCase()}
              </span>?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold transition-colors cursor-pointer text-neutral-400 bg-neutral-800 hover:bg-neutral-700 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={executarDecisao}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors ${
                  modalConfig.status === 'Aprovado' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}