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

  // 🌟 ESTÉTICA INTEGRADA: Estado para as notificações Toast atrativas
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 🌟 ESTÉTICA INTEGRADA: Estado para o Modal Customizado de Eliminação
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

  // CARREGAMENTO INICIAL
  useEffect(() => {
    carregarAlunos();
  }, []);

  // Função auxiliar para disparar o Toast de feedback
  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setError('');
      const dados = await studentService.getAllStudents();
      setAlunos(dados);
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar a lista de alunos.');
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO HÍBRIDA: Gravar Novo ou Guardar Atualização via API
  const handleSaveAluno = async (dadosFormulario) => {
    try {
      setError('');
      
      if (alunoSelecionado) {
        // ---------------- MODAL EM MODO EDIÇÃO (PUT) ----------------
        const alunoAtualizado = await studentService.updateStudent(alunoSelecionado.id, dadosFormulario);
        
        // Substitui a linha antiga na tabela de forma imutável
        setAlunos(alunos.map(aluno => aluno.id === alunoSelecionado.id ? alunoAtualizado : aluno));
        showNotification('Alterações feitas com sucesso!', 'success');
      } else {
        // ---------------- MODAL EM MODO CRIAÇÃO (POST) ----------------
        const alunoCriado = await studentService.createStudent(dadosFormulario);
        setAlunos([...alunos, alunoCriado]);
        showNotification('Aluno registado com sucesso!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showNotification(`Erro ao processar operação.`, 'error');
    } finally {
      setAlunoSelecionado(null); // Limpa o estado após fechar/salvar
    }
  };

  // Controladores de Abertura Diferenciada
  const handleAbrirCriar = () => {
    setAlunoSelecionado(null);
    setIsModalOpen(true);
  };

  const handleAbrirEditar = (aluno) => {
    setAlunoSelecionado(aluno);
    setIsModalOpen(true);
  };

  // 🌟 NOVO: Substitui o window.confirm pelo diálogo escuro premium
  const handleOpenDeleteConfirm = (id, nome) => {
    setDeleteModal({ open: true, id, name: nome });
  };

  // 🌟 NOVO: Trata da eliminação física real a partir do modal customizado
  const handleConfirmDelete = async () => {
    try {
      setError('');
      await studentService.deleteStudent(deleteModal.id);
      setAlunos(alunos.filter(aluno => aluno.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '' });
      showNotification('Aluno removido do sistema com sucesso!', 'success');
    } catch (err) {
      setDeleteModal({ open: false, id: null, name: '' });
      showNotification('Erro ao tentar remover o aluno.', 'error');
    }
  };

  // Filtragem dinâmica
  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-6">
      
      {/* 🌟 NOTIFICAÇÃO TOAST FLUTUANTE DE SUCESSO/ERRO */}
      {toast.show && (
        <div className="fixed z-50 duration-300 top-6 right-6 animate-in fade-in slide-in-from-top-4">
          <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30' 
              : 'bg-red-950/90 text-red-400 border-red-500/30'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

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
                      <td className="p-4 font-mono text-neutral-400">{aluno.whatsapp || 'Sem contacto'}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          aluno.status === 'Ativo' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {aluno.status}
                        </span>
                      </td>
                      <td className="p-4 space-x-2 text-right">
                        <button 
                          onClick={() => handleAbrirEditar(aluno)}
                          className="p-1 transition-colors cursor-pointer text-neutral-400 hover:text-white" 
                          title="Editar Ficha"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(aluno.id, aluno.nome)}
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

      {/* Injeção das propriedades para o Modal */}
      <ModalAluno 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setAlunoSelecionado(null); }} 
        onSave={handleSaveAluno} 
        alunoParaEditar={alunoSelecionado}
      />

      {/* 🌟 MODAL ATRATIVO DE CONFIRMAÇÃO DE APAGAR ALUNO */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden duration-150 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl animate-in fade-in zoom-in-95">
            
            <div className="p-6 space-y-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto text-xl text-red-400 border rounded-full bg-red-500/10 border-red-500/20">
                👤
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Remover Aluno do Sistema?</h3>
                <p className="text-xs leading-relaxed text-neutral-400">
                  Tem a certeza que deseja remover permanentemente o(a) aluno(a) <span className="font-semibold text-red-400">"{deleteModal.name}"</span> do registo? Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: false, id: null, name: '' })}
                  className="flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors bg-neutral-800 text-neutral-400 rounded-xl hover:bg-neutral-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-all bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  Sim, Remover
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}