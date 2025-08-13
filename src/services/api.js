// src/services/api.js

import axios from 'axios';

const apiClient = axios.create({
  // Garanta que esta URL esteja correta para o seu ambiente.
  // Se você está rodando o frontend e o backend localmente, esta URL é comum.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://geral-xlxsapi.r954jc.easypanel.host/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação em todas as requisições
apiClient.interceptors.request.use(
  (config) => {
    // Verifica se o código está rodando no navegador antes de acessar o localStorage
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

// Estrutura completa do serviço da API
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
    // A função de importação precisa de um header diferente
    importPlanilha: (formData) => apiClient.post('/funcionarios/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
  },

  afastamentos: {
    create: (matriculaFuncionario, data) => apiClient.post(`/funcionarios/${matriculaFuncionario}/afastamentos`, data),
    update: (id, data) => apiClient.put(`/afastamentos/${id}`, data),
    remove: (id) => apiClient.delete(`/afastamentos/${id}`),
  },
  
  ferias: {
    // Rota principal para criar férias (espera matricula_funcionario no corpo)
    create: (data) => apiClient.post('/ferias', data),
    // Você pode adicionar update e remove aqui se precisar
    // update: (id, data) => apiClient.put(`/ferias/${id}`, data),
    // remove: (id) => apiClient.delete(`/ferias/${id}`),
  },
  
  planejamento: {
    getAtivo: () => apiClient.get('/ferias?planejamento=ativo'),
    gerarDistribuicao: (ano, descricao) => apiClient.post('/ferias/distribuir', { ano, descricao }),
    getHistorico: (ano) => apiClient.get('/planejamentos', { params: { ano } }),
    restaurar: (id) => apiClient.put(`/planejamentos/${id}/ativar`),
    getVisaoGeral: (ano, mes) => apiClient.get('/planejamentos/visao-geral', { params: { ano, mes } }),
  },
  
  // ===================================
  // NOVO MÓDULO PARA USUÁRIOS (ADICIONADO)
  // ===================================
  users: {
    getAll: () => apiClient.get('/users'),
    create: (data) => apiClient.post('/users', data),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    remove: (id) => apiClient.delete(`/users/${id}`),
  },
  
  relatorios: {
    exportarFuncionarios: (params, matriculas) => apiClient.post(`/relatorios/funcionarios`, { matriculas }, { params, responseType: 'blob' }),
    getRiscoVencimento: (dias) => apiClient.get(`/relatorios/risco-vencimento?dias=${dias}`, { responseType: 'blob' }),
    getProjecaoCustos: (ano) => apiClient.get(`/relatorios/projecao-custos?ano=${ano}`, { responseType: 'blob' }),
    getAvisoFerias: (feriasId) => apiClient.get(`/relatorios/aviso-ferias/${feriasId}`, { responseType: 'blob' }),
  },
};

// Exporta o cliente configurado (útil para casos específicos) e o objeto da API
export { apiClient };
export default api;