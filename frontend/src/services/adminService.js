import api from './api'; // Importa a tua instância central do Axios

/**
 * Cria uma nova conta profissional de Personal Trainer no sistema.
 * Esta rota é protegida e exige que o utilizador autenticado seja um ADMIN.
 * * @param {Object} dadosPT - Objeto com os dados do treinador
 * @param {string} dadosPT.nome - Nome completo do Personal Trainer
 * @param {string} dadosPT.email - E-mail oficial do Personal Trainer
 * @returns {Promise<Object>} Resposta de sucesso do backend { message, userId }
 * * @returns {Promise<Array>} Lista de objetos [{ id, nome, email, role, isActive, lastLogin }]
 * * @param {number|string} id - ID único do utilizador a desativar
 * @returns {Promise<Object>} Mensagem de sucesso do servidor
 * @returns {Promise<Object>} Objeto com { totalAlunos, totalPlanos, totalExercicios }
 */
 
export const createTrainer = async (dadosPT) => {
  try {
    // Faz o POST para a rota administrativa que protegemos no Express
    const response = await api.post('/auth/admin/create-trainer', {
      nome: dadosPT.nome.trim(),
      email: dadosPT.email.toLowerCase().trim()
    });
    
    return response.data;
  } catch (error) {
    // Captura o erro tratado enviado pelo authMiddleware ou pelo controlador
    const msgErro = error.response?.data?.error || 'Erro ao criar a conta de Personal Trainer.';
    console.error('❌ Erro em adminService -> createTrainer:', msgErro);
    throw new Error(msgErro);
  }
};
export const getTrainersList = async () => {
  try {
    const response = await api.get('/auth/admin/trainers');
    return response.data; // Retorna o Array enviado pelo Prisma
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Erro ao carregar a lista de Personal Trainers.';
    console.error('❌ Erro em adminService -> getTrainersList:', msgErro);
    throw new Error(msgErro);
  }
};

export const deactivateTrainer = async (id) => {
  try {
    const response = await api.patch(`/auth/admin/deactivate-trainer/${id}`);
    return response.data;
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Erro ao revogar o acesso do treinador.';
    console.error('❌ Erro em adminService -> deactivateTrainer:', msgErro);
    throw new Error(msgErro);
  }
};
export const getTrainerMetrics = async () => {
  try {
    // 🔥 CORRIGIDO: Adicionado o prefixo /auth para bater certo com o roteador do Express
    const response = await api.get('/auth/trainer/metrics');
    return response.data;
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Erro ao carregar métricas do treinador.';
    console.error('❌ Erro em adminService -> getTrainerMetrics:', msgErro);
    throw new Error(msgErro);
  }
};

/**
 * Carrega todas as solicitações de acesso pendentes na base de dados.
 * Esta rota é exclusiva para utilizadores com a Role 'ADMIN'.
 * @returns {Promise<Array>} Lista de objetos [{ id, nome, email, mensagem, status, createdAt }]
 */
export const getPendingAccessRequests = async () => {
  try {
    const response = await api.get('/auth/admin/access-requests');
    return response.data; // Retorna o Array de pedidos enviados pelo Prisma
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Erro ao carregar os pedidos de acesso pendentes.';
    console.error('❌ Erro em adminService -> getPendingAccessRequests:', msgErro);
    throw new Error(msgErro);
  }
};

/**
 * Atualiza o estado de um pedido de acesso específico (Aprovar ou Recusar).
 * @param {number|string} id - ID único da solicitação de acesso
 * @param {string} status - Novo estado ('Aprovado' ou 'Recusado')
 * @returns {Promise<Object>} Resposta de sucesso do backend
 */
export const updateAccessRequestStatus = async (id, status) => {
  try {
    const response = await api.patch(`/auth/admin/access-requests/${id}/status`, {
      status: status
    });
    return response.data;
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Erro ao atualizar o estado da solicitação.';
    console.error('❌ Erro em adminService -> updateAccessRequestStatus:', msgErro);
    throw new Error(msgErro);
  }
};