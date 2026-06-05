import React from 'react';

export default function Treinos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Planos de Treino</h1>
        <p className="text-neutral-400 text-sm mt-1">Configure as rotinas, exercícios e séries dos seus atletas.</p>
      </div>

      {/* Placeholder para os cartões de treino */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-500">
        Nenhum plano de treino estruturado neste ecrã.
      </div>
    </div>
  );
}