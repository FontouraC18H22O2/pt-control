import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Galeria() {
  // 🔥 Extraímos o role e o objeto user completo para sabermos o ID do PT logado
  const { role, user } = useAuth();
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Estados do Modal unificado (Criação e Edição)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = criar, id = editar
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Peito');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Estado para as notificações Toast atrativas
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estado para o Modal Customizado de Eliminação
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 🔥 NOVO: Resolve o URL do GIF — se já for um link completo (Cloudinary), usa-o diretamente;
  // se for um caminho antigo/relativo (legado do disco do Railway), concatena com o BACKEND_URL
  const resolverGifUrl = (gifUrl) => {
    if (!gifUrl) return null;
    if (gifUrl.startsWith('http://') || gifUrl.startsWith('https://')) {
      return gifUrl;
    }
    return `${BACKEND_URL}${gifUrl}`;
  };

  const categories = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdominais', 'Cardio'];

  // Função auxiliar para disparar Toasts de feedback
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Carregar os exercícios do Backend (Globais + Privados do PT)
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exercises');
      setExercises(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Falha ao sincronizar com o servidor de exercícios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Abrir modal para criar um novo exercício
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNewName('');
    setNewCategory('Peito');
    setSelectedFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Abrir modal para editar um exercício existente
  const handleOpenEditModal = (exercise) => {
    setEditingId(exercise.id);
    setNewName(exercise.name);
    setNewCategory(exercise.category);
    setSelectedFile(null); // Só altera o GIF se escolher um novo
    setFormError('');
    setIsModalOpen(true);
  };

  // Submissão do Formulário (Criar ou Atualizar)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCategory) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError('');

      // Como envolve upload de ficheiros binários, usamos FormData
      const formData = new FormData();
      formData.append('name', newName.trim());
      formData.append('category', newCategory);
      if (selectedFile) {
        formData.append('gif', selectedFile);
      }

      if (editingId) {
        // Modo Edição
        await api.put(`/exercises/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Exercício atualizado com sucesso!', 'success');
      } else {
        // Modo Criação
        await api.post('/exercises', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Novo exercício adicionado à tua galeria!', 'success');
      }

      setIsModalOpen(false);
      fetchExercises();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Erro ao guardar as alterações do exercício.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Confirmar a eliminação definitiva
  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/exercises/${deleteModal.id}`);
      showToast('Exercício removido da base de dados.', 'success');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchExercises();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Não tens permissão para eliminar este exercício.', 'error');
      setDeleteModal({ open: false, id: null, name: '' });
    }
  };

  // Filtrar os exercícios pelo botão de categoria selecionado
  const filteredExercises = selectedCategory === 'Todos'
    ? exercises
    : exercises.filter(ex => ex.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen p-6 space-y-6 text-white bg-neutral-950">
      
      {/* Notificação Toast Flutuante */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
          toast.type === 'success' 
            ? 'bg-neutral-900/90 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20' 
            : 'bg-neutral-900/90 border-red-500/30 text-red-400 shadow-red-950/20'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
          <p className="text-xs font-semibold tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between border-neutral-900">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Galeria de Exercícios</h1>
          <p className="mt-1 text-xs text-neutral-400">Gere e visualiza a biblioteca de animações para os planos de treino.</p>
        </div>
        
        {/* Qualquer PT ou ADMIN pode adicionar os seus exercícios */}
        <button 
          onClick={handleOpenCreateModal}
         className="bg-fitnessGym hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/10 flex items-center gap-2 text-sm cursor-pointer"
        >
          + Adicionar Exercício
        </button>
        
      </div>

      {/* Filtros de Categorias */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-red-600 border-red-600 text-white shadow-md'
                : 'bg-neutral-900 border-neutral-800/60 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Exercícios */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-8 h-8 border-2 border-red-600 rounded-full border-b-transparent animate-spin"></div>
          <p className="text-xs font-medium text-neutral-400">A sincronizar catálogo de multimédia...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center border bg-red-950/20 border-red-900/30 rounded-xl">
          <p className="text-xs font-semibold text-red-400">{error}</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
          <p className="text-sm font-medium text-neutral-500">Nenhum exercício encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredExercises.map((exercise) => (
            <div 
              key={exercise.id} 
              className="flex flex-col p-4 transition-all duration-300 border bg-neutral-900/40 border-neutral-900 rounded-2xl hover:border-neutral-800/80 group"
            >
              {/* Box da Imagem / GIF */}
              <div className="relative flex items-center justify-center w-full overflow-hidden border aspect-square bg-neutral-950 rounded-xl border-neutral-900">
                {exercise.gifUrl ? (
                  <img 
                    src={resolverGifUrl(exercise.gifUrl)} 
                    alt={exercise.name} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-600">
                    <span className="text-3xl">🏋️‍♂️</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sem Demonstração</span>
                  </div>
                )}
                
                {/* Badge da Categoria */}
                <span className="absolute top-2 left-2 px-2.5 py-1 bg-neutral-950/80 border border-neutral-800 text-[10px] font-bold tracking-wide uppercase text-red-400 rounded-lg backdrop-blur-sm">
                  {exercise.category}
                </span>
              </div>

              {/* Informações */}
              <div className="my-3 space-y-1">
                <h3 className="text-sm font-bold text-white transition-colors line-clamp-1 group-hover:text-red-400">
                  {exercise.name}
                </h3>
              </div>

              {/* 🔥 BLOCO DE PROTEÇÃO INTELIGENTE DE PERMISSÕES */}
              {role === 'ADMIN' || exercise.userAdminId === user?.id ? (
                <div className="flex gap-2 pt-4 mt-auto border-t border-neutral-900/50">
                  <button
                    onClick={() => handleOpenEditModal(exercise)}
                    className="flex-1 py-2 text-xs font-semibold tracking-wider transition-all border cursor-pointer text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border-neutral-800 rounded-xl hover:text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, id: exercise.id, name: exercise.name })}
                    className="px-3 py-2 text-xs font-semibold transition-all border cursor-pointer text-neutral-400 bg-neutral-900 hover:bg-red-950/30 hover:text-red-400 border-neutral-800 hover:border-red-900/30 rounded-xl"
                  >
                    🗑️
                  </button>
                </div>
              ) : (
                <div className="pt-3 mt-auto text-center border-t border-neutral-900/30">
                  <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-950 border border-neutral-900 rounded-lg">
                    🔒 Biblioteca Global
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL UNIFICADO (Criar / Editar) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 space-y-4 border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">
                {editingId ? '✏️ Editar Exercício' : '🏋️‍♂️ Novo Exercício'}
              </h2>
              <p className="text-xs text-neutral-400">
                {editingId ? 'Modifica os parâmetros ou o GIF demonstrativo.' : 'Adiciona uma nova variação à biblioteca.'}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] font-medium text-red-400">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Campo Nome */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Nome do Exercício *</label>
                <input
                  type="text"
                  placeholder="Ex: Supino Inclinado com Halteres"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Campo Categoria */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Grupo Muscular / Categoria *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
                >
                  {categories.filter(c => c !== 'Todos').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Campo Upload Ficheiro */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Ficheiro de Demonstração {editingId ? '(Opcional)' : '*'}
                </label>
                <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between group hover:border-neutral-700 transition-colors">
                  <span className="text-neutral-400 text-xs truncate max-w-[220px]">
                    {selectedFile ? selectedFile.name : 'Selecionar imagem ou GIF...'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 group-hover:text-red-500">
                    Procurar
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">Formatos aceites: .gif, .png, .jpeg (Máx: 5MB)</p>
              </div>

              {/* Ações do Form */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/10 disabled:opacity-40 cursor-pointer"
                >
                  {submitLoading ? 'A Gravar...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINAÇÃO CUSTOMIZADO */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 space-y-4 text-center border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
            
            <div className="flex items-center justify-center w-12 h-12 mx-auto border rounded-full bg-red-500/10 border-red-500/20">
              <span className="text-lg text-red-500">🗑️</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Eliminar Exercício?</h3>
              <p className="text-xs leading-relaxed text-neutral-400">
                Tem a certeza que deseja remover permanentemente <span className="font-semibold text-red-400">"{deleteModal.name}"</span>? Esta ação não pode ser desfeita.
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
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}