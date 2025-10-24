// src/app/(dashboard)/funcionarios/page.js
'use client'; 

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import Pagination from '@/components/Pagination/Pagination';
import styles from './funcionarios.module.css';
import { User, Search, Filter, UserPlus, Trash2, CalendarPlus, FileWarning, Download, XCircle, AlertCircle } from 'lucide-react';

// --- HELPERS E COMPONENTES INTERNOS ---

const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const StatusBadge = ({ status }) => {
    const statusClass = status === 'Ativo' ? styles.statusAtivo : styles.statusInativo;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
};

const RiskIndicator = ({ dias }) => {
    if (dias === null || dias === undefined) return null;
    let riskLevel = styles.low;
    if (dias <= 60 && dias > 30) { riskLevel = styles.medium; }
    if (dias <= 30 && dias >= 0) { riskLevel = styles.high; }
    if (dias < 0) { riskLevel = styles.expired; }
    return <div className={`${styles.riskIndicator} ${riskLevel}`}></div>;
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const getUniqueOptions = (data, key) => {
    if (!data || !Array.isArray(data)) return [];
    const options = new Set(data.map(item => item[key]).filter(Boolean));
    return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
};

// --- COMPONENTE PRINCIPAL ---

function FuncionariosComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // ESTADOS GERAIS
    const [todosFuncionarios, setTodosFuncionarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false); // NOVO ESTADO
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedFuncionarios, setSelectedFuncionarios] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // ESTADOS DE FILTRAGEM E PAGINAÇÃO
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(true);
    const itemsPerPage = 20;

    // BUSCA DE DADOS INICIAL
    const fetchAllFuncionarios = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.funcionarios.getAll({ limit: 10000 }); 
            setTodosFuncionarios(response.data.data || []);
        } catch (error) {
            console.error("Falha ao buscar funcionários:", error);
            setTodosFuncionarios([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllFuncionarios();
    }, [fetchAllFuncionarios]);

    // LÓGICA DE FILTRAGEM E BUSCA EM TEMPO REAL
    const funcionariosFiltrados = useMemo(() => {
        if (!todosFuncionarios.length) return [];
        
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        
        return todosFuncionarios.filter(func => {
            // Verificação de busca por nome ou matrícula
            const searchMatch = lowercasedSearchTerm ? (
                (func.nome_funcionario?.toLowerCase().includes(lowercasedSearchTerm) || false) ||
                (String(func.matricula || '').toLowerCase().includes(lowercasedSearchTerm))
            ) : true;

            // Verificação de filtros
            const filtersMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const funcValue = func[key];
                if (funcValue === null || funcValue === undefined) return false;
                return String(funcValue).toLowerCase().includes(value.toLowerCase());
            });

            return searchMatch && filtersMatch;
        });
    }, [todosFuncionarios, searchTerm, filters]);

    // LÓGICA DE PAGINAÇÃO
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return funcionariosFiltrados.slice(startIndex, startIndex + itemsPerPage);
    }, [funcionariosFiltrados, currentPage]);

    const paginationInfo = {
        currentPage: currentPage,
        totalPages: Math.ceil(funcionariosFiltrados.length / itemsPerPage),
        totalItems: funcionariosFiltrados.length
    };

    // HANDLERS DE FILTROS E BUSCA
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
    };

    const toggleFilters = () => {
        setShowFilters(prev => !prev);
    };

    // HANDLERS DE SELEÇÃO
    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        setSelectedFuncionarios(checked ? paginatedData.map(f => f.matricula) : []);
    };

    const handleSelectFuncionario = (matricula, checked) => {
        setSelectedFuncionarios(prev => checked ? [...prev, matricula] : prev.filter(id => id !== matricula));
        if (!checked) {
            setSelectAll(false);
        }
    };

    // HANDLERS DE MODAL
    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });
    
    // HANDLERS DE AÇÕES
    const handleExport = async () => {
        if (funcionariosFiltrados.length === 0) {
            alert('Não há funcionários para exportar com os filtros atuais.');
            return;
        }
        
        setIsExporting(true);
        try {
            // Envia todos os filtros aplicados e o termo de busca para o backend
            const response = await api.relatorios.exportarFuncionarios(
                { ...filters, busca: searchTerm }, 
                [] // Array de matrículas vazio para indicar que queremos usar os filtros
            );
            downloadFile(response.data, 'relatorio_funcionarios.xlsx');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar funcionários.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkDelete = () => {
        if (selectedFuncionarios.length === 0) {
            alert('Selecione pelo menos um funcionário para excluir.');
            return;
        }
        openModal('bulkDelete', selectedFuncionarios);
    };

    const getActionItems = (funcionario) => [
        { 
            label: 'Ver Perfil', 
            icon: <User size={16}/>, 
            onClick: () => router.push(`/funcionarios/${funcionario.matricula}`) 
        },
        { 
            label: 'Lançar Férias', 
            icon: <CalendarPlus size={16}/>, 
            onClick: () => openModal('lancarFerias', funcionario) 
        },
        { 
            label: 'Lançar Afastamento', 
            icon: <FileWarning size={16}/>, 
            onClick: () => openModal('lancarAfastamento', funcionario) 
        },
        { 
            label: 'Excluir', 
            icon: <Trash2 size={16}/>, 
            variant: 'danger', 
            onClick: () => openModal('excluir', funcionario) 
        },
    ];

    // DEFINIÇÃO DAS COLUNAS DA TABELA
    const columns = [
        { header: 'Ações', accessor: 'acoes', sticky: true }, 
        { header: 'Matrícula', accessor: 'matricula' },
        { header: 'Nome', accessor: 'nome_funcionario' }, 
        { header: 'Status', accessor: 'status' },
        { header: 'Dias Disp.', accessor: 'saldo_dias_ferias' }, // NOVA COLUNA
        { header: 'Situação Atual', accessor: 'situacao_ferias_afastamento_hoje' }, 
        { header: 'Admissão', accessor: 'dth_admissao' },
        { header: 'Próx. Período', accessor: 'proximo_periodo_aquisitivo_texto' }, 
        { header: 'Início Período', accessor: 'periodo_aquisitivo_atual_inicio' },
        { header: 'Fim Período', accessor: 'periodo_aquisitivo_atual_fim' }, 
        { header: 'Data Limite', accessor: 'dth_limite_ferias' },
        { header: 'Última Data Plan.', accessor: 'ultima_data_planejada' }, 
        { header: 'Qtd. Faltas', accessor: 'faltas_injustificadas_periodo' },
        { header: 'Categoria/Cargo', accessor: 'categoria' }, 
        { header: 'Cat. Trab.', accessor: 'categoria_trab' },
        { header: 'Horário', accessor: 'horario' }, 
        { header: 'Escala', accessor: 'escala' },
        { header: 'UF', accessor: 'sigla_local' }, 
        { header: 'Gestão Contrato', accessor: 'des_grupo_contrato' },
        { header: 'ID Gestão', accessor: 'id_grupo_contrato' }, 
        { header: 'Convenção', accessor: 'convencao' },
    ];

    // Opções dinâmicas para os filtros
    const filterOptions = useMemo(() => ({
        status: ['Ativo', 'Inativo'],
        matricula: getUniqueOptions(todosFuncionarios, 'matricula'),
        nome_funcionario: getUniqueOptions(todosFuncionarios, 'nome_funcionario'),
        situacao_ferias_afastamento_hoje: getUniqueOptions(todosFuncionarios, 'situacao_ferias_afastamento_hoje'),
        dth_admissao: getUniqueOptions(todosFuncionarios, 'dth_admissao'),
        proximo_periodo_aquisitivo_texto: getUniqueOptions(todosFuncionarios, 'proximo_periodo_aquisitivo_texto'),
        periodo_aquisitivo_atual_inicio: getUniqueOptions(todosFuncionarios, 'periodo_aquisitivo_atual_inicio'),
        periodo_aquisitivo_atual_fim: getUniqueOptions(todosFuncionarios, 'periodo_aquisitivo_atual_fim'),
        dth_limite_ferias: getUniqueOptions(todosFuncionarios, 'dth_limite_ferias'),
        ultima_data_planejada: getUniqueOptions(todosFuncionarios, 'ultima_data_planejada'),
        faltas_injustificadas_periodo: getUniqueOptions(todosFuncionarios, 'faltas_injustificadas_periodo'),
        categoria: getUniqueOptions(todosFuncionarios, 'categoria'),
        categoria_trab: getUniqueOptions(todosFuncionarios, 'categoria_trab'),
        horario: getUniqueOptions(todosFuncionarios, 'horario'),
        escala: getUniqueOptions(todosFuncionarios, 'escala'),
        sigla_local: getUniqueOptions(todosFuncionarios, 'sigla_local'),
        des_grupo_contrato: getUniqueOptions(todosFuncionarios, 'des_grupo_contrato'),
        id_grupo_contrato: getUniqueOptions(todosFuncionarios, 'id_grupo_contrato'),
        convencao: getUniqueOptions(todosFuncionarios, 'convencao'),
        municipio_local_trabalho: getUniqueOptions(todosFuncionarios, 'municipio_local_trabalho'),
    }), [todosFuncionarios]);

    // RENDERIZAÇÃO DO MODAL
    const renderModalContent = () => {
        const refreshData = () => fetchAllFuncionarios();
        
        switch (modalState.type) {
            case 'adicionar':
                return (
                    <div className={styles.modalFormGrid}>
                        <div className={styles.formGroup}>
                            <label>Nome Completo</label>
                            <input type="text" placeholder="Digite o nome completo" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Matrícula</label>
                            <input type="text" placeholder="Digite a matrícula" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CPF</label>
                            <input type="text" placeholder="000.000.000-00" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Data de Admissão</label>
                            <input type="date" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cargo</label>
                            <input type="text" placeholder="Digite o cargo" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select>
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button onClick={closeModal}>Salvar</Button>
                        </div>
                    </div>
                );
            case 'excluir':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir o funcionário <strong>{modalState.data?.nome_funcionario}</strong>?</p>
                        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem' }}>
                            Esta ação não pode ser desfeita.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={closeModal}>Excluir</Button>
                        </div>
                    </div>
                );
            case 'bulkDelete':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir <strong>{selectedFuncionarios.length}</strong> funcionários selecionados?</p>
                        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem' }}>
                            Esta ação não pode ser desfeita.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={closeModal}>Excluir Selecionados</Button>
                        </div>
                    </div>
                );
            case 'lancarFerias':
                const handleFeriasSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        await api.ferias.create(modalState.data.matricula, data);
                        alert('Férias lançadas com sucesso!');
                        closeModal();
                        refreshData();
                    } catch (error) {
                        console.error("Erro ao lançar férias:", error);
                        alert(error.response?.data?.message || "Erro ao lançar férias.");
                    }
                };
                
                return (
                    <form onSubmit={handleFeriasSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Funcionário</label>
                                <input type="text" value={modalState.data?.nome_funcionario || ''} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Matrícula</label>
                                <input type="text" value={modalState.data?.matricula || ''} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input name="data_inicio" type="date" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Fim</label>
                                <input name="data_fim" type="date" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Dias de Férias</label>
                                <input name="qtd_dias" type="number" placeholder="30" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Observações</label>
                                <input name="observacao" type="text" placeholder="Observações opcionais" />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
                                <Button type="submit">Lançar Férias</Button>
                            </div>
                        </div>
                    </form>
                );
            case 'lancarAfastamento':
                const handleAfastamentoSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.impacta_ferias = !!data.impacta_ferias;

                    try {
                        await api.afastamentos.create(modalState.data.matricula, data);
                        alert('Afastamento lançado com sucesso!');
                        closeModal();
                        refreshData();
                    } catch (error) {
                        console.error("Erro ao lançar afastamento:", error);
                        alert(error.response?.data?.message || "Erro ao lançar afastamento.");
                    }
                };

                return (
                    <form onSubmit={handleAfastamentoSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Funcionário</label>
                                <input type="text" value={modalState.data?.nome_funcionario || ''} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Matrícula</label>
                                <input type="text" value={modalState.data?.matricula || ''} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Motivo do Afastamento</label>
                                <input name="motivo" type="text" placeholder="Ex: Licença Médica" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input name="data_inicio" type="date" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Fim (Prevista)</label>
                                <input name="data_fim" type="date" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>
                                    <input name="impacta_ferias" type="checkbox" defaultChecked value="true" />
                                    {' '}Impacta no cálculo de férias?
                                </label>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
                                <Button type="submit">Lançar Afastamento</Button>
                            </div>
                        </div>
                    </form>
                );
            default:
                return <p>Conteúdo do modal não encontrado.</p>;
        }
    };

    const getModalTitle = () => {
        switch (modalState.type) {
            case 'adicionar': return 'Adicionar Funcionário';
            case 'excluir': return 'Excluir Funcionário';
            case 'bulkDelete': return 'Excluir Funcionários';
            case 'lancarFerias': return 'Lançar Férias';
            case 'lancarAfastamento': return 'Lançar Afastamento';
            default: return 'Modal';
        }
    };

    return (
        <div className={styles.container}>
            {/* CABEÇALHO */}
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <User size={32} />
                    <h1>Painel de Funcionários</h1>
                    <span style={{ 
                        fontSize: '0.9rem', 
                        color: '#6b7280', 
                        marginLeft: '1rem' 
                    }}>
                        ({funcionariosFiltrados.length} de {todosFuncionarios.length})
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        variant="secondary" 
                        icon={<Filter size={16} />} 
                        onClick={toggleFilters}
                    >
                        {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                    </Button>
                    <Button 
                        variant="secondary" 
                        icon={<Download size={16} />} 
                        onClick={handleExport}
                        disabled={isExporting || funcionariosFiltrados.length === 0}
                    >
                        {isExporting ? 'Exportando...' : `Exportar (${funcionariosFiltrados.length})`}
                    </Button>
                    {selectedFuncionarios.length > 0 && (
                        <Button 
                            variant="danger" 
                            icon={<Trash2 size={16} />} 
                            onClick={handleBulkDelete}
                        >
                            Excluir ({selectedFuncionarios.length})
                        </Button>
                    )}
                    <Button 
                        icon={<UserPlus size={16} />} 
                        onClick={() => openModal('adicionar')}
                    >
                        Adicionar Funcionário
                    </Button>
                </div>
            </div>

            {/* ÁREA DE FILTROS */}
            {showFilters && (
                <div className={styles.filterGrid}>
                    <div className={`${styles.formGroup} ${styles.searchGroup}`}>
                        <label htmlFor="search">Busca Rápida</label>
                        <div className={styles.inputIconWrapper}>
                            <Search size={18} className={styles.inputIcon} />
                            <input id="search" type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange}/>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="status">Status</label>
                        <select id="status" name="status" value={filters.status || ''} onChange={handleFilterChange}>
                            <option value="">Todos</option>
                            {filterOptions.status.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}><label htmlFor="matricula">Matrícula</label><input id="matricula" name="matricula" type="text" placeholder="Filtrar por matrícula" value={filters.matricula || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="situacao_ferias_afastamento_hoje">Situação Atual</label><input id="situacao_ferias_afastamento_hoje" name="situacao_ferias_afastamento_hoje" type="text" placeholder="Filtrar situação" value={filters.situacao_ferias_afastamento_hoje || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="categoria">Categoria/Cargo</label><input id="categoria" name="categoria" type="text" placeholder="Filtrar por cargo" value={filters.categoria || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="categoria_trab">Cat. Trabalhador</label><input id="categoria_trab" name="categoria_trab" type="text" placeholder="Categoria trabalhador" value={filters.categoria_trab || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="horario">Horário</label><input id="horario" name="horario" type="text" placeholder="Filtrar horário" value={filters.horario || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="escala">Escala</label><input id="escala" name="escala" type="text" placeholder="Filtrar escala" value={filters.escala || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="sigla_local">Estado (UF)</label><input id="sigla_local" name="sigla_local" type="text" placeholder="Filtrar estado" value={filters.sigla_local || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="municipio_local_trabalho">Município</label><input id="municipio_local_trabalho" name="municipio_local_trabalho" type="text" placeholder="Filtrar município" value={filters.municipio_local_trabalho || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="des_grupo_contrato">Gestão Contrato</label><input id="des_grupo_contrato" name="des_grupo_contrato" type="text" placeholder="Filtrar gestão" value={filters.des_grupo_contrato || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="id_grupo_contrato">ID Gestão</label><input id="id_grupo_contrato" name="id_grupo_contrato" type="text" placeholder="Filtrar ID gestão" value={filters.id_grupo_contrato || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="convencao">Convenção</label><input id="convencao" name="convencao" type="text" placeholder="Filtrar convenção" value={filters.convencao || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="proximo_periodo_aquisitivo_texto">Próx. Período</label><input id="proximo_periodo_aquisitivo_texto" name="proximo_periodo_aquisitivo_texto" type="text" placeholder="Filtrar período" value={filters.proximo_periodo_aquisitivo_texto || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="faltas_injustificadas_periodo">Qtd. Faltas</label><input id="faltas_injustificadas_periodo" name="faltas_injustificadas_periodo" type="number" placeholder="Número de faltas" value={filters.faltas_injustificadas_periodo || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="dth_admissao">Data Admissão</label><input id="dth_admissao" name="dth_admissao" type="date" value={filters.dth_admissao || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="periodo_aquisitivo_atual_inicio">Início Período</label><input id="periodo_aquisitivo_atual_inicio" name="periodo_aquisitivo_atual_inicio" type="date" value={filters.periodo_aquisitivo_atual_inicio || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="periodo_aquisitivo_atual_fim">Fim Período</label><input id="periodo_aquisitivo_atual_fim" name="periodo_aquisitivo_atual_fim" type="date" value={filters.periodo_aquisitivo_atual_fim || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.formGroup}><label htmlFor="dth_limite_ferias">Data Limite Férias</label><input id="dth_limite_ferias" name="dth_limite_ferias" type="date" value={filters.dth_limite_ferias || ''} onChange={handleFilterChange} /></div>
                    <div className={styles.filterActions}><Button variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar Todos</Button></div>
                </div>
            )}
            
            {/* TABELA COM SCROLL INTERNO */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles.stickyColumn} ${styles.checkboxCell}`}>
                                <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} />
                            </th>
                            {columns.map(col => (
                                <th key={col.accessor} className={col.sticky ? styles.stickyColumn : ''}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={columns.length + 1} className={styles.loading}>Carregando funcionários...</td></tr>
                        ) : paginatedData.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className={styles.noData}>{funcionariosFiltrados.length === 0 && (searchTerm || Object.keys(filters).some(k => filters[k])) ? 'Nenhum funcionário encontrado com os filtros atuais.' : 'Nenhum funcionário cadastrado.'}</td></tr>
                        ) : (
                            paginatedData.map(row => {
                                const isSelected = selectedFuncionarios.includes(row.matricula);
                                return (
                                    <tr key={row.matricula} className={isSelected ? styles.selectedRow : ''}>
                                        <td className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={isSelected} onChange={(e) => handleSelectFuncionario(row.matricula, e.target.checked)} /></td>
                                        <td className={styles.stickyColumn}><ActionMenu items={getActionItems(row)} /></td>
                                        <td>{row.matricula}</td>
                                        <td><Link href={`/funcionarios/${row.matricula}`} className={styles.nomeLink}>{row.nome_funcionario}</Link></td>
                                        <td><StatusBadge status={row.status} /></td>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                            {row.saldo_dias_ferias < 30 && <AlertCircle size={14} color="#f59e0b" title="Direito a férias proporcionais" />}
                                            {row.saldo_dias_ferias}
                                        </td>
                                        <td className={styles.situacaoCell}>{row.situacao_ferias_afastamento_hoje || '---'}</td>
                                        <td>{formatDateForDisplay(row.dth_admissao)}</td>
                                        <td>{row.proximo_periodo_aquisitivo_texto || '---'}</td>
                                        <td>{formatDateForDisplay(row.periodo_aquisitivo_atual_inicio)}</td>
                                        <td>{formatDateForDisplay(row.periodo_aquisitivo_atual_fim)}</td>
                                        <td>
                                            <div className={styles.limiteCell}>
                                                <RiskIndicator dias={row.dth_limite_ferias ? Math.floor((new Date(row.dth_limite_ferias) - new Date()) / (1000 * 60 * 60 * 24)) : null} />
                                                <span>{formatDateForDisplay(row.dth_limite_ferias)}</span>
                                            </div>
                                        </td>
                                        <td>{formatDateForDisplay(row.ultima_data_planejada)}</td>
                                        <td>{row.faltas_injustificadas_periodo || 0}</td>
                                        <td>{row.categoria || '---'}</td>
                                        <td>{row.categoria_trab || '---'}</td>
                                        <td>{row.horario || '---'}</td>
                                        <td>{row.escala || '---'}</td>
                                        <td>{row.sigla_local || '---'}</td>
                                        <td>{row.des_grupo_contrato || '---'}</td>
                                        <td>{row.id_grupo_contrato || '---'}</td>
                                        <td className={styles.convencaoCell}>{row.convencao || '---'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* INFORMAÇÕES E PAGINAÇÃO */}
            {!isLoading && funcionariosFiltrados.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#6b7280' }}>
                    <div>
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, funcionariosFiltrados.length)} de {funcionariosFiltrados.length} funcionários
                        {selectedFuncionarios.length > 0 && (<span style={{ marginLeft: '1rem', fontWeight: '500' }}>• {selectedFuncionarios.length} selecionados</span>)}
                    </div>
                </div>
            )}

            {paginationInfo.totalPages > 1 && (<Pagination pagination={paginationInfo} onPageChange={setCurrentPage} />)}
            
            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={getModalTitle()} size={modalState.type === 'excluir' || modalState.type === 'bulkDelete' ? 'small' : 'large'}>
                {renderModalContent()}
            </Modal>
        </div>
    );
}

export default function FuncionariosPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', fontSize: '1.1rem', color: '#6b7280' }}>
                Carregando painel de funcionários...
            </div>
        }>
            <FuncionariosComponent />
        </Suspense>
    );
}