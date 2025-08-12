'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import Card from '@/components/Card/Card';
import GanttChart from '@/components/GanttChart/GanttChart';
import FilterPanel from '@/components/FilterPanel/FilterPanel';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import { generateAvisoFeriasXLSX } from '@/utils/xlsxGenerator';
import styles from './planejamento.module.css';
import { CalendarPlus, Download, Filter, Search, Edit, Eye, List, GanttChartSquare, FileSpreadsheet, TrendingUp, CalendarCheck } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusClass = styles[`status${status}`] || styles.statusDefault;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
}

export default function PlanejamentoPage() {
    const [planejamento, setPlanejamento] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const fetchPlanejamento = async () => {
        setIsLoading(true);
        try {
            const response = await api.planejamento.getAtivo();
            setPlanejamento(response.data);
        } catch (error) {
            console.error("Falha ao buscar planejamento ativo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanejamento();
    }, []);

    const handleGenerate = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const ano = formData.get('ano');
        const descricao = formData.get('descricao');

        try {
            const resultado = await api.planejamento.gerarDistribuicao(ano, descricao);
            alert(resultado.data.message);
            setIsModalOpen(false);
            fetchPlanejamento(); // Recarrega a lista para mostrar o novo planejamento
        } catch (error) {
            console.error("Falha ao gerar distribuição:", error);
            alert(error.response?.data?.message || "Erro ao gerar distribuição.");
        }
    };

    const getActionItems = (row) => [
        { label: 'Ver Funcionário', icon: <Eye size={16}/>, onClick: () => window.location.href = `/funcionarios/${row.Funcionario.matricula}` },
        { label: 'Editar Férias', icon: <Edit size={16}/>, onClick: () => {} },
        { label: 'Gerar Aviso (XLSX)', icon: <FileSpreadsheet size={16}/>, onClick: () => generateAvisoFeriasXLSX(
            { nome: row.Funcionario.nome_funcionario, periodo_aquisitivo: `${new Date(row.periodo_aquisitivo_inicio).toLocaleDateString()} - ${new Date(row.periodo_aquisitivo_fim).toLocaleDateString()}` }, 
            { inicio: row.data_inicio, fim: row.data_fim, dias: row.qtd_dias }
        )},
    ];

    const columns = [
        { header: 'Funcionário', accessor: 'nome', cell: (row) => row.Funcionario?.nome_funcionario },
        { header: 'Início Férias', accessor: 'data_inicio' },
        { header: 'Fim Férias', accessor: 'data_fim' },
        { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
        { header: 'Ações', accessor: 'acoes', cell: (row) => <ActionMenu items={getActionItems(row)} /> },
    ];

    return (
        <>
            <div className={styles.container}>
                <div className={styles.summaryCards}>
                    <Card icon={<CalendarCheck size={28}/>} title="Total de Férias Planejadas" value={isLoading ? '...' : planejamento.length} />
                    <Card icon={<GanttChartSquare size={28}/>} title="Total de Dias Alocados" value={isLoading ? '...' : planejamento.reduce((acc, curr) => acc + curr.qtd_dias, 0)} />
                    <Card icon={<TrendingUp size={28}/>} title="Mês com Maior Concentração" value="Julho" color="var(--cor-feedback-alerta)" />
                </div>

                <div className={styles.controlsHeader}>
                    <div className={styles.searchContainer}><Search size={20} className={styles.searchIcon} /><input type="text" placeholder="Buscar..." className={styles.searchInput} /></div>
                    <div className={styles.actions}>
                        <div className={styles.viewToggle}>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? styles.activeView : ''} title="Visão de Tabela"><List size={18}/></button>
                            <button onClick={() => setViewMode('calendar')} className={viewMode === 'calendar' ? styles.activeView : ''} title="Visão de Calendário"><GanttChartSquare size={18}/></button>
                        </div>
                        <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setIsFilterOpen(true)}>Filtros</Button>
                        <Button icon={<CalendarPlus size={16} />} onClick={() => setIsModalOpen(true)}>Gerar Distribuição</Button>
                    </div>
                </div>
                
                {viewMode === 'table' ? (
                    <Table columns={columns} data={planejamento} isLoading={isLoading} />
                ) : (
                    <GanttChart data={planejamento.map(p => ({ nome: p.Funcionario.nome_funcionario, inicio: p.data_inicio, fim: p.data_fim }))} />
                )}
            </div>

            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gerar Nova Distribuição de Férias">
                <form className={styles.modalBody} onSubmit={handleGenerate}>
                    <p>Você irá arquivar o planejamento atual e criar um novo. Este processo pode levar alguns minutos.</p>
                    <div className={styles.formGroup}><label htmlFor="ano">Ano</label><input name="ano" type="number" defaultValue={new Date().getFullYear()} className={styles.modalInput} required /></div>
                    <div className={styles.formGroup}><label htmlFor="descricao">Descrição</label><input name="descricao" type="text" placeholder="Ex: Planejamento inicial" className={styles.modalInput} /></div>
                    <div className={styles.modalActions}><Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button type="submit">Confirmar e Gerar</Button></div>
                </form>
            </Modal>
        </>
    );
}