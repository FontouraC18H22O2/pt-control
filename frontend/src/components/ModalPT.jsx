import React, { useState, useEffect } from 'react';

export default function ModalPT({ isOpen, onClose, onSave }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Limpar os campos sempre que o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setNome('');
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      alert('Por favor, preenche todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      // Dispara a função de gravação passada pela página pai
      await onSave({ nome: nome.trim(), email: email.toLowerCase().trim() });
      onClose(); // Fecha o modal após o sucesso
    } catch (err) {
      // O erro já é tratado na página pai, mas paramos o loading aqui
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-200 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md p-6 space-y-6 overflow-hidden duration-200 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl animate-in zoom-in-95">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Registar Novo Personal Trainer</h2>
          <button 
            onClick={onClose}
            className="text-lg cursor-pointer text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Prof. Carlos Sousa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-500 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">E-mail Profissional *</label>
            <input
              type="email"
              placeholder="Ex: carlos.treinador@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-500 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <p className="p-3 text-xs leading-relaxed border text-neutral-500 bg-neutral-950 rounded-xl border-neutral-800/50">
            💡 <strong>Nota administrativa:</strong> Ao submeter, o sistema irá criar a conta ativa com a Role de <code>PT</code> e enviará de imediato um e-mail para o profissional contendo as suas credenciais provisórias de acesso.
          </p>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold transition-colors cursor-pointer text-neutral-400 hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 shadow-lg cursor-pointer hover:bg-red-700 rounded-xl shadow-red-500/10 disabled:opacity-50"
            >
              {submitting ? 'A criar conta...' : 'Gerar e Enviar Acesso'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}