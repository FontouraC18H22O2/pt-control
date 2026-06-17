import React, { useState, useEffect } from 'react';
import { createTrainer, getTrainersList, deactivateTrainer } from '../services/adminService'; // 🔥 Importa a função de desativação
import ModalPT from '../components/ModalPT';

export default function GestaoPTs() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const carregarTreinadores = async () => {
    try {
      setLoading(true);
      setError('');
      const dadosReais = await getTrainersList();
      setTrainers(dadosReais);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os treinadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTreinadores();
  }, []);

  const handleSaveTrainer = async (dadosPT) => {
    try {
      setError('');
      setSuccessMessage('');
      await createTrainer(dadosPT);
      setSuccessMessage('Conta de Personal Trainer gerada com sucesso!');
      await carregarTreinadores();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Não foi possível criar a conta.');
      throw err;
    }
  };

  // 🔥 NOVO: Função para revogar o acesso do PT com confirmação de segurança
  const handleDeactivate = async (id, nome) => {
    if (!window.confirm(`Tens a certeza de que desejas revogar imediatamente o acesso do treinador ${nome}?`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      
      const resultado = await deactivateTrainer(id);
      setSuccessMessage(resultado.message || 'Acesso revogado com sucesso!');
      
      // Atualiza a tabela com os novos dados reais do banco
      await carregarTreinadores();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Falha ao desativar o utilizador.');
    }
  };

  const filteredTrainers = trainers.filter(
    (pt) =>
      pt.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 space-y-6 text-white bg-neutral-950">
      
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 pb-5 border-b sm:flex-row sm:items-center sm:justify-between border-neutral-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Gestão de Personal Trainers</h1>
          <p className="text-sm text-neutral-400">Visualiza, pesquisa e gere as permissões da tua equipa.</p>
        </div>
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
         className="bg-fitnessGym hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/10 flex items-center gap-2 text-sm cursor-pointer"
        >
          + Novo Personal Trainer
        </button>
        </div>
      </div>

      {/* Feedbacks */}
      {error && <div className="p-4 text-sm text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl">{error}</div>}
      {successMessage && <div className="p-4 text-sm border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 rounded-xl">{successMessage}</div>}

      {/* Pesquisa */}
      <div className="flex items-center max-w-md px-4 py-3 transition-colors border bg-neutral-900 border-neutral-800 rounded-xl focus-within:border-red-500">
        <span className="mr-2 text-neutral-500">🔍</span>
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm text-white bg-transparent outline-none placeholder-neutral-500"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden border shadow-xl bg-neutral-900 border-neutral-800 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold tracking-wider uppercase border-b bg-neutral-950/50 border-neutral-800 text-neutral-400">
                <th className="px-6 py-4">Nome Profissional</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Acesso (Role)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-neutral-800/60">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-neutral-400">⏳ A ler base de dados...</td></tr>
              ) : filteredTrainers.length > 0 ? (
                filteredTrainers.map((pt) => (
                  <tr key={pt.id} className="transition-colors hover:bg-neutral-800/30">
                    <td className="px-6 py-4 font-bold text-white">{pt.nome}</td>
                    <td className="px-6 py-4 text-neutral-300">{pt.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">{pt.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${pt.isActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${pt.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                        {pt.isActive ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeactivate(pt.id, pt.nome)}
                        disabled={!pt.isActive}
                        className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      >
                        Remover Acesso
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-neutral-500">Nenhum Personal Trainer encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalPT isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTrainer} />
    </div>
  );
}