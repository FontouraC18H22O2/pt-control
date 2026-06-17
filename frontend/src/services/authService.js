import api from './api'; // Importa a tua instância central do Axios (a mesma usada no adminService)

/**
 * Envia uma solicitação de acesso pública para a administração analisar.
 * @param {string} nome - Nome completo do candidato a PT
 * @param {string} email - E-mail de contacto
 * @param {string} mensagem - Motivo ou observações do pedido (opcional)
 * @returns {Promise<Object>} Resposta de sucesso do backend
 */
export const requestAccessRequest = async (nome, email, mensagem) => {
  try {
    // 🔥 Bate exatamente na rota pública que definiste no Express: /api/auth/request-access
    const response = await api.post('/auth/request-access', {
      nome,
      email,
      mensagem
    });
    return response.data;
  } catch (error) {
    // Captura a mensagem amigável que escreveste no authController (ex: "Este email já se encontra registado...")
    const msgErro = error.response?.data?.error || 'Não foi possível processar o teu pedido neste momento.';
    console.error('❌ Erro em authService -> requestAccessRequest:', msgErro);
    throw new Error(msgErro);
  }
};

/**
 * Envia as credenciais do utilizador para validação e login.
 * @param {string} email - O email do utilizador
 * @param {string} password - A palavra-passe
 * @returns {Promise<Object>} O objeto contendo a mensagem, token e dados do utilizador
 */
export const loginRequest = async (email, password) => {
  try {
    // Atualizado para usar o axios (api) e enviar 'email' em vez de 'username'
    const response = await api.post('/auth/login', { 
      email, 
      password 
    });
    return response.data; // Devolve { message, token, user }
  } catch (error) {
    const msgErro = error.response?.data?.error || 'Falha na autenticação. Verifique os dados.';
    console.error('❌ Erro em loginRequest:', msgErro);
    throw new Error(msgErro);
  }
};