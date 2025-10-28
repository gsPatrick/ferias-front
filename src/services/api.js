// src/services/api.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://geral-xlxsapi.r954jc.easypanel.host/api', 
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
    // ALTERAÇÃO: A função agora aceita um objeto de parâmetros genérico
    getSummary: (params) => apiClient.get('/dashboard/summary', { params }),
  },

  funcionarios: {
    getAll: (params) => apiClient.get('/funcionarios', { params }),
    getById: (matricula) => apiClient.get(`/funcionarios/${matricula}`),
    create: (data) => apiClient.post('/funcionarios', data),
    update: (matricula, data) => apiClient.put(`/funcionarios/${matricula}`, data),
    remove: (matricula) => apiClient.delete(`/funcionarios/${matricula}`),
    importPlanilha: (formData) => apiClient.post('/funcionarios/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getFilterOptions: () => apiClient.get('/funcionarios/filter-options'),
  },

  afastamentos: {
    getAllActive: (params) => apiClient.get('/afastamentos', { params }),
    getById: (id) => apiClient.get(`/afastamentos/${id}`),
    create: (matriculaFuncionario, data) => apiClient.post(`/funcionarios/${matriculaFuncionario}/afastamentos`, data),
    update: (id, data) => apiClient.put(`/afastamentos/${id}`, data),
    remove: (id) => apiClient.delete(`/afastamentos/${id}`),
    bulkRemove: (ids) => apiClient.delete('/afastamentos/bulk', { data: { ids } }),
  },
  
  ferias: {
    getPlanejamentoAtivo: (params) => apiClient.get('/ferias/planejamento-ativo', { params }),
    getById: (id) => apiClient.get(`/ferias/${id}`),
    create: (matriculaFuncionario, data) => apiClient.post(`/funcionarios/${matriculaFuncionario}/ferias`, data),
    update: (id, data) => apiClient.put(`/ferias/${id}`, data),
    remove: (id) => apiClient.delete(`/ferias/${id}`),
    bulkRemove: (ids) => apiClient.delete('/ferias/bulk', { data: { ids } }),
    distribuir: (data) => apiClient.post('/ferias/distribuir', data),
    redistribuirSelecionadas: (data) => apiClient.post('/ferias/redistribuir-selecionados', data),
  },
  
  planejamento: {
    getHistorico: (ano) => apiClient.get('/planejamentos', { params: { ano } }),
    restaurar: (id) => apiClient.put(`/planejamentos/${id}/ativar`),
    getVisaoGeral: (ano, mes, filters) => apiClient.get('/planejamentos/visao-geral', { params: { ano, mes, ...filters } }),
  },

  // ==========================================================
  // NOVO MÓDULO ADICIONADO AQUI
  // ==========================================================
  substitutos: {
    getAll: () => apiClient.get('/substitutos'),
    create: (data) => apiClient.post('/substitutos', data),
    update: (id, data) => apiClient.put(`/substitutos/${id}`, data),
    remove: (id) => apiClient.delete(`/substitutos/${id}`),
  },
  
  users: {
    getAll: () => apiClient.get('/users'),
    create: (data) => apiClient.post('/users', data),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    remove: (id) => apiClient.delete(`/users/${id}`),
  },
  
  relatorios: {
    exportarFuncionarios: (params, matriculas) => apiClient.post(`/relatorios/funcionarios`, { matriculas }, { params, responseType: 'blob' }),
    exportarPlanejamento: (params) => apiClient.get('/relatorios/planejamento', { params, responseType: 'blob' }),
    getRiscoVencimento: (dias) => apiClient.get(`/relatorios/risco-vencimento?dias=${dias}`, { responseType: 'blob' }),
    getProjecaoCustos: (ano) => apiClient.get(`/relatorios/projecao-custos?ano=${ano}`, { responseType: 'blob' }),
    getAvisoFerias: (feriasId) => apiClient.get(`/relatorios/aviso-ferias/${feriasId}`, { responseType: 'blob' }),
  },
  
  alertas: {
    getRetornosProximos: (dias) => apiClient.get('/alertas/retorno-afastamento', { params: { dias } }),
    getNecessitaReprogramacao: (periodo) => apiClient.get('/alertas/necessita-reprogramacao', { params: { periodo } }),
  }
};

export { apiClient };
export default api;