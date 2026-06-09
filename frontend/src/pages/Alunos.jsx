import React, { useState, useEffect } from 'react';
import ModalAluno from '../components/ModalAluno';
import studentService from '../services/studentService';

export default function Alunos() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null); 
  
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // CARREGAMENTO INICIAL
  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setError('');
      const dados = await studentService.getAllStudents();
      setAlunos(dados);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  //FUNÇÃO HÍBRIDA: Gravar Novo ou Guardar Atualização via API
  const handleSaveAluno = async (dadosFormulario) => {
    try {
      setError('');
      
      if (alunoSelecionado) {
        // ---------------- MODAL EM MODO EDIÇÃO (PUT) ----------------
        const alunoAtualizado = await studentService.updateStudent(alunoSelecionado.id, dadosFormulario);
        
        // Substitui a linha antiga na tabela de forma imutável
        setAlunos(alunos.map(aluno => aluno.id === alunoSelecionado.id ? alunoAtualizado : aluno));
      } else {
        // ---------------- MODAL EM MODO CRIAÇÃO (POST) ----------------
        const alunoCriado = await studentService.createStudent(dadosFormulario);
        setAlunos([...alunos, alunoCriado]);
      }
    } catch (err) {
      alert(`Erro ao processar operação: ${err}`);
    } finally {
      setAlunoSelecionado(null); // Limpa o estado após fechar/salvar
    }
  };

  //Controladores de Abertura Diferenciada
  const handleAbrirCriar = () => {
    setAlunoSelecionado(null);
    setIsModalOpen(true);
  };

  const handleAbrirEditar = (aluno) => {
    setAlunoSelecionado(aluno);
    setIsModalOpen(true);
  };

  // Remover Aluno via API
  const handleDeleteAluno = async (id, nome) => {
    const confirmar = window.confirm(`Tem a certeza que deseja remover o(a) aluno(a) ${nome} do sistema?`);
    
    if (confirmar) {
      try {
        setError('');
        await studentService.deleteStudent(id);
        setAlunos(alunos.filter(aluno => aluno.id !== id));
      } catch (err) {
        alert(`Erro ao remover o aluno: ${err}`);
      }
    }
  };

  // Filtragem dinâmica
  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gerir Alunos</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Consulte, pesquise e faça a gestão completa de todos os seus atletas inscritos.
          </p>
        </div>
        
        <button 
          onClick={handleAbrirCriar}
         className="bg-fitnessGym hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/10 flex items-center gap-2 text-sm cursor-pointer"
        >
          + Novo Aluno
        </button>
      </div>

      {/* Alerta de Erro Global */}
      {error && (
        <div className="p-4 text-sm text-red-400 border bg-red-500/10 border-red-500/20 rounded-2xl">
          ⚠️ {error}
        </div>
      )}

      {/* Barra de Ferramentas */}
      <div className="flex items-center px-4 py-3 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar por nome do aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-3 text-sm text-white bg-transparent outline-none placeholder-neutral-500"
        />
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="py-12 font-medium text-center text-neutral-400">
          🔄 A carregar lista de atletas da base de dados...
        </div>
      ) : (
        <div className="overflow-hidden border shadow-sm bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="font-medium border-b border-neutral-800 bg-neutral-900/50 text-neutral-400">
                  <th className="p-4">Aluno</th>
                  <th className="p-4">Contacto WhatsApp</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {alunosFiltrados.length > 0 ? (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="transition-colors hover:bg-neutral-800/30">
                      <td className="p-4 font-semibold text-white">{aluno.nome}</td>
                      <td className="p-4 font-mono text-neutral-400">{aluno.whatsapp}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          aluno.status === 'Ativo' 
                            ? 'bg-emerald-500/10 text-fitnessGym' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {aluno.status}
                        </span>
                      </td>
                      <td className="p-4 space-x-2 text-right">
                        {/* 🔥 Botão do lápis agora dispara a edição carregando o objeto aluno */}
                        <button 
                          onClick={() => handleAbrirEditar(aluno)}
                          className="p-1 transition-colors cursor-pointer text-neutral-400 hover:text-white" 
                          title="Editar Ficha"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteAluno(aluno.id, aluno.nome)}
                          className="p-1 text-red-400 transition-colors cursor-pointer hover:text-red-500" 
                          title="Remover Aluno"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 italic text-center text-neutral-500">
                      Nenhum aluno encontrado correspondente à pesquisa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Injeção das propriedades para o Modal saber o que fazer */}
      <ModalAluno 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setAlunoSelecionado(null); }} 
        onSave={handleSaveAluno} 
        alunoParaEditar={alunoSelecionado}
      />

    </div>
  );
}