import React from 'react';

export default function Dashboard() {
  // Substituímos os emojis por funções que devolvem JSX/SVG limpo
  const stats = [
    { 
      id: 1, 
      name: 'Alunos Inscritos', 
      value: '24', 
      change: '+3 este mês', 
      changeType: 'positive',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fitnessGym" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 2, 
      name: 'Planos Ativos', 
      value: '18', 
      change: '82% de adesão', 
      changeType: 'neutral',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fitnessGym" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      id: 3, 
      name: 'Treinos do Dia', 
      value: '7', 
      change: '3 concluídos', 
      changeType: 'positive',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fitnessGym" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 4, 
      name: 'Rendimento Mensal', 
      value: '1,240€', 
      change: '+12% vs mês anterior', 
      changeType: 'positive',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fitnessGym" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const recentes = [
    { id: 1, aluno: 'João Silva', acao: 'Concluiu o Treino A (Hipertrofia)', hora: 'Há 10 min' },
    { id: 2, aluno: 'Maria Santos', acao: 'Pediu alteração no plano de Pernas', hora: 'Há 45 min' },
    { id: 3, aluno: 'Pedro Costa', acao: 'Inscrito com sucesso no sistema', hora: 'Há 2 horas' },
  ];

  return (
    <div className="space-y-8">
      {/* Mensagem de Boas-Vindas */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Olá, <span className="text-fitnessGym">Personal Trainer</span> 👋
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Aqui está o resumo do seu ginásio e a atividade dos seus atletas para o dia de hoje.
        </p>
      </div>

      {/* Grelha de Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item) => (
          <div 
            key={item.id} 
            className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-sm hover:border-neutral-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              {/* Envolvendo o ícone SVG numa caixa com fundo subtil */}
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
                {item.icon}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                item.changeType === 'positive' ? 'bg-emerald-500/10 text-fitnessGym' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {item.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">{item.name}</h3>
              <p className="text-3xl font-bold text-white mt-1 tracking-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secção de Atividade Recente e Avisos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bloco de Atividade Recente */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fitnessGym"></span>
            Atividade Recente dos Alunos
          </h2>
          <div className="divide-y divide-neutral-800">
            {recentes.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-white">{item.aluno}</p>
                  <p className="text-neutral-400 text-xs mt-0.5">{item.acao}</p>
                </div>
                <span className="text-neutral-500 text-xs font-mono">{item.hora}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco de Links Rápidos / Ações Diretas */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Acesso Rápido</h2>
            <p className="text-neutral-400 text-xs mb-4">Ações mais comuns do dia a dia do treinador.</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm flex items-center gap-3 text-neutral-300 hover:border-fitnessGym/50 transition-colors cursor-pointer group">
              <span className="group-hover:scale-110 transition-transform">👤</span> 
              <span>Adicionar um novo aluno à lista</span>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm flex items-center gap-3 text-neutral-300 hover:border-fitnessGym/50 transition-colors cursor-pointer group">
              <span className="group-hover:scale-110 transition-transform">💪</span> 
              <span>Desenhar um plano de treino</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}