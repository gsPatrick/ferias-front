// src/app/(dashboard)/funcionarios/[matricula]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import Card from '@/components/Card/Card';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import { User, Calendar, Briefcase, PlusCircle, Trash2, CalendarPlus, FileWarning, Download, MapPin, Clock, Users, Edit3, X, Check, AlertTriangle } from 'lucide-react';

// --- FUNÇÕES HELPER ---

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

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const RiskIndicator = ({ dias }) => {
    if (dias === null || dias === undefined) return null;
    let riskClass = 'low';
    if (dias <= 60 && dias > 30) { riskClass = 'medium'; }
    if (dias <= 30 && dias >= 0) { riskClass = 'high'; }
    if (dias < 0) { riskClass = 'expired'; }
    return (
        <div className={`${styles.riskIndicator} ${styles[riskClass]}`} title={`${dias} dias restantes`}></div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function FuncionarioProfilePage() {
    const params = useParams();
    const { matricula } = params;
    const router = useRouter();

    const [funcionario, setFuncionario] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dados');
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });
    const [selectedItems, setSelectedItems] = useState([]);
    const [isEditing, setIsEditing] = useState({});

    const handleGerarAviso = async (feriasId, nomeFuncionario) => {
        if (!feriasId) return;
        try {
            const response = await api.relatorios.getAvisoFerias(feriasId);
            downloadFile(response.data, `Aviso_Ferias_${nomeFuncionario.replace(/\s/g, '_')}.xlsx`);
        } catch (error) {
            console.error("Erro ao gerar aviso de férias:", error);
            alert("Não foi possível gerar o aviso de férias.");
        }
    };

    const handleEditFerias = (ferias) => {
        setModalState({ 
            type: 'editarFerias', 
            data: ferias, 
            isOpen: true 
        });
    };

    const handleEditAfastamento = (afastamento) => {
        setModalState({ 
            type: 'editarAfastamento', 
            data: afastamento, 
            isOpen: true 
        });
    };

    const handleDeleteFerias = async (feriasId) => {
        if (!confirm('Tem certeza que deseja excluir este período de férias?')) return;
        try {
            await api.ferias.remove(feriasId);
            alert('Férias excluídas com sucesso!');
            fetchFuncionario();
        } catch (error) {
            console.error("Erro ao excluir férias:", error);
            alert("Erro ao excluir férias.");
        }
    };

    const handleDeleteAfastamento = async (afastamentoId) => {
        if (!confirm('Tem certeza que deseja excluir este afastamento?')) return;
        try {
            await api.afastamentos.remove(afastamentoId);
            alert('Afastamento excluído com sucesso!');
            fetchFuncionario();
        } catch (error) {
            console.error("Erro ao excluir afastamento:", error);
            alert("Erro ao excluir afastamento.");
        }
    };

    const handleBulkDeleteFerias = async () => {
        if (selectedItems.length === 0) {
            alert('Selecione pelo menos um item para excluir.');
            return;
        }
        if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} períodos de férias?`)) return;
        try {
            await api.ferias.bulkRemove(selectedItems);
            alert('Férias excluídas com sucesso!');
            setSelectedItems([]);
            fetchFuncionario();
        } catch (error) {
            console.error("Erro ao excluir férias em massa:", error);
            alert("Erro ao excluir férias.");
        }
    };

    const handleBulkDeleteAfastamentos = async () => {
        if (selectedItems.length === 0) {
            alert('Selecione pelo menos um item para excluir.');
            return;
        }
        if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} afastamentos?`)) return;
        try {
            await api.afastamentos.bulkRemove(selectedItems);
            alert('Afastamentos excluídos com sucesso!');
            setSelectedItems([]);
            fetchFuncionario();
        } catch (error) {
            console.error("Erro ao excluir afastamentos em massa:", error);
            alert("Erro ao excluir afastamentos.");
        }
    };

    const feriasColumns = [ 
        {
            header: (
                <input 
                    type="checkbox" 
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedItems(funcionario?.historicoFerias?.map(f => f.id) || []);
                        } else {
                            setSelectedItems([]);
                        }
                    }}
                    checked={selectedItems.length > 0 && selectedItems.length === (funcionario?.historicoFerias?.length || 0)}
                />
            ),
            accessor: 'checkbox',
            cell: (row) => (
                <input 
                    type="checkbox" 
                    checked={selectedItems.includes(row.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedItems(prev => [...prev, row.id]);
                        } else {
                            setSelectedItems(prev => prev.filter(id => id !== row.id));
                        }
                    }}
                />
            )
        },
        { header: 'Início', accessor: 'data_inicio', cell: (row) => formatDateForDisplay(row.data_inicio) }, 
        { header: 'Fim', accessor: 'data_fim', cell: (row) => formatDateForDisplay(row.data_fim) }, 
        { header: 'Dias', accessor: 'qtd_dias' },
        { header: 'Status', accessor: 'status', cell: (row) => (
            <span className={`${styles.statusBadge} ${styles[row.status?.toLowerCase()]}`}>
                {row.status}
            </span>
        )},
        { header: 'Substituição?', accessor: 'necessidade_substituicao', cell: (row) => row.necessidade_substituicao ? 'Sim' : 'Não' },
        { header: 'Aviso', accessor: 'aviso', cell: (row) => (
            <Button 
                variant="secondary" 
                size="small"
                onClick={() => handleGerarAviso(row.id, funcionario?.nome_funcionario || 'Funcionario')}
            >
                <Download size={14}/>
            </Button>
        )},
        { header: 'Ações', accessor: 'actions', cell: (row) => (
            <div className={styles.actionButtons}>
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => handleEditFerias(row)}
                    title="Editar"
                >
                    <Edit3 size={14}/>
                </Button>
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => handleDeleteFerias(row.id)}
                    title="Excluir"
                    className={styles.deleteButton}
                >
                    <Trash2 size={14}/>
                </Button>
            </div>
        )}
    ];

    const afastamentosColumns = [ 
        {
            header: (
                <input 
                    type="checkbox" 
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedItems(funcionario?.historicoAfastamentos?.map(a => a.id) || []);
                        } else {
                            setSelectedItems([]);
                        }
                    }}
                    checked={selectedItems.length > 0 && selectedItems.length === (funcionario?.historicoAfastamentos?.length || 0)}
                />
            ),
            accessor: 'checkbox',
            cell: (row) => (
                <input 
                    type="checkbox" 
                    checked={selectedItems.includes(row.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedItems(prev => [...prev, row.id]);
                        } else {
                            setSelectedItems(prev => prev.filter(id => id !== row.id));
                        }
                    }}
                />
            )
        },
        { header: 'Motivo', accessor: 'motivo' }, 
        { header: 'Início', accessor: 'data_inicio', cell: (row) => formatDateForDisplay(row.data_inicio) }, 
        { header: 'Fim', accessor: 'data_fim', cell: (row) => row.data_fim ? formatDateForDisplay(row.data_fim) : 'Em andamento' }, 
        { header: 'Dias', accessor: 'dias', cell: (row) => {
            if (!row.data_inicio) return 'N/A';
            const dataFim = row.data_fim ? new Date(row.data_fim) : new Date();
            const diffTime = Math.abs(dataFim - new Date(row.data_inicio));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }},
        { header: 'Impacta Férias', accessor: 'impacta_ferias', cell: (row) => (
            <span className={`${styles.impactaBadge} ${row.impacta_ferias ? styles.sim : styles.nao}`}>
                {row.impacta_ferias ? 'Sim' : 'Não'}
            </span>
        )},
        { header: 'Ações', accessor: 'actions', cell: (row) => (
            <div className={styles.actionButtons}>
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => handleEditAfastamento(row)}
                    title="Editar"
                >
                    <Edit3 size={14}/>
                </Button>
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => handleDeleteAfastamento(row.id)}
                    title="Excluir"
                    className={styles.deleteButton}
                >
                    <Trash2 size={14}/>
                </Button>
            </div>
        )}
    ];

    const fetchFuncionario = async () => {
        if (!matricula) return;
        setIsLoading(true);
        try {
            const response = await api.funcionarios.getById(matricula);
            setFuncionario(response.data);
        } catch (error) {
            console.error("Falha ao buscar dados do funcionário:", error);
            alert("Erro ao buscar dados do funcionário.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFuncionario();
    }, [matricula]);

    useEffect(() => {
        setSelectedItems([]);
    }, [activeTab]);
    
    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => {
        setModalState({ type: null, data: null, isOpen: false });
        setSelectedItems([]);
    };
    
    const handleUpdateFuncionario = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await api.funcionarios.update(matricula, data);
            alert('Funcionário atualizado com sucesso!');
            fetchFuncionario();
        } catch (error) {
            console.error("Falha ao atualizar funcionário:", error);
            alert(error.response?.data?.message || "Erro ao atualizar.");
        }
    };
    
    const handleLancarFerias = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {
            ...Object.fromEntries(formData.entries()),
            matricula_funcionario: matricula,
            ano_planejamento: new Date().getFullYear(),
            necessidade_substituicao: event.target.necessidade_substituicao.checked
        };
        try {
            await api.ferias.create(matricula, data);
            alert('Férias lançadas com sucesso!');
            closeModal();
            fetchFuncionario();
        } catch(error) {
            console.error("Falha ao lançar férias:", error);
            alert(error.response?.data?.message || "Erro ao lançar férias.");
        }
    };

    const handleEditarFerias = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        data.necessidade_substituicao = event.target.necessidade_substituicao.checked;
        try {
            await api.ferias.update(modalState.data.id, data);
            alert('Férias atualizadas com sucesso!');
            closeModal();
            fetchFuncionario();
        } catch(error) {
            console.error("Falha ao atualizar férias:", error);
            alert(error.response?.data?.message || "Erro ao atualizar férias.");
        }
    };
    
    const handleLancarAfastamento = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        data.impacta_ferias = !!data.impacta_ferias;
        try {
            await api.afastamentos.create(matricula, data);
            alert('Afastamento lançado com sucesso!');
            closeModal();
            fetchFuncionario();
        } catch(error) {
            console.error("Falha ao lançar afastamento:", error);
            alert(error.response?.data?.message || "Erro ao lançar afastamento.");
        }
    };

    const handleEditarAfastamento = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        data.impacta_ferias = !!data.impacta_ferias;
        try {
            await api.afastamentos.update(modalState.data.id, data);
            alert('Afastamento atualizado com sucesso!');
            closeModal();
            fetchFuncionario();
        } catch(error) {
            console.error("Falha ao atualizar afastamento:", error);
            alert(error.response?.data?.message || "Erro ao atualizar afastamento.");
        }
    };
    
    const handleDeleteFuncionario = async () => {
        try {
            await api.funcionarios.remove(matricula);
            alert('Funcionário excluído com sucesso!');
            router.push('/funcionarios');
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

    // Calculando dias até a data limite
    const diasAteDataLimite = funcionario?.dth_limite_ferias 
        ? Math.floor((new Date(funcionario.dth_limite_ferias) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    if (isLoading) {
        return <div className={styles.loadingContainer}>Carregando dados do funcionário...</div>;
    }

    if (!funcionario) {
        return <div className={styles.loadingContainer}>Funcionário não encontrado ou falha ao carregar.</div>;
    }

    return (
        <>
            <div className={styles.container}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>
                        {funcionario.nome_funcionario?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>{funcionario.nome_funcionario}</h1>
                        <p>
                            Matrícula: {funcionario.matricula} | Status: <span className={styles.statusBadgeAtivo}>{funcionario.status}</span>
                        </p>
                        <div className={styles.headerDetails}>
                            <span><MapPin size={14} /> {funcionario.sigla_local || 'N/A'} - {funcionario.municipio_local_trabalho || 'N/A'}</span>
                            <span><Briefcase size={14} /> {funcionario.categoria || 'N/A'}</span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <ActionMenu items={actionItems} />
                    </div>
                </div>
                
                <div className={styles.cardsGrid}>
                    <Card 
                        icon={<Calendar size={28}/>} 
                        title="Data Limite Férias" 
                        value={
                            <div className={styles.cardWithIndicator}>
                                <RiskIndicator dias={diasAteDataLimite} />
                                <span>{formatDateForDisplay(funcionario.dth_limite_ferias)}</span>
                            </div>
                        }
                        color="var(--cor-feedback-alerta)" 
                    />
                    <Card 
                        icon={<Briefcase size={28}/>} 
                        title="Data Admissão" 
                        value={formatDateForDisplay(funcionario.dth_admissao)} 
                    />
                    <Card 
                        icon={<Calendar size={28}/>} 
                        title="Últimas Férias" 
                        value={formatDateForDisplay(funcionario.historicoFerias && funcionario.historicoFerias.length > 0 ? funcionario.historicoFerias[0].data_fim : null)} 
                    />
                    <Card 
                        icon={<Users size={28}/>} 
                        title="Saldo Dias Férias" 
                        value={funcionario.saldo_dias_ferias || '0'} 
                        color="var(--cor-primaria-medio)"
                    />
                </div>

                <div className={styles.tabs}>
                    <button 
                        onClick={() => setActiveTab('dados')} 
                        className={activeTab === 'dados' ? styles.activeTab : ''}
                    >
                        Dados Completos
                    </button>
                    <button 
                        onClick={() => setActiveTab('ferias')} 
                        className={activeTab === 'ferias' ? styles.activeTab : ''}
                    >
                        Histórico de Férias ({funcionario.historicoFerias?.length || 0})
                    </button>
                    <button 
                        onClick={() => setActiveTab('afastamentos')} 
                        className={activeTab === 'afastamentos' ? styles.activeTab : ''}
                    >
                        Afastamentos ({funcionario.historicoAfastamentos?.length || 0})
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'dados' && (
                        <form className={styles.formContainer} onSubmit={handleUpdateFuncionario}>
                            {/* Seção 1: Informações Básicas */}
                            <h3 className={styles.formSectionTitle}>Informações Básicas</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Matrícula</label>
                                    <input name="matricula" type="text" defaultValue={funcionario.matricula} disabled />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Nome Completo</label>
                                    <input name="nome_funcionario" type="text" defaultValue={funcionario.nome_funcionario} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select name="status" defaultValue={funcionario.status}>
                                        <option>Ativo</option>
                                        <option>Inativo</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Data de Admissão</label>
                                    <input name="dth_admissao" type="date" defaultValue={formatDateForInput(funcionario.dth_admissao)} />
                                </div>
                            </div>

                            {/* Seção 2: Situação Atual e Períodos */}
                            <h3 className={styles.formSectionTitle}>Situação Atual e Períodos</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Situação Atual</label>
                                    <textarea 
                                        name="situacao_ferias_afastamento_hoje" 
                                        defaultValue={funcionario.situacao_ferias_afastamento_hoje}
                                        rows="3"
                                        placeholder="Ex: Trabalhando normalmente, Em férias, Afastado..."
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Próximo Período Aquisitivo</label>
                                    <textarea 
                                        name="proximo_periodo_aquisitivo_texto" 
                                        defaultValue={funcionario.proximo_periodo_aquisitivo_texto}
                                        rows="3"
                                        placeholder="Descrição do próximo período..."
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Início Período Aquisitivo Atual</label>
                                    <input name="periodo_aquisitivo_atual_inicio" type="date" defaultValue={formatDateForInput(funcionario.periodo_aquisitivo_atual_inicio)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fim Período Aquisitivo Atual</label>
                                    <input name="periodo_aquisitivo_atual_fim" type="date" defaultValue={formatDateForInput(funcionario.periodo_aquisitivo_atual_fim)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Data Limite Férias</label>
                                    <input name="dth_limite_ferias" type="date" defaultValue={formatDateForInput(funcionario.dth_limite_ferias)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Última Data Planejada</label>
                                    <input name="ultima_data_planejada" type="date" defaultValue={formatDateForInput(funcionario.ultima_data_planejada)} />
                                </div>
                            </div>

                            {/* Seção 3: Férias e Faltas */}
                            <h3 className={styles.formSectionTitle}>Controle de Férias e Faltas</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Saldo Dias de Férias</label>
                                    <input name="saldo_dias_ferias" type="number" min="0" max="30" defaultValue={funcionario.saldo_dias_ferias} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Faltas Injustificadas no Período</label>
                                    <input name="faltas_injustificadas_periodo" type="number" min="0" defaultValue={funcionario.faltas_injustificadas_periodo} />
                                </div>
                            </div>

                            {/* Seção 4: Cargo e Função */}
                            <h3 className={styles.formSectionTitle}>Cargo e Função</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Categoria/Cargo</label>
                                    <input name="categoria" type="text" defaultValue={funcionario.categoria} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Categoria do Trabalhador</label>
                                    <input name="categoria_trab" type="text" defaultValue={funcionario.categoria_trab} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Salário Base</label>
                                    <input name="salario_base" type="number" step="0.01" defaultValue={funcionario.salario_base} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tipo de Contrato</label>
                                    <input name="contrato" type="text" defaultValue={funcionario.contrato} />
                                </div>
                            </div>

                            {/* Seção 5: Horário e Escala */}
                            <h3 className={styles.formSectionTitle}>Horário e Escala de Trabalho</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Horário</label>
                                    <input name="horario" type="text" defaultValue={funcionario.horario} placeholder="Ex: 08:00 às 17:00" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Escala</label>
                                    <input name="escala" type="text" defaultValue={funcionario.escala} placeholder="Ex: 6x1, 5x2..." />
                                </div>
                            </div>

                            {/* Seção 6: Localização */}
                            <h3 className={styles.formSectionTitle}>Localização</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Estado (UF)</label>
                                    <input name="sigla_local" type="text" defaultValue={funcionario.sigla_local} maxLength="2" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Município Local Trabalho</label>
                                    <input name="municipio_local_trabalho" type="text" defaultValue={funcionario.municipio_local_trabalho} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Local de Trabalho (Descrição)</label>
                                    <input name="local_de_trabalho" type="text" defaultValue={funcionario.local_de_trabalho} />
                                </div>
                            </div>

                            {/* Seção 7: Estrutura Organizacional */}
                            <h3 className={styles.formSectionTitle}>Estrutura Organizacional</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Razão Social Filial</label>
                                    <input name="razao_social_filial" type="text" defaultValue={funcionario.razao_social_filial} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Código Filial</label>
                                    <input name="codigo_filial" type="text" defaultValue={funcionario.codigo_filial} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Gestão Contrato</label>
                                    <input name="des_grupo_contrato" type="text" defaultValue={funcionario.des_grupo_contrato} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>ID Gestão</label>
                                    <input name="id_grupo_contrato" type="number" defaultValue={funcionario.id_grupo_contrato} />
                                </div>
                            </div>

                            {/* Seção 8: Convenção Coletiva */}
                            <h3 className={styles.formSectionTitle}>Convenção Coletiva</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Convenção</label>
                                    <textarea 
                                        name="convencao" 
                                        defaultValue={funcionario.convencao}
                                        rows="4"
                                        placeholder="Descrição da convenção coletiva aplicável..."
                                    />
                                </div>
                            </div>
                            
                            <div className={styles.formActions}>
                                <Button type="submit">Salvar Alterações</Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'ferias' && (
                        <div className={styles.tableSectionContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.tableHeaderLeft}>
                                    {selectedItems.length > 0 && (
                                        <Button 
                                            variant="danger" 
                                            size="small"
                                            onClick={handleBulkDeleteFerias}
                                            icon={<Trash2 size={16}/>}
                                        >
                                            Excluir Selecionados ({selectedItems.length})
                                        </Button>
                                    )}
                                </div>
                                <div className={styles.tableHeaderRight}>
                                    <Button 
                                        icon={<PlusCircle size={16}/>} 
                                        variant="secondary" 
                                        onClick={() => openModal('lancarFerias')}
                                    >
                                        Lançar Férias Manualmente
                                    </Button>
                                </div>
                            </div>
                            {funcionario.historicoFerias && funcionario.historicoFerias.length > 0 ? (
                                <div className={styles.tableWrapper}>
                                    <Table columns={feriasColumns} data={funcionario.historicoFerias || []} />
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <Calendar size={48} />
                                    <h3>Nenhum período de férias encontrado</h3>
                                    <p>Este funcionário ainda não possui histórico de férias registrado.</p>
                                    <Button 
                                        icon={<PlusCircle size={16}/>} 
                                        onClick={() => openModal('lancarFerias')}
                                    >
                                        Lançar Primeira Férias
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'afastamentos' && (
                        <div className={styles.tableSectionContainer}>
                            <div className={styles.tableHeader}>
                                <div className={styles.tableHeaderLeft}>
                                    {selectedItems.length > 0 && (
                                        <Button 
                                            variant="danger" 
                                            size="small"
                                            onClick={handleBulkDeleteAfastamentos}
                                            icon={<Trash2 size={16}/>}
                                        >
                                            Excluir Selecionados ({selectedItems.length})
                                        </Button>
                                    )}
                                </div>
                                <div className={styles.tableHeaderRight}>
                                    <Button 
                                        icon={<PlusCircle size={16}/>} 
                                        variant="secondary" 
                                        onClick={() => openModal('lancarAfastamento')}
                                    >
                                        Registrar Novo Afastamento
                                    </Button>
                                </div>
                            </div>
                            {funcionario.historicoAfastamentos && funcionario.historicoAfastamentos.length > 0 ? (
                                <div className={styles.tableWrapper}>
                                    <Table columns={afastamentosColumns} data={funcionario.historicoAfastamentos || []} />
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <FileWarning size={48} />
                                    <h3>Nenhum afastamento encontrado</h3>
                                    <p>Este funcionário não possui histórico de afastamentos registrado.</p>
                                    <Button 
                                        icon={<PlusCircle size={16}/>} 
                                        onClick={() => openModal('lancarAfastamento')}
                                    >
                                        Registrar Primeiro Afastamento
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={modalState.isOpen} 
                onClose={closeModal} 
                title={
                    modalState.type === 'lancarFerias' ? `Lançar Férias para ${funcionario.nome_funcionario}` :
                    modalState.type === 'editarFerias' ? `Editar Férias - ${funcionario.nome_funcionario}` :
                    modalState.type === 'lancarAfastamento' ? `Lançar Afastamento para ${funcionario.nome_funcionario}` :
                    modalState.type === 'editarAfastamento' ? `Editar Afastamento - ${funcionario.nome_funcionario}` :
                    'Confirmar Exclusão'
                }
            >
                {modalState.type === 'lancarFerias' && (
                    <form className={styles.modalContent} onSubmit={handleLancarFerias}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input name="data_inicio" type="date" required/>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Dias de Férias</label>
                                <input name="qtd_dias" type="number" min="1" max="30" defaultValue="30" required/>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select name="status" defaultValue="Confirmada">
                                    <option value="Confirmada">Confirmada</option>
                                    <option value="Planejada">Planejada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input name="necessidade_substituicao" type="checkbox" value="true"/>
                                    Necessita de Substituição?
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar Férias</Button>
                        </div>
                    </form>
                )}

                {modalState.type === 'editarFerias' && modalState.data && (
                    <form className={styles.modalContent} onSubmit={handleEditarFerias}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input 
                                    name="data_inicio" 
                                    type="date" 
                                    defaultValue={formatDateForInput(modalState.data.data_inicio)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Dias de Férias</label>
                                <input 
                                    name="qtd_dias" 
                                    type="number" 
                                    min="1" 
                                    max="30" 
                                    defaultValue={modalState.data.qtd_dias}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select name="status" defaultValue={modalState.data.status}>
                                    <option value="Confirmada">Confirmada</option>
                                    <option value="Planejada">Planejada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input 
                                        name="necessidade_substituicao" 
                                        type="checkbox" 
                                        defaultChecked={modalState.data.necessidade_substituicao}
                                        value="true"
                                    />
                                    Necessita de Substituição?
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Atualizar Férias</Button>
                        </div>
                    </form>
                )}

                {modalState.type === 'lancarAfastamento' && (
                    <form className={styles.modalContent} onSubmit={handleLancarAfastamento}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Motivo</label>
                                <input name="motivo" type="text" required placeholder="Ex: Licença Médica"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input name="data_inicio" type="date" required/>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Fim</label>
                                <input name="data_fim" type="date" placeholder="Deixe em branco para afastamento em andamento"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input name="impacta_ferias" type="checkbox" defaultChecked value="true"/>
                                    Impacta no cálculo de férias?
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Lançar Afastamento</Button>
                        </div>
                    </form>
                )}

                {modalState.type === 'editarAfastamento' && modalState.data && (
                    <form className={styles.modalContent} onSubmit={handleEditarAfastamento}>
                        <div className={styles.modalFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Motivo</label>
                                <input 
                                    name="motivo" 
                                    type="text" 
                                    defaultValue={modalState.data.motivo}
                                    required 
                                    placeholder="Ex: Licença Médica"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Início</label>
                                <input 
                                    name="data_inicio" 
                                    type="date" 
                                    defaultValue={formatDateForInput(modalState.data.data_inicio)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Fim</label>
                                <input 
                                    name="data_fim" 
                                    type="date" 
                                    defaultValue={formatDateForInput(modalState.data.data_fim)}
                                    placeholder="Deixe em branco para afastamento em andamento"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input 
                                        name="impacta_ferias" 
                                        type="checkbox" 
                                        defaultChecked={modalState.data.impacta_ferias}
                                        value="true"
                                    />
                                    Impacta no cálculo de férias?
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Atualizar Afastamento</Button>
                        </div>
                    </form>
                )}

                {modalState.type === 'excluir' && (
                    <div className={styles.modalContent}>
                        <div className={styles.confirmationIcon}>
                            <AlertTriangle size={48} />
                        </div>
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir <strong>{funcionario.nome_funcionario}</strong>?</p>
                        <p className={styles.warningText}>
                            Esta ação também excluirá todos os registros de férias e afastamentos associados a este funcionário.
                        </p>
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