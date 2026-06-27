import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/training`;

const trainingService = {
  // 1. Procurar TODOS os planos de um aluno (Dia 1, Dia 2, ...)
  getPlansByStudent: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/student/${studentId}/plans`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao procurar planos do aluno ${studentId}:`, error);
      throw error.response?.data?.error || 'Erro ao carregar os planos de treino.';
    }
  },

  // 2. Compatibilidade legada — procura o plano mais recente
  getPlanByStudent: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao procurar plano do aluno ${studentId}:`, error);
      throw error.response?.data?.error || 'Erro ao carregar o plano de treino.';
    }
  },

  // 3. Criar ou atualizar um plano específico (por dayNumber)
  saveTrainingPlan: async (planData) => {
    try {
      const response = await axios.post(API_URL, planData);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar plano de treino:', error);
      throw error.response?.data?.error || 'Erro ao salvar o plano de treino.';
    }
  },

  // 4. Apagar um plano específico
  deletePlan: async (planId) => {
    try {
      const response = await axios.delete(`${API_URL}/plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao apagar plano:', error);
      throw error.response?.data?.error || 'Erro ao apagar o plano de treino.';
    }
  },

  // 5. Ir buscar todos os exercícios da biblioteca global (com GIFs)
  getAllExercises: async () => {
    try {
      const response = await axios.get(`${API_URL}/gifs`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar biblioteca de exercícios:', error);
      throw error.response?.data?.error || 'Erro ao carregar a biblioteca.';
    }
  },

  // 6. Calendário — listar agendamentos (filtro opcional por mês/ano)
  getSchedule: async (month, year) => {
    try {
      const params = month && year ? { month, year } : {};
      const response = await axios.get(`${API_URL}/schedule`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      throw error.response?.data?.error || 'Erro ao carregar a agenda.';
    }
  },

  // 7. Calendário — criar agendamento
  createSchedule: async (payload) => {
    try {
      const response = await axios.post(`${API_URL}/schedule`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error.response?.data?.error || 'Erro ao criar agendamento.';
    }
  },

  // 8. Calendário — apagar agendamento
  deleteSchedule: async (scheduleId) => {
    try {
      const response = await axios.delete(`${API_URL}/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao apagar agendamento:', error);
      throw error.response?.data?.error || 'Erro ao apagar agendamento.';
    }
  }
};

export default trainingService;