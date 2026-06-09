import React, { useState, useEffect } from 'react';

export default function ModalAluno({ isOpen, onClose, onSave, alunoParaEditar }) {
  // 1. Estados locais para controlar os campos do formulário
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [plano, setPlano] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [error, setError] = useState('');

  // ESCUTAR SE É EDIÇÃO OU CRIAÇÃO ASSIM QUE O MODAL ABRE
  useEffect(() => {
    if (alunoParaEditar) {
      setNome(alunoParaEditar.nome || '');
      setWhatsapp(alunoParaEditar.whatsapp || '');
      setPlano(alunoParaEditar.plano || 'Hipertrofia ABC'); // Padrão se não houver
      setStatus(alunoParaEditar.status || 'Ativo');
    } else {
      // Modo Criação: Limpa tudo
      setNome('');
      setWhatsapp('');
      setPlano('');
      setStatus('Ativo');
    }
    setError('');
  }, [alunoParaEditar, isOpen]);

  // Se o modal não estiver aberto, não renderiza absolutamente nada
  if (!isOpen) return null;

  // 2. Submissão do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validação básica de integridade
    if (!nome.trim() || !whatsapp.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Criar o objeto com os dados ajustados
    const dadosAluno = {
      nome: nome.trim(),
      whatsapp: whatsapp.trim(),
      plano: plano || 'Plano Personalizado',
      status: status
    };

    // Envia os dados para o componente pai (Alunos.jsx)
    onSave(dadosAluno);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      
      {/* Caixa do Modal */}
      <div className="relative w-full max-w-md p-6 overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        
        {/* Cabeçalho Dinâmico */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {alunoParaEditar ? 'Editar Ficha do Aluno' : 'Registar Novo Aluno'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-lg transition-colors cursor-pointer text-neutral-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="p-3 mb-4 text-xs font-medium text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo: Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Carlos Alberto Antunes"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600"
              required
            />
          </div>

          {/* Campo: WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Telemóvel / WhatsApp *</label>
            <input
              type="tel"
              maxLength="9"
              placeholder="Ex: 912345678"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 font-mono text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600"
              required
            />
          </div>

          {/* 🔥 NOVO Campo: Estado do Atleta (Apenas visível em Modo Edição) */}
          {alunoParaEditar && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Estado do Atleta</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
             className="px-4 py-2.5 rounded-xl bg-fitnessGym hover:bg-red-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-red-500/20"
            >
              {alunoParaEditar ? 'Atualizar Dados' : 'Guardar Aluno'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}