import axios from 'axios';
 
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/weights`;
 
const weightService = {
  // Guardar um novo registo de peso/carga levantada
  logWeight: async (payload) => {
    try {
      const response = await axios.post(`${API_URL}/log`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao registar carga:', error);
      throw error.response?.data?.error || 'Erro ao salvar o registo de peso.';
    }
  },
 
  // Procurar o histórico de progressão ordenado por data
  getWeightHistory: async (studentId, exerciseName) => {
    try {
      const response = await axios.get(`${API_URL}/history`, {
        params: { studentId, exerciseName }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao procurar histórico de cargas:', error);
      throw error.response?.data?.error || 'Erro ao carregar histórico.';
    }
  }
};
 
export default weightService;