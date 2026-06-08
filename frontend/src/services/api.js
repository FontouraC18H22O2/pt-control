import axios from 'axios';

// 1. Criar a instância central do Axios com o URL base do teu backend Express
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 2. INTERCEPTOR DE PEDIDOS (Request Interceptor)
api.interceptors.request.use(
  (config) => {
    // 🔑 CORREÇÃO CRUCIAL: Ler a chave exata que o AuthContext usa!
    const token = localStorage.getItem('pt_api_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. INTERCEPTOR DE RESPOSTAS (Response Interceptor)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('🔒 Token expirado ou inválido. A redirecionar para o login...');
      // Limpeza sincronizada com o nome correto das chaves
      localStorage.removeItem('pt_api_token');
      localStorage.removeItem('pt_api_user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;