import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const { login } = useAuth(); // Vem do teu AuthContext atualizado
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // 🚀 Faz o pedido para o endpoint correto do Backend
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.toLowerCase().trim(),
        password
      });

      // Extrai o token e os dados do userAdmin devolvidos pelo controller
      const { token, user } = response.data;

      // Executa a função do contexto para injetar o token no Axios e guardar no LocalStorage
      login(token, user);

      // Redireciona o Personal Trainer para o Dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErro(err.response?.data?.error || 'Falha no login. Verifique as suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 bg-neutral-950">
      <div className="w-full max-w-md p-8 space-y-6 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black text-white">
            PT <span className="text-fitnessGym">Management</span>
          </h1>
          <p className="text-sm text-neutral-400">Insira as suas credenciais de treinador</p>
        </div>

        {erro && (
          <div className="p-3 text-xs text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl">
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Email do PT</label>
            <input
              type="email"
              placeholder="exemplo@ginasio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
           className="w-full py-3 mt-2 text-sm font-black tracking-wider text-white uppercase transition-all shadow-lg cursor-pointer rounded-xl bg-fitnessGym hover:bg-red-700 shadow-red-500/10 disabled:opacity-50"
          >
            {loading ? 'A autenticar...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* ⚡ NOVO: Link para o ecrã de registo que vamos mapear a seguir */}
        <div className="pt-2 text-center">
          <Link to="/register" className="text-xs font-medium transition-colors text-neutral-400 hover:text-fitnessGym">
            Não tem uma conta de PT? <span className="font-bold underline">Crie uma aqui</span>
          </Link>
        </div>

      </div>
    </div>
  );
}