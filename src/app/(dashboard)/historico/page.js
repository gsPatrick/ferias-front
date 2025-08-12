'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import styles from './historico.module.css';
import { ArchiveRestore, CalendarDays } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusClass = status === 'Ativo' ? styles.statusAtivo : styles.statusArquivado;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
}

export default function HistoricoPage() {
    const [historico, setHistorico] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
    const [modalState, setModalState] = useState({ isOpen: false, planejamento: null });

    const fetchHistorico = async () => {
        setIsLoading(true);
        try {
            const response = await api.planejamento.getHistorico(anoFiltro);
            setHistorico(response.data);
        } catch (error) {
            console.error("Falha ao buscar histórico:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorico();
    }, [anoFiltro]);

    const handleRestoreClick = (planejamento) => {
        setModalState({ isOpen: true, planejamento: planejamento });
    };

    const handleConfirmRestore = async () => {
        if (!modalState.planejamento?.id) return;
        try {
            await api.planejamento.restaurar(modalState.planejamento.id);
            alert('Planejamento restaurado com sucesso!');
            setModalState({ isOpen: false, planejamento: null });
            fetchHistorico(); // Recarrega a lista para mostrar o novo status
        } catch (error) {
            console.error("Falha ao restaurar planejamento:", error);
            alert(error.response?.data?.message || "Erro ao restaurar.");
        }
    };
    
    const columns = [
        { header: 'Ano', accessor: 'ano' },
        { header: 'Descrição', accessor: 'descricao' },
        { header: 'Data de Criação', accessor: 'criado_em', cell: (row) => new Date(row.criado_em).toLocaleString() },
        { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
        { header: 'Ações', accessor: 'acoes', cell: (row) => (
            row.status !== 'ativo' ? (
                <Button variant="secondary" icon={<ArchiveRestore size={16} />} onClick={() => handleRestoreClick(row)}>
                    Restaurar
                </Button>
            ) : null
        )}
    ];

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <p className={styles.description}>Visualize e gerencie todas as versões dos planejamentos de férias. Você pode restaurar uma versão anterior a qualquer momento.</p>
                    <div className={styles.filterGroup}>
                        <label htmlFor="ano-filtro">Filtrar por ano:</label>
                        <select id="ano-filtro" className={styles.yearSelect} value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)}>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                </div>

                <Table columns={columns} data={historico} isLoading={isLoading} />
            </div>
            
            <Modal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, planejamento: null })}
                title="Confirmar Restauração"
            >
                {modalState.planejamento && (
                    <div className={styles.modalBody}>
                        <p>Deseja restaurar o planejamento: <strong>"{modalState.planejamento.descricao}"</strong>?</p>
                        <p className={styles.warningText}>O planejamento atualmente ativo para <strong>{modalState.planejamento.ano}</strong> será arquivado.</p>
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setModalState({ isOpen: false, planejamento: null })}>Cancelar</Button>
                            <Button variant="primary" onClick={handleConfirmRestore}>Sim, Restaurar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}