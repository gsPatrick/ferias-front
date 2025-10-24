// /app/(dashboard)/substitutos/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import styles from './substitutos.module.css';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';

// --- COMPONENTES INTERNOS ---

const StatusBadge = ({ status }) => {
    const statusClass = status === 'Disponível' ? styles.statusDisponivel : styles.statusAlocado;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
};

const CargosList = ({ cargos }) => {
    if (!cargos || cargos.length === 0) {
        return <span className={styles.noCargos}>Nenhum cargo definido</span>;
    }
    return (
        <div className={styles.cargosContainer}>
            {cargos.map((cargo, index) => (
                <span key={index} className={styles.cargoBadge}>{cargo}</span>
            ))}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function SubstitutosPage() {
    const [substitutos, setSubstitutos] = useState([]);
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });

    // Busca os dados iniciais: a lista de substitutos e a lista de todos os funcionários para o modal
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [substitutosResponse, funcionariosResponse] = await Promise.all([
                api.substitutos.getAll(),
                api.funcionarios.getAll({ status: 'Ativo', limit: 10000 }) // Busca todos os ativos
            ]);
            setSubstitutos(substitutosResponse.data || []);
            setAllFuncionarios(funcionariosResponse.data.data || []);
        } catch (error) {
            console.error("Falha ao buscar dados:", error);
            alert('Não foi possível carregar os dados da página. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });

    // Filtra funcionários que ainda não estão na lista de substitutos para exibir no <select>
    const funcionariosDisponiveis = useMemo(() => {
        const matriculasSubstitutos = new Set(substitutos.map(s => s.matricula_funcionario));
        return allFuncionarios.filter(f => !matriculasSubstitutos.has(f.matricula));
    }, [allFuncionarios, substitutos]);

    const getActionItems = (substituto) => [
        { label: 'Editar Cargos', icon: <Edit size={16}/>, onClick: () => openModal('editar', substituto) },
        { label: 'Remover', icon: <Trash2 size={16}/>, variant: 'danger', onClick: () => openModal('remover', substituto) },
    ];

    const columns = [
        { header: 'Ações', accessor: 'acoes', cell: (row) => <ActionMenu items={getActionItems(row)} /> },
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Nome do Substituto', accessor: 'Funcionario.nome_funcionario' },
        { header: 'Cargo Principal', accessor: 'Funcionario.categoria' },
        { header: 'Cargos Aptos a Substituir', accessor: 'cargos_aptos', cell: (row) => <CargosList cargos={row.cargos_aptos} /> },
        { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
    ];

    const getModalTitle = () => {
        switch (modalState.type) {
            case 'adicionar': return 'Adicionar ao Quadro de Substitutos';
            case 'editar': return `Editar Cargos de ${modalState.data?.Funcionario.nome_funcionario}`;
            case 'remover': return 'Remover Substituto';
            default: return '';
        }
    };

    const renderModalContent = () => {
        switch (modalState.type) {
            case 'adicionar':
                const handleAddSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const matricula = formData.get('matricula_funcionario');
                    const cargos = formData.get('cargos_aptos').split(',').map(c => c.trim()).filter(Boolean);
                    
                    try {
                        await api.substitutos.create({ matricula_funcionario: matricula, cargos_aptos: cargos });
                        alert('Funcionário adicionado ao quadro de substitutos!');
                        closeModal();
                        fetchData();
                    } catch (error) {
                        alert(error.response?.data?.message || 'Erro ao adicionar substituto.');
                    }
                };
                return (
                    <form onSubmit={handleAddSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="matricula_funcionario">Funcionário</label>
                                <select id="matricula_funcionario" name="matricula_funcionario" required>
                                    <option value="">Selecione um funcionário...</option>
                                    {funcionariosDisponiveis.map(f => (
                                        <option key={f.matricula} value={f.matricula}>
                                            {f.nome_funcionario}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cargos_aptos">Cargos Aptos (separados por vírgula)</label>
                                <input id="cargos_aptos" name="cargos_aptos" type="text" placeholder="Ex: Recepcionista, Porteiro" required />
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Adicionar Substituto</Button>
                        </div>
                    </form>
                );
            case 'editar':
                const handleEditSubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const cargos = formData.get('cargos_aptos').split(',').map(c => c.trim()).filter(Boolean);
                    
                    try {
                        await api.substitutos.update(modalState.data.id, { cargos_aptos: cargos });
                        alert('Cargos do substituto atualizados com sucesso!');
                        closeModal();
                        fetchData();
                    } catch (error) {
                        alert(error.response?.data?.message || 'Erro ao atualizar.');
                    }
                };
                 return (
                    <form onSubmit={handleEditSubmit}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Funcionário</label>
                                <input type="text" value={modalState.data?.Funcionario.nome_funcionario} disabled />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cargos_aptos">Cargos Aptos (separados por vírgula)</label>
                                <input id="cargos_aptos" name="cargos_aptos" type="text" defaultValue={modalState.data?.cargos_aptos?.join(', ')} placeholder="Ex: Recepcionista, Porteiro" required />
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </form>
                );
            case 'remover':
                const handleConfirmRemove = async () => {
                     try {
                        await api.substitutos.remove(modalState.data.id);
                        alert('Funcionário removido do quadro de substitutos.');
                        closeModal();
                        fetchData();
                    } catch (error) {
                        alert(error.response?.data?.message || 'Erro ao remover substituto.');
                    }
                };
                return (
                    <div style={{ textAlign: 'center' }}>
                        <p>Tem certeza que deseja remover <strong>{modalState.data?.Funcionario.nome_funcionario}</strong> do quadro de substitutos?</p>
                        <div className={styles.modalActions} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={handleConfirmRemove}>Sim, Remover</Button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Users size={32} />
                    <h1>Quadro de Substitutos</h1>
                </div>
                <Button 
                    icon={<UserPlus size={16} />} 
                    onClick={() => openModal('adicionar')}
                    disabled={funcionariosDisponiveis.length === 0}
                    title={funcionariosDisponiveis.length === 0 ? "Todos os funcionários ativos já são substitutos" : "Adicionar funcionário ao quadro"}
                >
                    Adicionar Substituto
                </Button>
            </div>

            <div className={styles.tableWrapper}>
                <Table 
                    columns={columns} 
                    data={substitutos} 
                    isLoading={isLoading} 
                />
            </div>

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={getModalTitle()}>
                {renderModalContent()}
            </Modal>
        </div>
    );
}