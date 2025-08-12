// src/services/api.js

import axios from 'axios';

// 1. Criação da instância do Axios com a URL base da sua API
const apiClient = axios.create({
  baseURL: 'https://geral-xlxsapi.r954jc.easypanel.host/api', // SUA URL DA API
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor de Requisições: A MÁGICA ACONTECE AQUI
// Antes de CADA requisição ser enviada, este código é executado.
apiClient.interceptors.request.use(
  (config) => {
    // Pega o token de autenticação do localStorage
    const token = localStorage.getItem('authToken');
    
    // Se o token existir, adiciona ao cabeçalho 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Retorna a configuração modificada para a requisição prosseguir
  },
  (error) => {
    // Em caso de erro na configuração da requisição, rejeita a promise
    return Promise.reject(error);
  }
);

// 3. Objeto `api` com todas as funções de chamada, organizadas por módulo

const api = {
  // --- Módulo de Autenticação ---
  auth: {
    /**
     * Realiza o login do usuário.
     * @param {string} email - O e-mail do usuário.
     * @param {string} password - A senha do usuário.
     * @returns {Promise<object>} A resposta da API com o token e os dados do usuário.
     */
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
  },

  // --- Módulo de Funcionários ---
  funcionarios: {
    /**
     * Busca uma lista de funcionários com filtros.
     * @param {object} params - Objeto com os parâmetros de query (ex: { filtro: 'vencidas' }).
     * @returns {Promise<Array<object>>} A lista de funcionários.
     */
    getAll: (params) => apiClient.get('/funcionarios', { params }),
    
    /**
     * Busca os detalhes completos de um único funcionário.
     * @param {string} matricula - A matrícula do funcionário.
     * @returns {Promise<object>} Os dados do funcionário.
     */
    getById: (matricula) => apiClient.get(`/funcionarios/${matricula}`),

    /**
     * Cria um novo funcionário.
     * @param {object} data - Os dados do novo funcionário.
     * @returns {Promise<object>} O funcionário criado.
     */
    create: (data) => apiClient.post('/funcionarios', data),

    /**
     * Atualiza os dados de um funcionário.
     * @param {string} matricula - A matrícula do funcionário a ser atualizado.
     * @param {object} data - Os novos dados do funcionário.
     * @returns {Promise<object>} O funcionário atualizado.
     */
    update: (matricula, data) => apiClient.put(`/funcionarios/${matricula}`, data),

    /**
     * Remove um funcionário.
     * @param {string} matricula - A matrícula do funcionário a ser removido.
     * @returns {Promise<void>}
     */
    remove: (matricula) => apiClient.delete(`/funcionarios/${matricula}`),
  },

  // --- Módulo de Afastamentos ---
  afastamentos: {
    /**
     * Cria um novo afastamento para um funcionário.
     * @param {string} matriculaFuncionario - Matrícula do funcionário associado.
     * @param {object} data - Dados do afastamento (motivo, data_inicio, data_fim).
     * @returns {Promise<object>} O afastamento criado.
     */
    create: (matriculaFuncionario, data) => apiClient.post(`/funcionarios/${matriculaFuncionario}/afastamentos`, data),
    
    /**
     * Atualiza um afastamento existente.
     * @param {number} id - O ID do afastamento.
     * @param {object} data - Os novos dados do afastamento.
     * @returns {Promise<object>} O afastamento atualizado.
     */
    update: (id, data) => apiClient.put(`/afastamentos/${id}`, data),
    
    /**
     * Remove um afastamento.
     * @param {number} id - O ID do afastamento.
     * @returns {Promise<void>}
     */
    remove: (id) => apiClient.delete(`/afastamentos/${id}`),
  },
  
  // --- Módulo de Relatórios (para download de arquivos) ---
  relatorios: {
    /**
     * Baixa o relatório de risco de vencimento em formato XLSX.
     * @returns {Promise<Blob>} O arquivo XLSX como um Blob.
     */
    getRiscoVencimento: () => apiClient.get('/relatorios/risco-vencimento', { responseType: 'blob' }),

    /**
     * Baixa o Aviso de Férias em formato XLSX.
     * @param {number} feriasId - O ID do período de férias.
     * @returns {Promise<Blob>} O arquivo XLSX como um Blob.
     */
    getAvisoFerias: (feriasId) => apiClient.get(`/relatorios/aviso-ferias?feriasId=${feriasId}`, { responseType: 'blob' }),
  },
    dashboard: {
    /**
     * Busca os dados de resumo para o dashboard.
     * @returns {Promise<object>} Os dados de resumo.
     */
    getSummary: () => apiClient.get('/dashboard/summary'),
  },
   planejamento: {
    /**
     * Busca os registros de férias do planejamento ativo.
     * @returns {Promise<Array<object>>} A lista de férias planejadas.
     */
    getAtivo: () => apiClient.get('/ferias?planejamento=ativo'),

    /**
     * Aciona a geração de um novo planejamento de férias.
     * @param {number} ano - O ano para o qual gerar o planejamento.
     * @param {string} [descricao] - Uma descrição opcional.
     * @returns {Promise<object>} A resposta da API.
     */
    gerarDistribuicao: (ano, descricao) => apiClient.post('/ferias/distribuir', { ano, descricao }),
  },

    relatorios: {
    /**
     * Baixa o relatório de risco de vencimento.
     * @param {number} dias - O número de dias para o filtro de risco.
     * @returns {Promise<Blob>} O arquivo XLSX.
     */
    getRiscoVencimento: (dias) => apiClient.get(`/relatorios/risco-vencimento?dias=${dias}`, { responseType: 'blob' }),

    /**
     * Baixa a projeção de custos.
     * @param {number} ano - O ano de referência.
     * @returns {Promise<Blob>} O arquivo XLSX.
     */
    getProjecaoCustos: (ano) => apiClient.get(`/relatorios/projecao-custos?ano=${ano}`, { responseType: 'blob' }),

    /**
     * Baixa o Aviso de Férias.
     * @param {number} feriasId - O ID do período de férias.
     * @returns {Promise<Blob>} O arquivo XLSX.
     */
    getAvisoFerias: (feriasId) => apiClient.get(`/relatorios/aviso-ferias/${feriasId}`, { responseType: 'blob' }),
  },
    planejamento: {
    getAtivo: () => apiClient.get('/ferias?planejamento=ativo'),
    gerarDistribuicao: (ano, descricao) => apiClient.post('/ferias/distribuir', { ano, descricao }),
    
    /**
     * Busca o histórico de planejamentos, com filtro opcional por ano.
     * @param {number} [ano] - O ano para filtrar.
     * @returns {Promise<Array<object>>} A lista de planejamentos.
     */
    getHistorico: (ano) => apiClient.get('/planejamentos', { params: { ano } }),

    /**
     * Restaura (ativa) um planejamento arquivado.
     * @param {number} id - O ID do planejamento a ser restaurado.
     * @returns {Promise<object>} A resposta da API.
     */
    restaurar: (id) => apiClient.put(`/planejamentos/${id}/ativar`),
  },

};

export default api;