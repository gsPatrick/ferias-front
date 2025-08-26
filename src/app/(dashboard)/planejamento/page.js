// src/app/(dashboard)/planejamento/page.js
'use client'; 

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import Pagination from '@/components/Pagination/Pagination';
import styles from './planejamento.module.css';
import { CalendarClock, Search, Filter, Edit, Trash2, XCircle, PlusCircle, RefreshCw, Shuffle } from 'lucide-react';

// --- HELPERS E COMPONENTES INTERNOS ---

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
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
};

// --- COMPONENTE PRINCIPAL ---

function PlanejamentoComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [plannedFerias, setPlannedFerias] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedFerias, setSelectedFerias] = useState([]); // Armazena os IDs das férias selecionadas
    const [selectAll, setSelectAll] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const fetchPlannedFerias = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const response = await api.ferias.getPlanejamentoAtivo(params); 
            setPlannedFerias(response.data.data || []);
            setPaginationInfo(response.data.pagination);
            // Limpa a seleção sempre que os dados são recarregados
            setSelectedFerias([]);
            setSelectAll(false);
        } catch (error) {
            console.error("Falha ao buscar planejamento:", error);
            setPlannedFerias([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const year = parseInt(currentParams.ano, 10) || new Date().getFullYear();
        setCurrentYear(year);
        fetchPlannedFerias({ ...currentParams, ano: year });
        
        const urlFilters = { ...currentParams };
        delete urlFilters.page; delete urlFilters.limit; delete urlFilters.ano;
        setSearchTerm(urlFilters.q || '');
        delete urlFilters.q;
        setFilters(urlFilters);
    }, [searchParams, fetchPlannedFerias]);

    const updateUrlParams = (newParams) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) current.set(key, value);
            else current.delete(key);
        });
        current.set('page', '1');
        router.push(`${pathname}?${current.toString()}`);
    };
    
    const handleFilterChange = (name, value) => {
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        updateUrlParams({ ...newFilters, q: searchTerm, ano: currentYear });
    };

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        updateUrlParams({ ...filters, q: newSearchTerm, ano: currentYear });
    };
    
    const handleYearChange = (e) => {
        const newYear = e.target.value;
        setCurrentYear(newYear);
        updateUrlParams({ ...filters, q: searchTerm, ano: newYear });
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        updateUrlParams({ ano: currentYear });
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        setSelectedFerias(checked ? plannedFerias.map(f => f.id) : []);
    };

    const handleSelectFerias = (id, checked) => {
        setSelectedFerias(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
        if (!checked) setSelectAll(false);
    };

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });
    
    const handleBulkDelete = () => {
        if (selectedFerias.length > 0) openModal('bulkDelete', selectedFerias);
    };

    const handleRecalcular = () => {
        openModal('recalcular');
    };

    const handleRedistribuir = () => {
        if(selectedFerias.length > 0) openModal('redistribuir');
    };

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
        { header: 'Categoria/Cargo', accessor: 'Funcionario.categoria' }, 
        { header: 'Gestão Contrato', accessor: 'Funcionario.des_grupo_contrato' },
        { header: 'Município', accessor: 'Funcionario.municipio_local_trabalho' },
        { header: 'Status Funcionário', accessor: 'Funcionario.status' },
    ];

    const renderModalContent = () => {
        const refreshData = () => fetchPlannedFerias(Object.fromEntries(searchParams.entries()));
        switch (modalState.type) {
            case 'criar':
            case 'editar':
                const isEditing = modalState.type === 'editar';
                const handleSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.ano_planejamento = currentYear;
                    try {
                        if (isEditing) {
                            await api.ferias.update(modalState.data.id, data);
                        } else {
                            // Para criar, a matrícula vem do funcionário
                            data.matricula_funcionario = data.matricula_funcionario; 
                            await api.ferias.create(data.matricula_funcionario, data);
                        }
                        closeModal();
                        refreshData();
                    } catch (error) { 
                        alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} férias: ${error.response?.data?.message || error.message}`); 
                    }
                };
                return (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}><label>Matrícula do Funcionário</label><input name="matricula_funcionario" type="text" defaultValue={modalState.data?.Funcionario?.matricula || ''} required disabled={isEditing} /></div>
                            <div className={styles.formGroup}><label>Data de Início</label><input name="data_inicio" type="date" defaultValue={formatDateForInput(modalState.data?.data_inicio)} required /></div>
                            <div className={styles.formGroup}><label>Quantidade de Dias</label><input name="qtd_dias" type="number" defaultValue={modalState.data?.qtd_dias || 30} required min="5" max="30" /></div>
                            <div className={styles.formGroup}><label>Status</label><select name="status" defaultValue={modalState.data?.status || 'Planejada'}><option>Planejada</option><option>Confirmada</option><option>Em Gozo</option></select></div>
                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}><label>Observações</label><textarea name="observacao" rows="3" defaultValue={modalState.data?.observacao || ''}></textarea></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}><Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button><Button type="submit">Salvar</Button></div>
                    </form>
                );
            case 'excluir':
                const handleConfirmDelete = async () => {
                    try {
                        await api.ferias.remove(modalState.data.id);
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
                    } catch (error) { alert(`Erro ao recalcular planejamento: ${error.response?.data?.message || error.message}`); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Deseja recalcular o planejamento de férias para o ano de <strong>{currentYear}</strong>?</p>
                        <p style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem'}}>Atenção: O planejamento ativo atual será arquivado e um novo será gerado. Alterações manuais serão perdidas.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="primary" onClick={handleConfirmRecalcular}>Sim, Recalcular</Button></div>
                    </div>
                );
            case 'redistribuir':
                const handleConfirmRedistribute = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());

                    const matriculasSelecionadas = plannedFerias
                        .filter(f => selectedFerias.includes(f.id))
                        .map(f => f.Funcionario.matricula);
                    
                    const payload = {
                        ...data,
                        matriculas: [...new Set(matriculasSelecionadas)] // Garante matrículas únicas
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
                        <p style={{marginBottom: '1.5rem', lineHeight: '1.6'}}>
                            Você está redistribuindo as férias para <strong>{selectedFerias.length}</strong> funcionários selecionados. 
                            Defina o novo período para a alocação automática.
                        </p>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Distribuir a partir de:</label>
                                <input name="dataInicio" type="date" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Até a data de (opcional):</label>
                                <input name="dataFim" type="date" />
                            </div>
                            <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                                <label>Observação</label>
                                <textarea name="descricao" rows="3" placeholder="Ex: Redistribuição para o cliente FMS"></textarea>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Confirmar Redistribuição</Button>
                        </div>
                    </form>
                );
            default: return null;
        }
    };
    
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <CalendarClock size={32} />
                    <h1>Planejamento de Férias</h1>
                    <select className={styles.yearSelector} value={currentYear} onChange={handleYearChange}>
                        <option>2025</option><option>2024</option><option>2023</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setShowFilters(p => !p)}>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</Button>
                    <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={handleRecalcular}>Recalcular Ano</Button>
                    {selectedFerias.length > 0 && (<Button variant="secondary" icon={<Shuffle size={16}/>} onClick={handleRedistribuir}>Redistribuir ({selectedFerias.length})</Button>)}
                    {selectedFerias.length > 0 && (<Button variant="danger" icon={<Trash2 size={16} />} onClick={handleBulkDelete}>Excluir ({selectedFerias.length})</Button>)}
                    <Button icon={<PlusCircle size={16} />} onClick={() => openModal('criar')}>Planejar Férias</Button>
                </div>
            </div>

            {showFilters && (
                <div className={styles.filterGrid}>
                    <div className={`${styles.formGroup} ${styles.searchGroup}`}><label htmlFor="q">Busca Rápida</label><div className={styles.inputIconWrapper}><Search size={18} className={styles.inputIcon} /><input id="q" name="q" type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange} /></div></div>
                    <div className={styles.formGroup}><label htmlFor="status">Status Funcionário</label><select id="status" name="status" value={filters.status || ''} onChange={e => handleFilterChange('status', e.target.value)}><option value="">Todos</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
                    <div className={styles.formGroup}><label htmlFor="categoria">Categoria/Cargo</label><input id="categoria" name="categoria" type="text" placeholder="Filtrar por cargo" value={filters.categoria || ''} onChange={e => handleFilterChange('categoria', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="des_grupo_contrato">Gestão Contrato</label><input id="des_grupo_contrato" name="des_grupo_contrato" type="text" placeholder="Filtrar gestão" value={filters.des_grupo_contrato || ''} onChange={e => handleFilterChange('des_grupo_contrato', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="municipio_local_trabalho">Município</label><input id="municipio_local_trabalho" name="municipio_local_trabalho" type="text" placeholder="Filtrar município" value={filters.municipio_local_trabalho || ''} onChange={e => handleFilterChange('municipio_local_trabalho', e.target.value)} /></div>
                    
                    <div className={styles.formGroup}><label htmlFor="status_ferias">Status das Férias</label><select id="status_ferias" name="status_ferias" value={filters.status_ferias || ''} onChange={e => handleFilterChange('status_ferias', e.target.value)}><option value="">Todos</option><option>Planejada</option><option>Confirmada</option><option>Em Gozo</option></select></div>
                    <div className={styles.formGroup}><label htmlFor="ferias_inicio_de">Início Férias (de)</label><input id="ferias_inicio_de" name="ferias_inicio_de" type="date" value={filters.ferias_inicio_de || ''} onChange={e => handleFilterChange('ferias_inicio_de', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="ferias_inicio_ate">Início Férias (até)</label><input id="ferias_inicio_ate" name="ferias_inicio_ate" type="date" value={filters.ferias_inicio_ate || ''} onChange={e => handleFilterChange('ferias_inicio_ate', e.target.value)} /></div>
                    <div className={styles.filterActions}><Button variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar Filtros</Button></div>
                </div>
            )}
            
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} /></th>{columns.map(col => (<th key={col.accessor} className={col.sticky ? styles.stickyColumn : ''}>{col.header}</th>))}</tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={columns.length + 1} className={styles.loading}>Carregando...</td></tr>) 
                        : plannedFerias.length === 0 ? (<tr><td colSpan={columns.length + 1} className={styles.noData}>Nenhum registro de férias encontrado para o planejamento ativo deste ano.</td></tr>) 
                        : (plannedFerias.map(row => {
                                const isSelected = selectedFerias.includes(row.id);
                                return (
                                    <tr key={row.id} className={isSelected ? styles.selectedRow : ''}>
                                        <td className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={isSelected} onChange={(e) => handleSelectFerias(row.id, e.target.checked)} /></td>
                                        <td className={styles.stickyColumn}><ActionMenu items={getActionItems(row)} /></td>
                                        <td>{row.Funcionario.matricula}</td>
                                        <td><Link href={`/funcionarios/${row.Funcionario.matricula}`} className={styles.nomeLink}>{row.Funcionario.nome_funcionario}</Link></td>
                                        <td><StatusBadge status={row.status} /></td>
                                        <td>{formatDateForDisplay(row.data_inicio)}</td><td>{formatDateForDisplay(row.data_fim)}</td><td>{row.qtd_dias}</td>
                                        <td>{row.Funcionario.categoria || '---'}</td><td>{row.Funcionario.des_grupo_contrato || '---'}</td>
                                        <td>{row.Funcionario.municipio_local_trabalho || '---'}</td><td><StatusBadge status={row.Funcionario.status} /></td>
                                    </tr>
                                );
                            }))}
                    </tbody>
                </table>
            </div>

            {paginationInfo && paginationInfo.totalPages > 1 && (<Pagination pagination={paginationInfo} onPageChange={(page) => updateUrlParams({ ...filters, q: searchTerm, ano: currentYear, page })} />)}
            
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