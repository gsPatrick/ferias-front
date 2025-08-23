// src/app/(dashboard)/afastados/page.js
'use client'; 

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import Pagination from '@/components/Pagination/Pagination';
import styles from './afastados.module.css';
import { Search, Filter, Edit, Trash2, XCircle, FileWarning } from 'lucide-react';

// --- HELPERS E COMPONENTES INTERNOS ---

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const StatusBadge = ({ status }) => {
    const statusClass = status === 'Ativo' ? styles.statusAtivo : styles.statusInativo;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
};

// --- COMPONENTE PRINCIPAL ---

function AfastadosComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [afastamentos, setAfastamentos] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedAfastamentos, setSelectedAfastamentos] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    const fetchAfastamentos = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const response = await api.afastamentos.getAllActive(params); 
            setAfastamentos(response.data.data || []);
            setPaginationInfo(response.data.pagination);
        } catch (error) {
            console.error("Falha ao buscar afastamentos:", error);
            setAfastamentos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentParams = Object.fromEntries(searchParams.entries());
        fetchAfastamentos(currentParams);
        const urlFilters = { ...currentParams };
        delete urlFilters.page;
        delete urlFilters.limit;
        setSearchTerm(urlFilters.q || '');
        delete urlFilters.q;
        setFilters(urlFilters);
    }, [searchParams, fetchAfastamentos]);

    const updateUrlParams = (newParams) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) current.set(key, value);
            else current.delete(key);
        });
        current.set('page', '1');
        router.push(`${pathname}?${current.toString()}`);
    };
    
    const handleGenericFilterChange = (name, value) => {
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        updateUrlParams({ ...newFilters, q: searchTerm });
    };

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        updateUrlParams({ ...filters, q: newSearchTerm });
    };
    
    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        router.push(pathname);
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        setSelectedAfastamentos(checked ? afastamentos.map(a => a.id) : []);
    };

    const handleSelectAfastamento = (id, checked) => {
        setSelectedAfastamentos(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
        if (!checked) setSelectAll(false);
    };

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });
    
    const handleBulkDelete = () => {
        if (selectedAfastamentos.length > 0) openModal('bulkDelete', selectedAfastamentos);
    };

    const getActionItems = (afastamento) => [
        { label: 'Editar Afastamento', icon: <Edit size={16}/>, onClick: () => openModal('editar', afastamento) },
        { label: 'Excluir Afastamento', icon: <Trash2 size={16}/>, variant: 'danger', onClick: () => openModal('excluir', afastamento) },
    ];

    const columns = [
        { header: 'Ações', accessor: 'acoes', sticky: true }, 
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Nome', accessor: 'Funcionario.nome_funcionario' }, 
        { header: 'Motivo Afastamento', accessor: 'motivo' },
        { header: 'Início Afastamento', accessor: 'data_inicio' },
        { header: 'Fim Afastamento', accessor: 'data_fim' },
        { header: 'Status Funcionário', accessor: 'Funcionario.status' },
        { header: 'Situação Atual', accessor: 'Funcionario.situacao_ferias_afastamento_hoje' }, 
        { header: 'Admissão', accessor: 'Funcionario.dth_admissao' },
        { header: 'Próx. Período', accessor: 'Funcionario.proximo_periodo_aquisitivo_texto' }, 
        { header: 'Início Período', accessor: 'Funcionario.periodo_aquisitivo_atual_inicio' },
        { header: 'Fim Período', accessor: 'Funcionario.periodo_aquisitivo_atual_fim' }, 
        { header: 'Data Limite', accessor: 'Funcionario.dth_limite_ferias' },
        { header: 'Qtd. Faltas', accessor: 'Funcionario.faltas_injustificadas_periodo' },
        { header: 'Categoria/Cargo', accessor: 'Funcionario.categoria' }, 
        { header: 'Cat. Trab.', accessor: 'Funcionario.categoria_trab' },
        { header: 'Horário', accessor: 'Funcionario.horario' }, 
        { header: 'Escala', accessor: 'Funcionario.escala' },
        { header: 'UF', accessor: 'Funcionario.sigla_local' }, 
        { header: 'Gestão Contrato', accessor: 'Funcionario.des_grupo_contrato' },
        { header: 'ID Gestão', accessor: 'Funcionario.id_grupo_contrato' }, 
        { header: 'Convenção', accessor: 'Funcionario.convencao' },
    ];

    const renderModalContent = () => {
        switch (modalState.type) {
            case 'editar':
                const handleEditSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.impacta_ferias = e.target.impacta_ferias.checked;
                    try {
                        await api.afastamentos.update(modalState.data.id, data);
                        closeModal();
                        fetchAfastamentos(Object.fromEntries(searchParams.entries()));
                    } catch (error) { alert('Erro ao atualizar afastamento.'); }
                };
                return (
                    <form onSubmit={handleEditSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}><label>Motivo</label><input name="motivo" type="text" defaultValue={modalState.data?.motivo} required /></div>
                            <div className={styles.formGroup}><label>Data de Início</label><input name="data_inicio" type="date" defaultValue={formatDateForInput(modalState.data?.data_inicio)} required /></div>
                            <div className={styles.formGroup}><label>Data de Fim (deixe em branco se em aberto)</label><input name="data_fim" type="date" defaultValue={formatDateForInput(modalState.data?.data_fim)} /></div>
                            <div className={styles.formGroup}><label><input name="impacta_ferias" type="checkbox" defaultChecked={modalState.data?.impacta_ferias} /> Impacta no cálculo de férias?</label></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}><Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button><Button type="submit">Salvar Alterações</Button></div>
                    </form>
                );
            case 'excluir':
                const handleConfirmDelete = async () => {
                    try {
                        await api.afastamentos.remove(modalState.data.id);
                        closeModal();
                        fetchAfastamentos(Object.fromEntries(searchParams.entries()));
                    } catch (error) { alert('Erro ao excluir afastamento.'); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir o afastamento do funcionário <strong>{modalState.data?.Funcionario.nome_funcionario}</strong>?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="danger" onClick={handleConfirmDelete}>Excluir</Button></div>
                    </div>
                );
            case 'bulkDelete':
                const handleConfirmBulkDelete = async () => {
                    try {
                        await api.afastamentos.bulkRemove(selectedAfastamentos);
                        closeModal();
                        setSelectedAfastamentos([]);
                        fetchAfastamentos(Object.fromEntries(searchParams.entries()));
                    } catch (error) { alert('Erro ao excluir afastamentos selecionados.'); }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja excluir <strong>{selectedAfastamentos.length}</strong> afastamentos selecionados?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="danger" onClick={handleConfirmBulkDelete}>Excluir Selecionados</Button></div>
                    </div>
                );
            default: return null;
        }
    };
    
    const getModalTitle = () => {
        switch (modalState.type) {
            case 'editar': return `Editar Afastamento de ${modalState.data?.Funcionario.nome_funcionario}`;
            case 'excluir': return 'Excluir Afastamento';
            case 'bulkDelete': return 'Excluir Afastamentos Selecionados';
            default: return 'Modal';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}><FileWarning size={32} /><h1>Painel de Afastados</h1></div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setShowFilters(p => !p)}>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</Button>
                    {selectedAfastamentos.length > 0 && (<Button variant="danger" icon={<Trash2 size={16} />} onClick={handleBulkDelete}>Excluir ({selectedAfastamentos.length})</Button>)}
                </div>
            </div>

            {showFilters && (
                <div className={styles.filterGrid}>
                    {/* Linha 1 */}
                    <div className={`${styles.formGroup} ${styles.searchGroup}`}><label htmlFor="q">Busca Rápida</label><div className={styles.inputIconWrapper}><Search size={18} className={styles.inputIcon} /><input id="q" name="q" type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange} /></div></div>
                    <div className={styles.formGroup}><label htmlFor="status">Status</label><select id="status" name="status" value={filters.status || ''} onChange={e => handleGenericFilterChange('status', e.target.value)}><option value="">Todos</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
                    <div className={styles.formGroup}><label htmlFor="matricula">Matrícula</label><input id="matricula" name="matricula" type="text" placeholder="Filtrar por matrícula" value={filters.matricula || ''} onChange={e => handleGenericFilterChange('matricula', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="situacao_ferias_afastamento_hoje">Situação Atual</label><input id="situacao_ferias_afastamento_hoje" name="situacao_ferias_afastamento_hoje" type="text" placeholder="Filtrar situação" value={filters.situacao_ferias_afastamento_hoje || ''} onChange={e => handleGenericFilterChange('situacao_ferias_afastamento_hoje', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="categoria">Categoria/Cargo</label><input id="categoria" name="categoria" type="text" placeholder="Filtrar por cargo" value={filters.categoria || ''} onChange={e => handleGenericFilterChange('categoria', e.target.value)} /></div>
                    
                    {/* Linha 2 */}
                    <div className={styles.formGroup}><label htmlFor="categoria_trab">Cat. Trabalhador</label><input id="categoria_trab" name="categoria_trab" type="text" placeholder="Categoria trabalhador" value={filters.categoria_trab || ''} onChange={e => handleGenericFilterChange('categoria_trab', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="horario">Horário</label><input id="horario" name="horario" type="text" placeholder="Filtrar horário" value={filters.horario || ''} onChange={e => handleGenericFilterChange('horario', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="escala">Escala</label><input id="escala" name="escala" type="text" placeholder="Filtrar escala" value={filters.escala || ''} onChange={e => handleGenericFilterChange('escala', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="sigla_local">Estado (UF)</label><input id="sigla_local" name="sigla_local" type="text" placeholder="Filtrar estado" value={filters.sigla_local || ''} onChange={e => handleGenericFilterChange('sigla_local', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="municipio_local_trabalho">Município</label><input id="municipio_local_trabalho" name="municipio_local_trabalho" type="text" placeholder="Filtrar município" value={filters.municipio_local_trabalho || ''} onChange={e => handleGenericFilterChange('municipio_local_trabalho', e.target.value)} /></div>

                    {/* Linha 3 */}
                    <div className={styles.formGroup}><label htmlFor="des_grupo_contrato">Gestão Contrato</label><input id="des_grupo_contrato" name="des_grupo_contrato" type="text" placeholder="Filtrar gestão" value={filters.des_grupo_contrato || ''} onChange={e => handleGenericFilterChange('des_grupo_contrato', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="id_grupo_contrato">ID Gestão</label><input id="id_grupo_contrato" name="id_grupo_contrato" type="text" placeholder="Filtrar ID gestão" value={filters.id_grupo_contrato || ''} onChange={e => handleGenericFilterChange('id_grupo_contrato', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="convencao">Convenção</label><input id="convencao" name="convencao" type="text" placeholder="Filtrar convenção" value={filters.convencao || ''} onChange={e => handleGenericFilterChange('convencao', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="proximo_periodo_aquisitivo_texto">Próx. Período</label><input id="proximo_periodo_aquisitivo_texto" name="proximo_periodo_aquisitivo_texto" type="text" placeholder="Filtrar período" value={filters.proximo_periodo_aquisitivo_texto || ''} onChange={e => handleGenericFilterChange('proximo_periodo_aquisitivo_texto', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="faltas_injustificadas_periodo">Qtd. Faltas</label><input id="faltas_injustificadas_periodo" name="faltas_injustificadas_periodo" type="number" placeholder="Número de faltas" value={filters.faltas_injustificadas_periodo || ''} onChange={e => handleGenericFilterChange('faltas_injustificadas_periodo', e.target.value)} /></div>

                    {/* Linha 4 */}
                    <div className={styles.formGroup}><label htmlFor="dth_admissao">Data Admissão</label><input id="dth_admissao" name="dth_admissao" type="date" value={filters.dth_admissao || ''} onChange={e => handleGenericFilterChange('dth_admissao', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="periodo_aquisitivo_atual_inicio">Início Período</label><input id="periodo_aquisitivo_atual_inicio" name="periodo_aquisitivo_atual_inicio" type="date" value={filters.periodo_aquisitivo_atual_inicio || ''} onChange={e => handleGenericFilterChange('periodo_aquisitivo_atual_inicio', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="periodo_aquisitivo_atual_fim">Fim Período</label><input id="periodo_aquisitivo_atual_fim" name="periodo_aquisitivo_atual_fim" type="date" value={filters.periodo_aquisitivo_atual_fim || ''} onChange={e => handleGenericFilterChange('periodo_aquisitivo_atual_fim', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="dth_limite_ferias">Data Limite Férias</label><input id="dth_limite_ferias" name="dth_limite_ferias" type="date" value={filters.dth_limite_ferias || ''} onChange={e => handleGenericFilterChange('dth_limite_ferias', e.target.value)} /></div>
                    <div className={styles.formGroup}></div> {/* Espaço reservado */}

                    {/* Linha 5 - Filtros Específicos de Afastamento */}
                    <div className={styles.formGroup}><label htmlFor="motivo">Motivo Afastamento</label><input id="motivo" name="motivo" type="text" placeholder="Filtrar por motivo" value={filters.motivo || ''} onChange={e => handleGenericFilterChange('motivo', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="afastamento_inicio_de">Início Afast. (de)</label><input id="afastamento_inicio_de" name="afastamento_inicio_de" type="date" value={filters.afastamento_inicio_de || ''} onChange={e => handleGenericFilterChange('afastamento_inicio_de', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="afastamento_inicio_ate">Início Afast. (até)</label><input id="afastamento_inicio_ate" name="afastamento_inicio_ate" type="date" value={filters.afastamento_inicio_ate || ''} onChange={e => handleGenericFilterChange('afastamento_inicio_ate', e.target.value)} /></div>
                    <div className={styles.formGroup}><label htmlFor="impacta_ferias">Impacta Férias?</label><select id="impacta_ferias" name="impacta_ferias" value={filters.impacta_ferias || ''} onChange={e => handleGenericFilterChange('impacta_ferias', e.target.value)}><option value="">Todos</option><option value="true">Sim</option><option value="false">Não</option></select></div>
                    <div className={styles.filterActions}><Button variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar Todos</Button></div>
                </div>
            )}
            
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} /></th>{columns.map(col => (<th key={col.accessor} className={col.sticky ? styles.stickyColumn : ''}>{col.header}</th>))}</tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={columns.length + 1} className={styles.loading}>Carregando...</td></tr>) 
                        : afastamentos.length === 0 ? (<tr><td colSpan={columns.length + 1} className={styles.noData}>Nenhum funcionário afastado encontrado.</td></tr>) 
                        : (afastamentos.map(row => {
                                const isSelected = selectedAfastamentos.includes(row.id);
                                return (
                                    <tr key={row.id} className={isSelected ? styles.selectedRow : ''}>
                                        <td className={`${styles.stickyColumn} ${styles.checkboxCell}`}><input type="checkbox" checked={isSelected} onChange={(e) => handleSelectAfastamento(row.id, e.target.checked)} /></td>
                                        <td className={styles.stickyColumn}><ActionMenu items={getActionItems(row)} /></td>
                                        <td>{row.Funcionario.matricula}</td>
                                        <td><Link href={`/funcionarios/${row.Funcionario.matricula}`} className={styles.nomeLink}>{row.Funcionario.nome_funcionario}</Link></td>
                                        <td>{row.motivo}</td><td>{formatDateForDisplay(row.data_inicio)}</td><td>{formatDateForDisplay(row.data_fim)}</td>
                                        <td><StatusBadge status={row.Funcionario.status} /></td>
                                        <td className={styles.situacaoCell}>{row.Funcionario.situacao_ferias_afastamento_hoje || '---'}</td>
                                        <td>{formatDateForDisplay(row.Funcionario.dth_admissao)}</td><td>{row.Funcionario.proximo_periodo_aquisitivo_texto || '---'}</td>
                                        <td>{formatDateForDisplay(row.Funcionario.periodo_aquisitivo_atual_inicio)}</td><td>{formatDateForDisplay(row.Funcionario.periodo_aquisitivo_atual_fim)}</td>
                                        <td>{formatDateForDisplay(row.Funcionario.dth_limite_ferias)}</td><td>{row.Funcionario.faltas_injustificadas_periodo || 0}</td>
                                        <td>{row.Funcionario.categoria || '---'}</td><td>{row.Funcionario.categoria_trab || '---'}</td>
                                        <td>{row.Funcionario.horario || '---'}</td><td>{row.Funcionario.escala || '---'}</td><td>{row.Funcionario.sigla_local || '---'}</td>
                                        <td>{row.Funcionario.des_grupo_contrato || '---'}</td><td>{row.Funcionario.id_grupo_contrato || '---'}</td>
                                        <td className={styles.convencaoCell}>{row.Funcionario.convencao || '---'}</td>
                                    </tr>
                                );
                            }))}
                    </tbody>
                </table>
            </div>

            {paginationInfo && paginationInfo.totalPages > 1 && (<Pagination pagination={paginationInfo} onPageChange={(page) => updateUrlParams({ ...filters, q: searchTerm, page })} />)}
            
            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={getModalTitle()}>{renderModalContent()}</Modal>
        </div>
    );
}

export default function AfastadosPage() {
    return (
        <Suspense fallback={<div>Carregando painel de afastados...</div>}>
            <AfastadosComponent />
        </Suspense>
    );
}