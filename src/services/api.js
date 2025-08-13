// src/services/api.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const api = {
  auth: {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
  },
  
  dashboard: {
    getSummary: () => apiClient.get('/dashboard/summary'),
  },

  funcionarios: {
    getAll: (params) => apiClient.get('/funcionarios', { params }),
    getById: (matricula) => apiClient.get(`/funcionarios/${matricula}`),
    create: (data) => apiClient.post('/funcionarios', data),
    update: (matricula, data) => apiClient.put(`/funcionarios/${matricula}`, data),
    remove: (matricula) => apiClient.delete(`/funcionarios/${matricula}`),
  },

  afastamentos: {
    create: (matriculaFuncionario, data) => apiClient.post(`/funcionarios/${matriculaFuncionario}/afastamentos`, data),
    update: (id, data) => apiClient.put(`/afastamentos/${id}`, data),
    remove: (id) => apiClient.delete(`/afastamentos/${id}`),
  },
  
  planejamento: {
    getAtivo: () => apiClient.get('/ferias?planejamento=ativo'),
    gerarDistribuicao: (ano, descricao) => apiClient.post('/ferias/distribuir', { ano, descricao }),
    getHistorico: (ano) => apiClient.get('/planejamentos', { params: { ano } }),
    restaurar: (id) => apiClient.put(`/planejamentos/${id}/ativar`),
  },
  
  relatorios: {
    exportarFuncionarios: (params, matriculas) => apiClient.post(`/relatorios/funcionarios`, { matriculas }, { params, responseType: 'blob' }),
    getRiscoVencimento: (dias) => apiClient.get(`/relatorios/risco-vencimento?dias=${dias}`, { responseType: 'blob' }),
    getProjecaoCustos: (ano) => apiClient.get(`/relatorios/projecao-custos?ano=${ano}`, { responseType: 'blob' }),
    getAvisoFerias: (feriasId) => apiClient.get(`/relatorios/aviso-ferias/${feriasId}`, { responseType: 'blob' }),
  },
};

export { apiClient };
export default api;