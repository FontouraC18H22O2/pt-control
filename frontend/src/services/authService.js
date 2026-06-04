const API_URL = 'http://localhost:5000/api/auth';

/**
 * Envia as credenciais do Personal Trainer para o backend para validação.
 * @param {string} username - O nome de utilizador (ex: admin_pt)
 * @param {string} password - A palavra-passe definida no backend
 * @returns {Promise<Object>} O objeto de resposta contendo o token JWT
 */
export const loginRequest = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    // Se o backend responder com um código de erro (400, 401, 500, etc.)
    if (!response.ok) {
      throw new Error(data.error || 'Falha na autenticação. Verifique os dados.');
    }

    return data; // Devolve { message, token }
  } catch (error) {
    console.error('❌ Erro em loginRequest:', error.message);
    throw error;
  }
};