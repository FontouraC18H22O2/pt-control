import axios from 'axios';
 
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`;
 
const dashboardService = {
  // Procurar as métricas gerais do sistema (Total, Ativos, Inativos, Planos)
  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar métricas do dashboard:', error);
      throw error.response?.data?.error || 'Erro ao carregar dados do Dashboard.';
    }
  }
};
 
export default dashboardService;
 