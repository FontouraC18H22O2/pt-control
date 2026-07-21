import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; 

export default function Login() {
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState({ tipo: '', mensagem: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErro('');
    setAlerta({ tipo: '', mensagem: '' });

    // Validação manual (sem usar required do HTML para evitar refresh)
    if (!email.trim()) { setErro('Por favor, introduza o seu email.'); return; }
    if (!password) { setErro('Por favor, introduza a sua password.'); return; }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password
      });
      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const statusServidor = err.response?.status;
      const dadosErro = err.response?.data;
      const mensagemDeErro = typeof dadosErro?.error === 'string' 
        ? dadosErro.error 
        : (dadosErro?.message || 'Falha no login. Verifique as suas credenciais.');

      if (statusServidor === 403 && dadosErro?.error === 'Acesso Suspenso') {
        setAlerta({ tipo: 'SUSPENSO', mensagem: dadosErro.message || 'Esta conta foi suspensa temporariamente.' });
      } else {
        setErro(mensagemDeErro);
      }
      // 🔥 Password limpa mas email mantém-se para não ter de voltar a escrever
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 bg-neutral-950 bg-gradient-to-br from-neutral-950 via-red-950/10 to-neutral-950 relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.04)_48%,rgba(220,38,38,0.08)_50%,rgba(220,38,38,0.04)_52%,transparent_55%)] before:pointer-events-none">
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black text-white">
            PT <span className="text-fitnessGym">Control</span>
          </h1>
          <p className="text-sm text-neutral-400">Insira as suas credenciais de treinador</p>
        </div>

        {erro && (
          <div className="p-3 text-xs text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl animate-pulse">
            ⚠️ {erro}
          </div>
        )}

        {alerta.tipo === 'SUSPENSO' && (
          <div className="p-4 space-y-1 text-xs border text-amber-400 bg-amber-500/5 border-amber-500/20 rounded-xl">
            <div className="font-bold tracking-wider uppercase">⏸️ Conta Desativada</div>
            <p className="font-normal leading-relaxed text-neutral-300">{alerta.mensagem}</p>
            <div className="pt-1.5 border-t border-amber-500/10 text-[10px] text-neutral-400">
              Caso restem dúvidas, contacte o suporte em: <span className="font-semibold underline text-amber-400">admin@ispgayafitness.pt</span>
            </div>
          </div>
        )}

        {/* 🔥 Removido required dos inputs para evitar refresh do browser */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Email do PT</label>
            <input
              type="email"
              placeholder="exemplo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 rounded-xl focus:border-fitnessGym ${erro && !email ? 'border-red-500/50' : 'border-neutral-800'}`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 rounded-xl focus:border-fitnessGym ${erro && !password ? 'border-red-500/50' : 'border-neutral-800'}`}
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

        <div className="pt-2 text-center">
          <Link to="/register" className="text-xs font-medium transition-colors text-neutral-400 hover:text-fitnessGym">
            Não tem uma conta? <span className="font-bold underline">Peça uma aqui!</span>
          </Link>
        </div>
      </div>
    </div>
  );
}