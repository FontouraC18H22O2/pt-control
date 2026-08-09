import React, { useEffect, useState } from 'react';
import maintenanceService from '../services/maintenanceService';

export default function Manutencao({ onManutencaoDesligada }) {
  const [dots, setDots] = useState('');
  const [desligando, setDesligando] = useState(false);
  const [progresso, setProgresso] = useState(60);

  // Animação dos pontos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 🔥 Polling a cada 15 segundos — mais frequente porque o utilizador está à espera
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await maintenanceService.getStatus();
        if (!status) {
          // Manutenção foi desligada!
          setDesligando(true);
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quando manutenção é desligada — anima a barra e redireciona
  useEffect(() => {
    if (!desligando) return;

    // Barra sobe de 60% para 100% em 1.5s
    let p = 60;
    const progressInterval = setInterval(() => {
      p += 4;
      setProgresso(p);
      if (p >= 100) {
        clearInterval(progressInterval);
        // Após a barra completar, notifica o App para remover a página de manutenção
        setTimeout(() => {
          if (onManutencaoDesligada) onManutencaoDesligada();
        }, 400);
      }
    }, 60);

    return () => clearInterval(progressInterval);
  }, [desligando]);

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-neutral-950 bg-gradient-to-br from-neutral-950 via-red-950/10 to-neutral-950 relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.04)_48%,rgba(220,38,38,0.08)_50%,rgba(220,38,38,0.04)_52%,transparent_55%)] before:pointer-events-none">
      <div className="relative z-10 w-full max-w-lg text-center space-y-8">

        {/* Logo */}
        <p className="text-xs font-black tracking-widest text-red-500 uppercase">PT Control</p>

        {/* Ícone */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-neutral-800 flex items-center justify-center bg-neutral-900">
              <span className="text-4xl transition-all duration-500">
                {desligando ? '✅' : '🔧'}
              </span>
            </div>
            {!desligando && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
            )}
            {desligando && (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/50"></div>
            )}
          </div>
        </div>

        {/* Mensagem */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-white transition-all duration-500">
            {desligando ? 'A Retomar...' : `Em Manutenção${dots}`}
          </h1>
          <p className="text-neutral-400 leading-relaxed transition-all duration-500">
            {desligando
              ? 'A plataforma está de volta! A redirecionar...'
              : 'Estamos a melhorar a plataforma para te oferecer uma experiência ainda melhor.\nVoltamos em breve!'
            }
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              desligando
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
            }`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        {!desligando && (
          <div className="p-4 border bg-neutral-900/50 border-neutral-800 rounded-2xl">
            <p className="text-xs text-neutral-500">
              Se és Personal Trainer e precisas de acesso urgente, entra em contacto com o administrador.
            </p>
          </div>
        )}

        <p className="text-[10px] text-neutral-700 uppercase tracking-widest">
          PT Control © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}