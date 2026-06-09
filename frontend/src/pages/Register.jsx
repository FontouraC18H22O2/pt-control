import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await register(nome, email, password);
      setSucesso(true);
      // Aguarda 2 segundos para o utilizador ler a mensagem de sucesso e redireciona para o login
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 bg-neutral-950">
      <div className="w-full max-w-md p-8 space-y-6 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        
        {/* Cabeçalho */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Criar Conta <span className="text-fitnessGym">PT</span>
          </h1>
          <p className="text-sm text-neutral-400">Registe o seu perfil para começar a gerir os seus Alunos</p>
        </div>

        {/* Alertas de Erro ou Sucesso */}
        {erro && (
          <div className="p-3 text-xs text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl animate-shake">
            ⚠️ {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-3 text-xs border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 rounded-xl">
            ✅ Conta criada com sucesso! A redirecionar para o login...
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: Pedro Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              required
              disabled={loading || sucesso}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Endereço de Email</label>
            <input
              type="email"
              placeholder="exemplo@ginasio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              required
              disabled={loading || sucesso}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Password de Acesso</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              required
              disabled={loading || sucesso}
            />
          </div>

          <button
            type="submit"
            disabled={loading || sucesso}
            className="w-full py-3 mt-2 text-sm font-black tracking-wider text-white uppercase transition-all duration-200 shadow-lg cursor-pointer rounded-xl bg-fitnessGym shadow-red-500/10 hover:bg-red-700 disabled:opacity-40"
          >
            {loading ? 'A processar...' : 'Finalizar Registo'}
          </button>
        </form>

        {/* Link para voltar ao Login */}
        <div className="pt-2 text-center">
          <Link to="/" className="text-xs font-medium transition-colors text-neutral-400 hover:text-fitnessGym">
            Já tem uma conta? <span className="font-bold underline">Faça Login aqui!</span>
          </Link>
        </div>

      </div>
    </div>
  );
}