'use client'; 

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import FilterPanel from '@/components/FilterPanel/FilterPanel';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import styles from './funcionarios.module.css';
import { User, Search, Filter, UserPlus, Trash2, CalendarPlus, FileWarning, Download, Upload, XCircle } from 'lucide-react';

// Componentes internos para badges e indicadores visuais
const StatusBadge = ({ status }) => {
    const statusClass = status === 'Ativo' ? styles.statusAtivo : styles.statusInativo;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
}

const RiskIndicator = ({ dias }) => {
    let riskLevel = styles.low;
    let title = "Prazo confortável";
    if (dias <= 60 && dias > 30) { riskLevel = styles.medium; title = `Vence em ${dias} dias`; }
    if (dias <= 30 && dias >= 0) { riskLevel = styles.high; title = `Vence em ${dias} dias! ALTO RISCO!`; }
    if (dias < 0) { riskLevel = styles.expired; title = `Vencido há ${Math.abs(dias)} dias!`; }
    return <div className={`${styles.riskIndicator} ${riskLevel}`} title={title}></div>;
}

export default function FuncionariosPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeFilter = searchParams.get('filtro');

    const [funcionarios, setFuncionarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedFuncionarios, setSelectedFuncionarios] = useState([]);

    const fetchFuncionarios = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (activeFilter) {
                params.filtro = activeFilter;
            }
            // Adicionar outros filtros aqui no futuro (busca, painel lateral)

            const response = await api.funcionarios.getAll(params);
            setFuncionarios(response.data);
        } catch (error) {
            console.error("Falha ao buscar funcionários:", error);
            // TODO: Adicionar feedback de erro para o usuário (ex: toast)
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFuncionarios();
    }, [activeFilter]);
    
    const clearActiveFilter = () => {
        router.push('/funcionarios');
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
            fetchFuncionarios(); // Atualiza a lista
            // TODO: Adicionar toast de sucesso
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
            fetchFuncionarios(); // Atualiza a lista
            // TODO: Adicionar toast de sucesso
        } catch (error) {
            console.error("Falha ao excluir funcionário:", error);
            alert(error.response?.data?.message || "Erro ao excluir funcionário.");
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
        { header: 'Período Aquisitivo', accessor: 'periodo_aquisitivo_atual_inicio', cell: (row) => `${new Date(row.periodo_aquisitivo_atual_inicio).toLocaleDateString()} - ${new Date(row.periodo_aquisitivo_atual_fim).toLocaleDateString()}` },
        { header: 'Saldo Dias', accessor: 'saldo_dias_ferias', cell: (row) => <div className={styles.saldoCell}>{row.saldo_dias_ferias}</div> },
        { header: 'Limite Férias', accessor: 'dth_limite_ferias', cell: (row) => (
            <div className={styles.limiteCell}>
                <RiskIndicator dias={Math.floor((new Date(row.dth_limite_ferias) - new Date()) / (1000 * 60 * 60 * 24))} />
                <span>{new Date(row.dth_limite_ferias).toLocaleDateString()}</span>
            </div>
        )},
        { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
        { header: 'Ações', accessor: 'acoes', cell: (row) => <ActionMenu items={getActionItems(row)} /> },
    ];

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.searchContainer}>
                        <Search size={20} className={styles.searchIcon} />
                        <input type="text" placeholder="Buscar por nome ou matrícula..." className={styles.searchInput} />
                    </div>
                    <div className={styles.actions}>
                        <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setIsFilterOpen(true)}>Filtros</Button>
                        <Button icon={<UserPlus size={16} />} onClick={() => openModal('adicionar')}>Adicionar</Button>
                        <Button variant="secondary" icon={<Download size={16} />}>Exportar</Button>
                    </div>
                </div>

                {activeFilter && (
                    <div className={styles.activeFilterPill}>
                        <span>Filtro Ativo: <strong>{activeFilter === 'vencidas' ? 'Férias Vencidas' : 'Risco Iminente'}</strong></span>
                        <button onClick={clearActiveFilter} className={styles.clearFilterButton} title="Limpar Filtro"><XCircle size={18}/></button>
                    </div>
                )}

                {selectedFuncionarios.length > 0 && (
                    <div className={styles.bulkActionsPanel}>
                        <span>{selectedFuncionarios.length} selecionado(s)</span>
                        <Button variant="secondary">Alterar Status</Button>
                        <Button variant="danger" icon={<Trash2 size={16} />}>Excluir Selecionados</Button>
                    </div>
                )}

                <div className={styles.tableWrapper}>
                    <Table columns={columns} data={funcionarios} isLoading={isLoading} isSelectable={true} onSelectionChange={setSelectedFuncionarios} />
                </div>
            </div>

            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={() => {}} />

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={
                modalState.type === 'adicionar' ? 'Adicionar Novo Funcionário' :
                modalState.type === 'lancarFerias' ? `Lançar Férias para ${modalState.data?.nome_funcionario}` :
                modalState.type === 'lancarAfastamento' ? `Lançar Afastamento para ${modalState.data?.nome_funcionario}` :
                'Confirmar Ação'
            }>
                {modalState.type === 'adicionar' && (
                    <form className={styles.modalContent} onSubmit={handleCreateFuncionario}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}><label>Matrícula</label><input name="matricula" required type="text" /></div>
                            <div className={styles.formGroup}><label>Nome Completo</label><input name="nome_funcionario" required type="text" /></div>
                            <div className={styles.formGroup}><label>Data de Admissão</label><input name="dth_admissao" required type="date" /></div>
                            <div className={styles.formGroup}><label>Município</label><input name="municipio_local_trabalho" required type="text" /></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                )}
                {/* Outros modais (Lançar Férias, Afastamento) seriam implementados de forma similar */}
                {modalState.type === 'excluir' && (
                    <div className={styles.modalContent}>
                        <p>Tem certeza que deseja excluir o funcionário <strong>{modalState.data?.nome_funcionario}</strong>?</p>
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDeleteFuncionario}>Confirmar Exclusão</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}