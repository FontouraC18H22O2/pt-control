import api from './api';

const templateService = {
  getAll: async () => {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Erro ao carregar templates.';
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/templates', data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Erro ao criar template.';
    }
  },

  update: async (templateId, data) => {
    try {
      const response = await api.put(`/templates/${templateId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Erro ao atualizar template.';
    }
  },

  delete: async (templateId) => {
    try {
      const response = await api.delete(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Erro ao apagar template.';
    }
  }
};

export default templateService;