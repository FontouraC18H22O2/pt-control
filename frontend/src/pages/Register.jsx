import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestAccessRequest } from '../services/authService'; // Ajusta o caminho se o teu ficheiro estiver numa pasta diferente

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação local preventiva
    if (!nome.trim() || !email.trim()) {
      setError('Por favor, preenche o teu nome e o teu e-mail.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Chama a função que acabámos de integrar no authService
      await requestAccessRequest(nome.trim(), email.toLowerCase().trim(), mensagem.trim());

      setSucesso(true);
      // Limpa os campos do formulário após o sucesso
      setNome('');
      setEmail('');
      setMensagem('');
    } catch (err) {
      console.error(err);
      // Exibe a mensagem de erro tratada vinda do backend ou uma genérica
      setError(err.message || 'Ocorreu um erro ao enviar o pedido. Por favor, tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-neutral-950">
      <div className="w-full max-w-md p-8 space-y-6 overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        
        {/* Topo / Branding da App */}
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 text-2xl text-red-400 border rounded-full bg-red-500/10 border-red-500/20">
            🏋️
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Pedir Acesso à Plataforma</h2>
          <p className="text-sm text-neutral-400">
            Insere os teus dados para que a administração possa analisar e criar o teu perfil de PT.
          </p>
        </div>

        {/* Alerta de Erro Visual */}
        {error && (
          <div className="p-3 text-sm text-red-400 duration-200 border bg-red-500/10 border-red-500/20 rounded-xl animate-in fade-in">
            ⚠️ {error}
          </div>
        )}

        {/* Bloco de Sucesso Premium */}
        {sucesso ? (
          <div className="p-5 space-y-4 text-center duration-200 border bg-emerald-500/5 border-emerald-500/20 rounded-xl animate-in fade-in zoom-in-95">
            <span className="block text-3xl">📩</span>
            <h3 className="text-sm font-bold text-emerald-400">Solicitação Enviada!</h3>
            <p className="text-xs leading-relaxed text-neutral-400">
              O teu pedido foi registado com sucesso. Enviámos um e-mail de confirmação para a tua caixa de correio. Fica atento!
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block text-xs font-bold tracking-wider text-red-400 uppercase transition-colors hover:text-red-300"
              >
                Voltar ao Login
              </Link>
            </div>
          </div>
        ) : (
          /* Formulário de Pedido de Entrada */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">O teu Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-500 transition-colors disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">O teu melhor E-mail *</label>
              <input
                type="email"
                placeholder="Ex: joao@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-500 transition-colors disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Objetivo ou Mensagem (Opcional)</label>
              <textarea
                placeholder="Ex: Gostaria de obter acesso para gerir os meus alunos e centralizar os planos de treino na vossa plataforma.."
                rows="3"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm text-white border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-500 transition-colors resize-none disabled:opacity-50"
              />
            </div>

              <button
            type="submit"
            disabled={loading}
           className="w-full py-3 mt-2 text-sm font-black tracking-wider text-white uppercase transition-all shadow-lg cursor-pointer rounded-xl bg-fitnessGym hover:bg-red-700 shadow-red-500/10 disabled:opacity-50"
          >
            {loading ? 'A Enviar Pedido...' : 'Solicitar Acesso à Plataforma'}
          </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-neutral-500">
                Já tens uma conta ativa?{' '}
                <Link to="/login" className="font-semibold transition-colors text-neutral-300 hover:text-red-400">
                  Fazer Login
                </Link>
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}