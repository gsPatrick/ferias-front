'use client'; 

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api'; // Assumindo que este serviço de API está configurado
import Table from '@/components/Table/Table'; // Seu componente de tabela inteligente
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import FilterPanel from '@/components/FilterPanel/FilterPanel'; 
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import Pagination from '@/components/Pagination/Pagination';
import styles from './funcionarios.module.css';
import { User, Search, Filter, UserPlus, Trash2, CalendarPlus, FileWarning, Download, XCircle } from 'lucide-react';

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
}

const RiskIndicator = ({ dias }) => {
    if (dias === null || dias === undefined) return null;
    let riskLevel = styles.low;
    let title = "Prazo confortável";
    if (dias <= 60 && dias > 30) { riskLevel = styles.medium; title = `Vence em ${dias} dias`; }
    if (dias <= 30 && dias >= 0) { riskLevel = styles.high; title = `Vence em ${dias} dias! ALTO RISCO!`; }
    if (dias < 0) { riskLevel = styles.expired; title = `Vencido há ${Math.abs(dias)} dias!`; }
    return <div className={`${styles.riskIndicator} ${riskLevel}`} title={title}></div>;
}

// Função auxiliar para formatar datas para exibição
const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// --- COMPONENTE PRINCIPAL ---

function FuncionariosComponent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [funcionarios, setFuncionarios] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedFuncionarios, setSelectedFuncionarios] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});

    // Efeito para sincronizar searchTerm e activeFilters com a URL
    const fetchFuncionarios = useCallback(async (currentSearchParams) => {
        setIsLoading(true);
        setSelectedFuncionarios([]); // Limpa a seleção ao buscar novos dados
        try {
            const params = Object.fromEntries(currentSearchParams.entries());
            const response = await api.funcionarios.getAll(params);
            setFuncionarios(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Falha ao buscar funcionários:", error);
            alert('Não foi possível carregar os dados dos funcionários.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const termFromUrl = searchParams.get('q') || '';
        setSearchTerm(termFromUrl);

        const currentFilters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && key !== 'limit' && key !== 'q') {
                currentFilters[key] = value;
            }
        }
        setActiveFilters(currentFilters);
        
        fetchFuncionarios(searchParams);
    }, [searchParams, fetchFuncionarios]);


    // Lida com a mudança no input de busca
    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (term) {
            current.set('q', term);
        } else {
            current.delete('q');
        }
        current.set('page', '1');
        router.push(`${pathname}?${current.toString()}`);
    };

    // Lida com a aplicação de filtros do FilterPanel
    const handleApplyFilters = (newAppliedFilters) => {
        const current = new URLSearchParams();
        
        const currentSearchTerm = searchParams.get('q');
        if (currentSearchTerm) {
            current.set('q', currentSearchTerm);
        }

        current.set('page', '1');

        Object.entries(newAppliedFilters).forEach(([key, value]) => {
            if (value && value !== '') {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });

        router.push(`${pathname}?${current.toString()}`);
        setIsFilterOpen(false);
    };

    // Lida com a mudança de página da paginação
    const handlePageChange = (page) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('page', String(page));
        router.push(`${pathname}?${current.toString()}`);
    };

    // Limpa todos os filtros e o termo de busca
    const clearAllFilters = () => {
        router.push(pathname);
        setSearchTerm('');
        setActiveFilters({});
    };
    
    // Exportação de dados
    const handleExport = async (type) => {
        setIsExporting(true);
        try {
            const matriculasParaExportar = (type === 'selected' && selectedFuncionarios.length > 0)
                ? selectedFuncionarios.map(f => f.matricula)
                : [];
            
            const paramsToExport = Object.fromEntries(searchParams.entries());

            const response = await api.relatorios.exportarFuncionarios(paramsToExport, matriculasParaExportar);
            downloadFile(response.data, 'Relatorio_Funcionarios.xlsx');
        } catch (error) {
            console.error("Erro ao exportar funcionários:", error);
            alert(error.response?.data?.message || "Não foi possível gerar a exportação.");
        } finally {
            setIsExporting(false);
        }
    };

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });
    
    const handleCreateFuncionario = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await api.funcionarios.create(data);
            closeModal();
            fetchFuncionarios(searchParams);
            alert('Funcionário criado com sucesso!');
        } catch(error) {
            console.error("Falha ao criar funcionário:", error);
            alert(error.response?.data?.message || "Erro ao criar funcionário.");
        }
    };
    
    const handleDeleteFuncionario = async () => {
        if (!modalState.data?.matricula) return;
        try {
            await api.funcionarios.remove(modalState.data.matricula);
            closeModal();
            fetchFuncionarios(searchParams);
            alert('Funcionário excluído com sucesso!');
        } catch (error) {
            console.error("Falha ao excluir funcionário:", error);
            alert(error.response?.data?.message || "Erro ao excluir funcionário.");
        }
    };
    
    const handleLancarFerias = async (event) => {
        event.preventDefault();
        if (!modalState.data?.matricula) return;
        const formData = new FormData(event.target);
        const data = { ...Object.fromEntries(formData.entries()), matricula: modalState.data.matricula };
        try {
            await api.ferias.lancar(data); // Assumindo api.ferias.lancar(data)
            closeModal();
            fetchFuncionarios(searchParams);
            alert('Férias lançadas com sucesso!');
        } catch(error) {
            console.error("Falha ao lançar férias:", error);
            alert(error.response?.data?.message || "Erro ao lançar férias.");
        }
    };
    
    const handleLancarAfastamento = async (event) => {
        event.preventDefault();
        if (!modalState.data?.matricula) return;
        const formData = new FormData(event.target);
        const data = { ...Object.fromEntries(formData.entries()), matricula: modalState.data.matricula };
        try {
            await api.afastamentos.lancar(data); // Assumindo api.afastamentos.lancar(data)
            closeModal();
            fetchFuncionarios(searchParams);
            alert('Afastamento lançado com sucesso!');
        } catch(error) {
            console.error("Falha ao lançar afastamento:", error);
            alert(error.response?.data?.message || "Erro ao lançar afastamento.");
        }
    };

    const getActionItems = (funcionario) => [
        { label: 'Ver / Editar Perfil', icon: <User size={16}/>, onClick: () => router.push(`/funcionarios/${funcionario.matricula}`) },
        { label: 'Lançar Férias', icon: <CalendarPlus size={16}/>, onClick: () => openModal('lancarFerias', funcionario) },
        { label: 'Lançar Afastamento', icon: <FileWarning size={16}/>, onClick: () => openModal('lancarAfastamento', funcionario) },
        { label: 'Excluir Funcionário', icon: <Trash2 size={16}/>, variant: 'danger', onClick: () => openModal('excluir', funcionario) },
    ];
    
    const columns = [
        { header: 'Nome', accessor: 'nome_funcionario', cell: (row) => <Link href={`/funcionarios/${row.matricula}`} className={styles.nomeLink}>{row.nome_funcionario}</Link> },
        { header: 'Matrícula', accessor: 'matricula' },
        { header: 'Período Aquisitivo', accessor: 'periodo_aquisitivo_atual_inicio', cell: (row) => `${formatDateForDisplay(row.periodo_aquisitivo_atual_inicio)} - ${formatDateForDisplay(row.periodo_aquisitivo_atual_fim)}` },
        { header: 'Saldo Dias', accessor: 'saldo_dias_ferias', cell: (row) => <div className={styles.saldoCell}>{row.saldo_dias_ferias}</div> },
        { header: 'Limite Férias', accessor: 'dth_limite_ferias', cell: (row) => (
            <div className={styles.limiteCell}>
                <RiskIndicator dias={Math.floor((new Date(row.dth_limite_ferias) - new Date()) / (1000 * 60 * 60 * 24))} />
                <span>{formatDateForDisplay(row.dth_limite_ferias)}</span>
            </div>
        )},
        { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
        { header: 'Ações', accessor: 'acoes', cell: (row) => <ActionMenu items={getActionItems(row)} /> },
    ];

    const hasActiveFiltersOrSearch = searchTerm || Object.keys(activeFilters).length > 0;

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.searchContainer}>
                        <Search size={20} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou matrícula..." 
                            className={styles.searchInput} 
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className={styles.actions}>
                        <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setIsFilterOpen(true)}>Filtros</Button>
                        <Button icon={<UserPlus size={16} />} onClick={() => openModal('adicionar')}>Adicionar</Button>
                    </div>
                </div>

                {hasActiveFiltersOrSearch && (
                    <div className={styles.activeFiltersAndClear}>
                        <div className={styles.activeFiltersContainer}>
                            {searchTerm && (
                                <div className={styles.filterPill}>
                                    <span>Busca: <strong>"{searchTerm}"</strong></span>
                                    <button onClick={() => { setSearchTerm(''); clearAllFilters(); }} className={styles.clearFilterButton} title="Limpar Busca"><XCircle size={18}/></button>
                                </div>
                            )}
                            {Object.entries(activeFilters).map(([key, value]) => {
                                if (value) {
                                    const displayKey = {
                                        status: 'Status', dth_admissao_inicio: 'Admissão (Início)', dth_admissao_fim: 'Admissão (Fim)',
                                        salario_base_min: 'Salário (Min)', salario_base_max: 'Salário (Max)', contrato_tipo: 'Contrato',
                                        categoria_trabalhador: 'Categoria Trab.', horario_tipo: 'Horário', dias_para_vencer: 'Vence em',
                                        dth_limite_ferias_inicio: 'Limite Férias (Início)', dth_limite_ferias_fim: 'Limite Férias (Fim)',
                                        saldo_dias_ferias_min: 'Saldo Férias (Min)', saldo_dias_ferias_max: 'Saldo Férias (Max)',
                                        ultima_ferias_inicio: 'Últ. Férias (Início)', ultima_ferias_fim: 'Últ. Férias (Fim)',
                                        periodo_aquisitivo_inicio: 'Per. Aquis. (Início)', periodo_aquisitivo_fim: 'Per. Aquis. (Fim)',
                                        municipio_local_trabalho: 'Município', razao_social_filial: 'Filial', codigo_filial: 'Cód. Filial',
                                        local_de_trabalho_descricao: 'Local Trab.', categoria_cargo: 'Cargo', convencao: 'Convenção',
                                    }[key] || key;
                                    
                                    const displayValue = key.startsWith('dth_') || key.includes('ferias_') || key.includes('aquisitivo_')
                                        ? formatDateForDisplay(value) : value;

                                    return (
                                        <div key={key} className={styles.filterPill}>
                                            <span>{displayKey}: <strong>{displayValue}</strong></span>
                                            <button onClick={() => { const newFilters = { ...activeFilters }; delete newFilters[key]; handleApplyFilters(newFilters);}} className={styles.clearFilterButton} title={`Remover filtro de ${displayKey}`}>
                                                <XCircle size={18}/>
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        <Button variant="secondary" onClick={clearAllFilters} icon={<XCircle size={16} />} className={styles.clearAllFiltersButton}>
                            Limpar Todos os Filtros
                        </Button>
                    </div>
                )}
                
                {selectedFuncionarios.length > 0 && (
                    <div className={styles.bulkActionsPanel}>
                        <span>{selectedFuncionarios.length} funcionário(s) selecionado(s)</span>
                        <Button variant="secondary" icon={<Download size={16} />} onClick={() => handleExport('selected')} disabled={isExporting}>
                            {isExporting ? 'Exportando...' : 'Exportar Seleção'}
                        </Button>
                    </div>
                )}
                
                <div className={styles.tableSummaryAndExport}>
                    <span className={styles.summaryText}>Exibindo {funcionarios.length} de {pagination?.totalItems || 0} registros</span>
                    <Button variant="secondary" icon={<Download size={16} />} onClick={() => handleExport('all')} disabled={isExporting}>
                        {isExporting ? 'Exportando...' : 'Exportar Visão Atual'}
                    </Button>
                </div>

                {/* --- ÁREA DE RENDERIZAÇÃO ÚNICA --- */}
                {/* O componente Table vai renderizar a tabela no desktop e os cards no mobile automaticamente */}
                <div className={styles.tableWrapper}>
                    <Table 
                        columns={columns} 
                        data={funcionarios} 
                        isLoading={isLoading} 
                        isSelectable={true} 
                        onSelectionChange={setSelectedFuncionarios} 
                    />
                </div>
                
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
            
            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={handleApplyFilters} initialFilters={activeFilters}/>
            
            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={
                modalState.type === 'adicionar' ? 'Adicionar Novo Funcionário' :
                modalState.type === 'lancarFerias' ? `Lançar Férias para ${modalState.data?.nome_funcionario}` :
                modalState.type === 'lancarAfastamento' ? `Lançar Afastamento para ${modalState.data?.nome_funcionario}` :
                `Confirmar Exclusão`
            }>
                {modalState.type === 'adicionar' && (
                    <form className={styles.modalContent} onSubmit={handleCreateFuncionario}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}><label>Matrícula</label><input name="matricula" required type="text" /></div>
                            <div className={styles.formGroup}><label>Nome Completo</label><input name="nome_funcionario" required type="text" /></div>
                            <div className={styles.formGroup}><label>Data de Admissão</label><input name="dth_admissao" required type="date" /></div>
                            <div className={styles.formGroup}><label>Município</label><input name="municipio_local_trabalho" required type="text" /></div>
                            <div className={styles.formGroup}><label>Salário Base</label><input name="salario_base" type="number" step="0.01" /></div>
                            <div className={styles.formGroup}><label>Status</label><select name="status" defaultValue="Ativo"><option>Ativo</option><option>Inativo</option></select></div>
                            <div className={styles.formGroup}><label>Tipo de Contrato</label><input name="contrato_tipo" type="text" /></div>
                            <div className={styles.formGroup}><label>Categoria do Trabalhador</label><input name="categoria_trabalhador" type="text" /></div>
                            <div className={styles.formGroup}><label>Horário</label><input name="horario_tipo" type="text" /></div>
                            <div className={styles.formGroup}><label>Razão Social Filial</label><input name="razao_social_filial" type="text" /></div>
                            <div className={styles.formGroup}><label>Código Filial</label><input name="codigo_filial" type="text" /></div>
                            <div className={styles.formGroup}><label>Local de Trabalho (Descrição)</label><input name="local_de_trabalho_descricao" type="text" /></div>
                            <div className={styles.formGroup}><label>Categoria/Cargo</label><input name="categoria_cargo" type="text" /></div>
                            <div className={styles.formGroup}><label>Convenção Coletiva</label><input name="convencao" type="text" /></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                )}
                {modalState.type === 'lancarFerias' && (
                    <form className={styles.modalContent} onSubmit={handleLancarFerias}>
                        <p>Lançando férias para <strong>{modalState.data?.nome_funcionario}</strong>.</p>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}><label>Data de Início</label><input name="data_inicio" type="date" required/></div>
                            <div className={styles.formGroup}><label>Dias de Férias</label><input name="qtd_dias" type="number" defaultValue="30" required/></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar</Button>
                        </div>
                    </form>
                )}
                 {modalState.type === 'lancarAfastamento' && (
                    <form className={styles.modalContent} onSubmit={handleLancarAfastamento}>
                        <p>Você está prestes a lançar um afastamento para <strong>{modalState.data?.nome_funcionario}</strong>.</p>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}><label htmlFor="motivo_afastamento">Motivo</label><input id="motivo_afastamento" name="motivo" type="text" required /></div>
                            <div className={styles.formGroup}><label htmlFor="data_inicio_afastamento">Data de Início</label><input id="data_inicio_afastamento" name="data_inicio" type="date" required /></div>
                            <div className={styles.formGroup}><label htmlFor="data_fim_afastamento">Data de Fim (Opcional)</label><input id="data_fim_afastamento" name="data_fim" type="date" /></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar Afastamento</Button>
                        </div>
                    </form>
                )}
                {modalState.type === 'excluir' && (
                    <div className={styles.modalContent}>
                        <p>Tem certeza que deseja excluir o funcionário <strong>{modalState.data?.nome_funcionario}</strong> (matrícula: {modalState.data?.matricula})?</p>
                        <p>Esta ação não poderá ser desfeita.</p>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDeleteFuncionario}>Confirmar Exclusão</Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* 
              REMOVIDO: O bloco de código que estava aqui foi removido.
              Ele criava um layout de cards manualmente, o que causava a duplicação.
              O componente <Table /> já cuida da exibição correta tanto no desktop quanto no mobile.
            */}
        </>
    );
}

// O Suspense é importante para o Next.js App Router lidar com hooks como useSearchParams
export default function FuncionariosPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <FuncionariosComponent />
        </Suspense>
    );
}