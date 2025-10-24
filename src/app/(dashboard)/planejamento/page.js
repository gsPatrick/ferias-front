// src/app/(dashboard)/planejamento/page.js
'use client'; 

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import Pagination from '@/components/Pagination/Pagination';
import styles from './planejamento.module.css';
import { CalendarClock, Search, Filter, Edit, Trash2, XCircle, PlusCircle, RefreshCw, Shuffle, Download } from 'lucide-react';

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

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
};

const StatusBadge = ({ status }) => {
    let statusClass = styles.statusPlanejada;
    if (status === 'Confirmada') statusClass = styles.statusConfirmada;
    if (status === 'Em Gozo') statusClass = styles.statusGozo;
    if (status === 'Cancelada') statusClass = styles.statusCancelada;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
};

// --- COMPONENTE PRINCIPAL ---

function PlanejamentoComponent() {
    const router = useRouter();

    const [allPlannedFerias, setAllPlannedFerias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedFerias, setSelectedFerias] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    const [filters, setFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({ gestoes: [], municipios: [], categorias: [], estados: [], escalas: [], clientes: [], contratos: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const itemsPerPage = 20;

    const fetchData = useCallback(async (year) => {
        setIsLoading(true);
        try {
            // CORREÇÃO: Busca os dados do planejamento E as opções de filtro em paralelo.
            const [feriasResponse, optionsResponse] = await Promise.all([
                api.ferias.getPlanejamentoAtivo({ ano: year, limit: 10000 }),
                api.funcionarios.getFilterOptions()
            ]);
            
            setAllPlannedFerias(feriasResponse.data.data || []);
            setFilterOptions(optionsResponse.data || {}); // Popula o estado com as opções de filtro
        } catch (error) {
            console.error("Falha ao buscar dados do planejamento:", error);
            setAllPlannedFerias([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(currentYear);
    }, [currentYear, fetchData]);

    const feriasFiltradas = useMemo(() => {
        if (!allPlannedFerias.length) return [];
        
        return allPlannedFerias.filter(feria => {
            const func = feria.Funcionario || {};
            const searchMatch = searchTerm.trim() === '' || 
                func.nome_funcionario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                String(func.matricula || '').toLowerCase().includes(searchTerm.toLowerCase());

            const filtersMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const itemValue = func[key];
                if (itemValue === null || itemValue === undefined) return false;
                return String(itemValue).toLowerCase().includes(value.toLowerCase());
            });

            return searchMatch && filtersMatch;
        });
    }, [allPlannedFerias, searchTerm, filters]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return feriasFiltradas.slice(startIndex, startIndex + itemsPerPage);
    }, [feriasFiltradas, currentPage]);

    const paginationInfo = {
        currentPage: currentPage, totalPages: Math.ceil(feriasFiltradas.length / itemsPerPage), totalItems: feriasFiltradas.length
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };
    
    const handleYearChange = (e) => {
        const newYear = e.target.value;
        setCurrentYear(newYear);
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
        if (document.getElementById('filter-form')) {
            document.getElementById('filter-form').reset();
        }
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        setSelectedFerias(checked ? paginatedData.map(f => f.id) : []);
    };

    const handleSelectFerias = (id, checked) => {
        setSelectedFerias(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
        if (!checked) setSelectAll(false);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportFilters = {
                ano: currentYear,
                q: searchTerm,
                ...filters
            };
            const response = await api.relatorios.exportarPlanejamento(exportFilters);
            downloadFile(response.data, `Planejamento_Ferias_${currentYear}.xlsx`);
        } catch (error) {
            console.error("Erro ao exportar planejamento:", error);
            alert(error.response?.data?.message || "Não foi possível gerar o relatório.");
        } finally {
            setIsExporting(false);
        }
    };

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });
    
    const handleBulkDelete = () => {
        if (selectedFerias.length > 0) openModal('bulkDelete', selectedFerias);
    };

    const handleRecalcular = () => openModal('recalcular');
    const handleRedistribuir = () => { if(selectedFerias.length > 0) openModal('redistribuir'); };

    const getActionItems = (ferias) => [
        { label: 'Editar Férias', icon: <Edit size={16}/>, onClick: () => openModal('editar', ferias) },
        { label: 'Excluir Férias', icon: <Trash2 size={16}/>, variant: 'danger', onClick: () => openModal('excluir', ferias) },
    ];

    const columns = [
        { header: 'Ações', accessor: 'acoes', sticky: true }, 
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Nome', accessor: 'Funcionario.nome_funcionario' }, 
        { header: 'Status Férias', accessor: 'status' },
        { header: 'Início Férias', accessor: 'data_inicio' },
        { header: 'Fim Férias', accessor: 'data_fim' },
        { header: 'Dias', accessor: 'qtd_dias' },
        { header: 'Categoria', accessor: 'Funcionario.categoria' }, 
        { header: 'Contrato', accessor: 'Funcionario.contrato' },
        { header: 'Gestão Contrato', accessor: 'Funcionario.des_grupo_contrato' },
        { header: 'Município', accessor: 'Funcionario.municipio_local_trabalho' },
        { header: 'Estado (UF)', accessor: 'Funcionario.sigla_local' },
        { header: 'Status Funcionário', accessor: 'Funcionario.status' },
        { header: 'Substituição?', accessor: 'necessidade_substituicao' }
    ];

    const getModalTitle = () => {
        switch (modalState.type) {
            case 'criar': return 'Planejar Novas Férias';
            case 'editar': return `Editar Férias de ${modalState.data?.Funcionario.nome_funcionario}`;
            case 'excluir': return 'Excluir Férias';
            case 'bulkDelete': return 'Excluir Férias Selecionadas';
            case 'recalcular': return 'Confirmar Recálculo do Planejamento';
            case 'redistribuir': return 'Redistribuir Férias Selecionadas';
            default: return 'Modal';
        }
    };
    
   const renderModalContent = () => {
        const refreshData = () => fetchData(currentYear);
        switch (modalState.type) {
            case 'criar':
            case 'editar':
                const isEditing = modalState.type === 'editar';
                const handleSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.ano_planejamento = currentYear;
                    data.necessidade_substituicao = e.target.necessidade_substituicao.checked;
                    try {
                        if (isEditing) {
                            await api.ferias.update(modalState.data.id, data);
                            alert('Férias atualizadas com sucesso!');
                        } else {
                            await api.ferias.create(data.matricula_funcionario, data);
                             alert('Férias criadas com sucesso!');
                        }
                        closeModal();
                        refreshData();
                    } catch (error) { 
                        console.error("Erro ao salvar férias:", error);
                        alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} férias: ` + (error.response?.data?.message || 'Verifique os dados e tente novamente.')); 
                    }
                };
                return (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Matrícula do Funcionário</label>
                                <input name="matricula_funcionario" type="text" defaultValue={modalState.data?.Funcionario.matricula || ''} required disabled={isEditing} placeholder="Digite a matrícula"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input name="data_inicio" type="date" defaultValue={formatDateForInput(modalState.data?.data_inicio)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Quantidade de Dias</label>
                                <input name="qtd_dias" type="number" defaultValue={modalState.data?.qtd_dias || 30} required min="5" max="30" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select name="status" defaultValue={modalState.data?.status || 'Planejada'}>
                                    <option value="Planejada">Planejada</option>
                                    <option value="Confirmada">Confirmada</option>
                                    <option value="Em Gozo">Em Gozo</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                                <label>Observações</label>
                                <textarea name="observacao" rows="3" defaultValue={modalState.data?.observacao || ''}></textarea>
                            </div>
                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                                <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input name="necessidade_substituicao" type="checkbox" defaultChecked={modalState.data?.necessidade_substituicao === undefined ? true : modalState.data.necessidade_substituicao} /> 
                                    Necessita de Substituição?
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                );
            case 'excluir':
                const handleConfirmDelete = async () => {
                    try {
                        await api.ferias.remove(modalState.data.id);
                        alert('Férias excluídas com sucesso!');
                        closeModal();
                        refreshData();
                    } catch (error) { alert('Erro ao excluir férias.'); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir as férias de <strong>{modalState.data?.Funcionario.nome_funcionario}</strong>?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="danger" onClick={handleConfirmDelete}>Excluir</Button></div>
                    </div>
                );
            case 'bulkDelete':
                const handleConfirmBulkDelete = async () => {
                    try {
                        await api.ferias.bulkRemove(selectedFerias);
                        alert('Férias selecionadas foram excluídas com sucesso!');
                        closeModal();
                        setSelectedFerias([]);
                        refreshData();
                    } catch (error) { alert('Erro ao excluir férias selecionadas.'); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir <strong>{selectedFerias.length}</strong> registros de férias selecionados?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="danger" onClick={handleConfirmBulkDelete}>Excluir Selecionados</Button></div>
                    </div>
                );
            case 'recalcular':
                const handleConfirmRecalcular = async () => {
                    try {
                        await api.ferias.distribuir({ ano: currentYear, descricao: `Recálculo manual do planejamento de ${currentYear}` });
                        alert(`Planejamento para ${currentYear} recalculado com sucesso! A página será atualizada.`);
                        closeModal();
                        refreshData();
                    } catch (error) { alert(`Erro ao recalcular planejamento.`); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Deseja recalcular o planejamento de férias para o ano de <strong>{currentYear}</strong>?</p>
                        <p style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem'}}>Atenção: O planejamento ativo atual será arquivado e um novo será gerado. Alterações manuais serão preservadas.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="primary" onClick={handleConfirmRecalcular}>Sim, Recalcular</Button></div>
                    </div>
                );
            case 'redistribuir':
                const handleConfirmRedistribute = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());

                    const matriculasSelecionadas = allPlannedFerias
                        .filter(f => selectedFerias.includes(f.id))
                        .map(f => f.Funcionario.matricula);
                    
                    const payload = {
                        ...data,
                        matriculas: [...new Set(matriculasSelecionadas)]
                    };

                    try {
                        await api.ferias.redistribuirSelecionadas(payload);
                        alert('Férias selecionadas foram redistribuídas com sucesso!');
                        closeModal();
                        setSelectedFerias([]);
                        refreshData();
                    } catch (error) {
                        alert(error.response?.data?.message || 'Erro ao redistribuir férias.');
                    }
                };
                return (
                    <form onSubmit={handleConfirmRedistribute}>
                        <p style={{marginBottom: '1.5rem', lineHeight: '1.6'}}>Você está redistribuindo as férias para <strong>{selectedFerias.length}</strong> funcionários selecionados. Defina o novo período para a alocação automática.</p>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}><label>Distribuir a partir de:</label><input name="dataInicio" type="date" required /></div>
                            <div className={styles.formGroup}><label>Até a data de (opcional):</label><input name="dataFim" type="date" /></div>
                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}><label>Observação</label><textarea name="descricao" rows="3" placeholder="Ex: Redistribuição para o cliente FMS"></textarea></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}><Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button><Button type="submit">Confirmar Redistribuição</Button></div>
                    </form>
                );
            default: return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <CalendarClock size={32} />
                    <h1>Planejamento de Férias</h1>
                    <select className={styles.yearSelector} value={currentYear} onChange={handleYearChange}>
                        <option>2026</option><option>2025</option><option>2024</option><option>2023</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setShowFilters(p => !p)}>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</Button>
                    <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport} disabled={isExporting}>{isExporting ? 'Exportando...' : 'Exportar'}</Button>
                    <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={handleRecalcular}>Recalcular Ano</Button>
                    {selectedFerias.length > 0 && (<Button variant="secondary" icon={<Shuffle size={16}/>} onClick={handleRedistribuir}>Redistribuir ({selectedFerias.length})</Button>)}
                    {selectedFerias.length > 0 && (<Button variant="danger" icon={<Trash2 size={16} />} onClick={handleBulkDelete}>Excluir ({selectedFerias.length})</Button>)}
                    <Button icon={<PlusCircle size={16} />} onClick={() => openModal('criar')}>Planejar Férias</Button>
                </div>
            </div>

            {showFilters && (
                <form id="filter-form" className={styles.filterGrid}>
                    <div className={`${styles.formGroup} ${styles.searchGroup}`} style={{ gridColumn: '1 / span 2' }}><label htmlFor="q">Busca Rápida</label><div className={styles.inputIconWrapper}><Search size={18} className={styles.inputIcon} /><input id="q" name="q" type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange} /></div></div>
                    <div className={styles.formGroup}><label>Município</label><select name="municipio_local_trabalho" value={filters.municipio_local_trabalho || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.municipios?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Gestão Contrato</label><select name="des_grupo_contrato" value={filters.des_grupo_contrato || ''} onChange={handleFilterChange}><option value="">Todas</option>{filterOptions.gestoes?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Categoria/Cargo</label><select name="categoria" value={filters.categoria || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.categorias?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Estado (UF)</label><select name="sigla_local" value={filters.sigla_local || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.estados?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Escala</label><select name="escala" value={filters.escala || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.escalas?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Cliente</label><select name="cliente" value={filters.cliente || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.clientes?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.formGroup}><label>Contrato</label><select name="contrato" value={filters.contrato || ''} onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.contratos?.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className={styles.filterActions}><Button type="button" variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar Filtros</Button></div>
                </form>
            )}
            
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} /></th>{columns.map(col => (<th key={col.accessor} className={col.sticky ? styles.stickyColumn : ''}>{col.header}</th>))}</tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={columns.length + 1} className={styles.loading}>Carregando planejamento...</td></tr>) 
                        : paginatedData.length === 0 ? (<tr><td colSpan={columns.length + 1} className={styles.noData}>Nenhum registro de férias encontrado para os filtros aplicados.</td></tr>) 
                        : (paginatedData.map(row => {
                                const isSelected = selectedFerias.includes(row.id);
                                return (
                                    <tr key={row.id} className={isSelected ? styles.selectedRow : ''}>
                                        <td className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={isSelected} onChange={(e) => handleSelectFerias(row.id, e.target.checked)} /></td>
                                        <td className={styles.stickyColumn}><ActionMenu items={getActionItems(row)} /></td>
                                        <td>{row.Funcionario.matricula}</td>
                                        <td><Link href={`/funcionarios/${row.Funcionario.matricula}`} className={styles.nomeLink}>{row.Funcionario.nome_funcionario}</Link></td>
                                        <td><StatusBadge status={row.status} /></td>
                                        <td>{formatDateForDisplay(row.data_inicio)}</td>
                                        <td>{formatDateForDisplay(row.data_fim)}</td>
                                        <td>{row.qtd_dias}</td>
                                        <td>{row.Funcionario.categoria || '---'}</td>
                                        <td>{row.Funcionario.contrato || '---'}</td>
                                        <td>{row.Funcionario.des_grupo_contrato || '---'}</td>
                                        <td>{row.Funcionario.municipio_local_trabalho || '---'}</td>
                                        <td>{row.Funcionario.sigla_local || '---'}</td>
                                        <td><StatusBadge status={row.Funcionario.status} /></td>
                                        <td>{row.necessidade_substituicao ? 'Sim' : 'Não'}</td>
                                    </tr>
                                );
                            }))}
                    </tbody>
                </table>
            </div>

            {paginationInfo && paginationInfo.totalPages > 1 && (<Pagination pagination={paginationInfo} onPageChange={setCurrentPage} />)}
            
            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={getModalTitle()}>{renderModalContent()}</Modal>
        </div>
    );
}

export default function PlanejamentoPage() {
    return (
        <Suspense fallback={<div>Carregando painel de planejamento...</div>}>
            <PlanejamentoComponent />
        </Suspense>
    );
}