'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import Card from '@/components/Card/Card';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import { User, Calendar, Briefcase, PlusCircle, Trash2, CalendarPlus, FileWarning } from 'lucide-react';

// Colunas para as tabelas de histórico
const feriasColumns = [ 
    { header: 'Início', accessor: 'data_inicio' }, 
    { header: 'Fim', accessor: 'data_fim' }, 
    { header: 'Status', accessor: 'status' } 
];
const afastamentosColumns = [ 
    { header: 'Motivo', accessor: 'motivo' }, 
    { header: 'Início', accessor: 'data_inicio' }, 
    { header: 'Fim', accessor: 'data_fim' }, 
    { header: 'Dias', accessor: 'dias', cell: (row) => Math.round((new Date(row.data_fim) - new Date(row.data_inicio)) / (1000 * 60 * 60 * 24)) + 1 } 
];

export default function FuncionarioProfilePage({ params }) {
    const { matricula } = params;
    const router = useRouter();

    const [funcionario, setFuncionario] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dados');
    const [modalState, setModalState] = useState({ type: null, isOpen: false });

    const fetchFuncionario = async () => {
        if (!matricula) return;
        setIsLoading(true);
        try {
            const response = await api.funcionarios.getById(matricula);
            setFuncionario(response.data);
        } catch (error) {
            console.error("Falha ao buscar dados do funcionário:", error);
            // Idealmente, usar um sistema de notificações (toast)
            alert("Erro ao buscar dados do funcionário.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFuncionario();
    }, [matricula]);
    
    const openModal = (type) => setModalState({ type, isOpen: true });
    const closeModal = () => setModalState({ type: null, isOpen: false });
    
    // --- HANDLERS PARA AS SUBMISSÕES DOS MODAIS ---

    const handleUpdateFuncionario = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await api.funcionarios.update(matricula, data);
            alert('Funcionário atualizado com sucesso!');
            fetchFuncionario(); // Recarrega os dados para exibir as alterações
        } catch (error) {
            console.error("Falha ao atualizar funcionário:", error);
            alert(error.response?.data?.message || "Erro ao atualizar.");
        }
    };
    
    const handleLancarAfastamento = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await api.afastamentos.create(matricula, data);
            alert('Afastamento lançado com sucesso!');
            closeModal();
            fetchFuncionario(); // Recarrega para mostrar o novo afastamento e recalcular períodos
        } catch(error) {
            console.error("Falha ao lançar afastamento:", error);
            alert(error.response?.data?.message || "Erro ao lançar afastamento.");
        }
    };
    
    const handleDeleteFuncionario = async () => {
        try {
            await api.funcionarios.remove(matricula);
            alert('Funcionário excluído com sucesso!');
            router.push('/funcionarios'); // Redireciona para a lista
        } catch (error) {
            console.error("Falha ao excluir funcionário:", error);
            alert(error.response?.data?.message || "Erro ao excluir funcionário.");
        }
    };
    
    const actionItems = [
        { label: 'Lançar Férias', icon: <CalendarPlus size={16}/>, onClick: () => openModal('lancarFerias') },
        { label: 'Lançar Afastamento', icon: <FileWarning size={16}/>, onClick: () => openModal('lancarAfastamento') },
        { label: 'Excluir Funcionário', icon: <Trash2 size={16}/>, variant: 'danger', onClick: () => openModal('excluir') },
    ];

    if (isLoading) {
        return <div className={styles.loadingContainer}>Carregando dados do funcionário...</div>;
    }

    if (!funcionario) {
        return <div className={styles.loadingContainer}>Funcionário não encontrado.</div>;
    }

    return (
        <>
            <div className={styles.container}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>{funcionario.nome_funcionario?.substring(0, 2).toUpperCase()}</div>
                    <div className={styles.headerInfo}>
                        <h1>{funcionario.nome_funcionario}</h1>
                        <p>Matrícula: {funcionario.matricula} | Status: <span className={styles.statusBadgeAtivo}>{funcionario.status}</span></p>
                    </div>
                    <div className={styles.headerActions}>
                        <ActionMenu items={actionItems} />
                    </div>
                </div>
                
                <div className={styles.cardsGrid}>
                    <Card icon={<Calendar size={28}/>} title="Data Limite Férias" value={new Date(funcionario.dth_limite_ferias).toLocaleDateString()} color="var(--cor-feedback-alerta)" />
                    <Card icon={<Briefcase size={28}/>} title="Admissão" value={new Date(funcionario.dth_admissao).toLocaleDateString()} />
                    <Card icon={<Calendar size={28}/>} title="Últimas Férias" value={funcionario.dth_ultima_ferias ? new Date(funcionario.dth_ultima_ferias).toLocaleDateString() : 'N/A'} />
                </div>

                <div className={styles.tabs}>
                    <button onClick={() => setActiveTab('dados')} className={activeTab === 'dados' ? styles.activeTab : ''}>Dados Completos</button>
                    <button onClick={() => setActiveTab('ferias')} className={activeTab === 'ferias' ? styles.activeTab : ''}>Histórico de Férias</button>
                    <button onClick={() => setActiveTab('afastamentos')} className={activeTab === 'afastamentos' ? styles.activeTab : ''}>Afastamentos</button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'dados' && (
                        <form className={styles.formContainer} onSubmit={handleUpdateFuncionario}>
                            {/* Formulário completo de edição */}
                            <h3 className={styles.formSectionTitle}>Informações Pessoais e Contratuais</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}><label>Nome Completo</label><input name="nome_funcionario" type="text" defaultValue={funcionario.nome_funcionario} /></div>
                                <div className={styles.formGroup}><label>Data de Admissão</label><input name="dth_admissao" type="date" defaultValue={funcionario.dth_admissao.split('T')[0]} /></div>
                                <div className={styles.formGroup}><label>Salário Base</label><input name="salario_base" type="number" step="0.01" defaultValue={funcionario.salario_base} /></div>
                                <div className={styles.formGroup}><label>Status</label><select name="status" defaultValue={funcionario.status}><option>Ativo</option><option>Inativo</option></select></div>
                            </div>
                            <div className={styles.formActions}><Button type="submit">Salvar Alterações</Button></div>
                        </form>
                    )}
                    {activeTab === 'ferias' && (
                        <div className={styles.tableSectionContainer}>
                            <div className={styles.tableHeader}><Button icon={<PlusCircle size={16}/>} variant="secondary" onClick={() => openModal('lancarFerias')}>Lançar Férias Manualmente</Button></div>
                            <Table columns={feriasColumns} data={funcionario.historicoFerias} />
                        </div>
                    )}
                    {activeTab === 'afastamentos' && (
                        <div className={styles.tableSectionContainer}>
                            <div className={styles.tableHeader}><Button icon={<PlusCircle size={16}/>} variant="secondary" onClick={() => openModal('lancarAfastamento')}>Registrar Novo Afastamento</Button></div>
                            <Table columns={afastamentosColumns} data={funcionario.historicoAfastamentos} />
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={
                 modalState.type === 'lancarFerias' ? `Lançar Férias para ${funcionario.nome_funcionario}` :
                 modalState.type === 'lancarAfastamento' ? `Lançar Afastamento para ${funcionario.nome_funcionario}` :
                 'Confirmar Exclusão'
            }>
                {modalState.type === 'lancarFerias' && (
                    <form className={styles.modalContent} /* onSubmit={handleLancarFerias} */>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}><label>Data de Início</label><input name="data_inicio" type="date" required/></div>
                            <div className={styles.formGroup}><label>Dias de Férias</label><input name="qtd_dias" type="number" defaultValue="30" required/></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar Férias</Button>
                        </div>
                    </form>
                )}
                {modalState.type === 'lancarAfastamento' && (
                    <form className={styles.modalContent} onSubmit={handleLancarAfastamento}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}><label>Motivo</label><input name="motivo" type="text" required placeholder="Ex: Licença Médica"/></div>
                            <div className={styles.formGroup}><label>Data de Início</label><input name="data_inicio" type="date" required/></div>
                            <div className={styles.formGroup}><label>Data de Fim</label><input name="data_fim" type="date" required/></div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar Afastamento</Button>
                        </div>
                    </form>
                )}
                {modalState.type === 'excluir' && (
                    <div className={styles.modalContent}>
                        <p>Tem certeza que deseja excluir o funcionário <strong>{funcionario.nome_funcionario}</strong>? Esta ação é irreversível e removerá todos os seus registros de férias e afastamentos.</p>
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