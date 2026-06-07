import axios from 'axios';

const API_URL = 'http://localhost:5000/api/training';

const trainingService = {
  // 1. Procurar o plano de treino atual de um aluno específico
  getPlanByStudent: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao procurar plano do aluno ${studentId}:`, error);
      throw error.response?.data?.error || 'Erro ao carregar o plano de treino.';
    }
  },

  // 2. Criar ou atualizar o plano de treino completo do aluno
  saveTrainingPlan: async (planData) => {
    try {
      const response = await axios.post(API_URL, planData);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar plano de treino:', error);
      throw error.response?.data?.error || 'Erro ao salvar o plano de treino.';
    }
  }
};

export default trainingService;