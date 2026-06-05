import React, { useState } from 'react';

export default function Alunos() {
  // 1. Estado para o termo de pesquisa
  const [search, setSearch] = useState('');

  // 2. Dados estáticos temporários (Mock) para podermos desenhar a interface
  const [alunos, setAlunos] = useState([
    { id: 1, nome: 'João Carlos Silva', whatsapp: '912345678', plano: 'Hipertrofia ABC', status: 'Ativo' },
    { id: 2, nome: 'Maria Eduarda Santos', whatsapp: '934567890', plano: 'Perda de Peso / Cardio', status: 'Ativo' },
    { id: 3, nome: 'Pedro Miguel Costa', whatsapp: '961234567', plano: 'Força OHP', status: 'Inativo' },
    { id: 4, nome: 'Ana Catarina Ribeiro', whatsapp: '929876543', plano: 'Condicionamento Geral', status: 'Ativo' },
  ]);

  // 3. Filtragem dinâmica com base na barra de pesquisa
  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(search.toLowerCase()) ||
    aluno.plano.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Ecrã */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gerir Alunos</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Consulte, pesquise e faça a gestão completa de todos os seus atletas inscritos.
          </p>
        </div>
        <button className="bg-fitnessGym hover:bg-emerald-600 text-neutral-950 font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer text-sm font-medium">
          + Novo Aluno
        </button>
      </div>

      {/* Barra de Ferramentas (Filtros e Pesquisa) */}
      <div className="flex items-center bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar por nome do aluno ou plano de treino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-white placeholder-neutral-500 text-sm pl-3 outline-none"
        />
      </div>

      {/* Contentor da Tabela Responsiva */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-medium">
                <th className="p-4">Aluno</th>
                <th className="p-4">Contacto WhatsApp</th>
                <th className="p-4">Plano Associado</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {alunosFiltrados.length > 0 ? (
                alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Coluna Nome */}
                    <td className="p-4 font-semibold text-white">{aluno.nome}</td>
                    
                    {/* Coluna Contacto */}
                    <td className="p-4 font-mono text-neutral-400">{aluno.whatsapp}</td>
                    
                    {/* Coluna Plano */}
                    <td className="p-4 text-neutral-400">{aluno.plano}</td>
                    
                    {/* Coluna Estado (Badge Colorida) */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        aluno.status === 'Ativo' 
                          ? 'bg-emerald-500/10 text-fitnessGym' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {aluno.status}
                      </span>
                    </td>
                    
                    {/* Coluna Ações Rápidas */}
                    <td className="p-4 text-right space-x-2">
                      <button className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer" title="Editar Ficha">
                        ✏️
                      </button>
                      <button className="text-red-400 hover:text-red-500 p-1 transition-colors cursor-pointer" title="Remover Aluno">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-neutral-500 italic">
                    Nenhum aluno encontrado correspondente à pesquisa "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}