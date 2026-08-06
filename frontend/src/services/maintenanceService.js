import api from './api';

const maintenanceService = {
  // Verifica se a plataforma está em manutenção (público)
  getStatus: async () => {
    try {
      const response = await api.get('/maintenance');
      return response.data.maintenance;
    } catch {
      return false; // Em caso de erro, assume que não está em manutenção
    }
  },

  // Liga a manutenção (só ADMIN)
  enable: async () => {
    const response = await api.post('/maintenance/enable');
    return response.data;
  },

  // Desliga a manutenção (só ADMIN)
  disable: async () => {
    const response = await api.post('/maintenance/disable');
    return response.data;
  }
};

export default maintenanceService;