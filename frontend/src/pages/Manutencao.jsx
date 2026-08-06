import React, { useEffect, useState } from 'react';

export default function Manutencao() {
  const [dots, setDots] = useState('');

  // Animação dos pontos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-neutral-950 bg-gradient-to-br from-neutral-950 via-red-950/10 to-neutral-950 relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.04)_48%,rgba(220,38,38,0.08)_50%,rgba(220,38,38,0.04)_52%,transparent_55%)] before:pointer-events-none">
      <div className="relative z-10 w-full max-w-lg text-center space-y-8">

        {/* Logo */}
        <div className="space-y-1">
          <p className="text-xs font-black tracking-widest text-red-500 uppercase">PT Control</p>
        </div>

        {/* Ícone animado */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-neutral-800 flex items-center justify-center bg-neutral-900">
              <span className="text-4xl">🔧</span>
            </div>
            {/* Anel a rodar */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
          </div>
        </div>

        {/* Mensagem principal */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Em Manutenção{dots}
          </h1>
          <p className="text-neutral-400 leading-relaxed">
            Estamos a melhorar a plataforma para te oferecer uma experiência ainda melhor.
            <br />
            Voltamos em breve!
          </p>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* Info */}
        <div className="p-4 border bg-neutral-900/50 border-neutral-800 rounded-2xl space-y-2">
          <p className="text-xs text-neutral-500">
            Se és Personal Trainer e precisas de acesso urgente, entra em contacto com o administrador.
          </p>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-neutral-700 uppercase tracking-widest">
          PT Control © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}