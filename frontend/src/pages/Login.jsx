import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import maintenanceService from '../services/maintenanceService';

export default function Login({ manutencaoAtiva = false, onManutencaoResolvida }) {
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState({ tipo: '', mensagem: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [manutencaoLocal, setManutencaoLocal] = useState(manutencaoAtiva);

  // 🔥 Polling quando manutenção está ativa — deteta quando é desligada
  useEffect(() => {
    if (!manutencaoLocal) return;
    const interval = setInterval(async () => {
      try {
        const status = await maintenanceService.getStatus();
        if (!status) {
          setManutencaoLocal(false);
          if (onManutencaoResolvida) onManutencaoResolvida();
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [manutencaoLocal]);

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

        {/* Banner de manutenção */}
        {manutencaoLocal && (
          <div className="flex items-start gap-3 p-3.5 border rounded-xl bg-amber-500/10 border-amber-500/20">
            <span className="text-lg shrink-0">🔧</span>
            <div>
              <p className="text-xs font-bold text-amber-400">Plataforma em Manutenção</p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                O sistema está temporariamente em manutenção.
              </p>
            </div>
          </div>
        )}

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
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-11 text-sm text-white transition-colors border outline-none bg-neutral-950 rounded-xl focus:border-fitnessGym ${erro && !password ? 'border-red-500/50' : 'border-neutral-800'}`}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer transition-colors"
              >
                {mostrarPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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