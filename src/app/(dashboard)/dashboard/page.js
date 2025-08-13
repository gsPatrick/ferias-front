'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import Card from '@/components/Card/Card';
import Modal from '@/components/Modal/Modal';
import Table from '@/components/Table/Table';
import CoverageChart from '@/components/Charts/CoverageChart';
import ActionPanel from '@/components/ActionPanel/ActionPanel';
import styles from './dashboard.module.css';
import { 
    Users, 
    CalendarCheck, 
    AlertTriangle, 
    TrendingUp, 
    CalendarPlus, 
    Upload, 
    Download,
    FileText,
    Settings,
    BarChart3,
    Clock
} from 'lucide-react';

// Dados que não vêm da API (links, colunas, gráfico mockado)


const vencimentoColumns = [
    { key: 'funcionario', label: 'Funcionário' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'diasRestantes', label: 'Dias Restantes' }
];

const mockGraficoCobertura = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [{
        label: 'Colaboradores em Férias',
        data: [12, 8, 15, 22, 18, 25, 30, 28, 20, 16, 10, 14]
    }]
};

export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', columns: [], data: [] });

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await api.dashboard.getSummary();
                setSummaryData(response.data);
            } catch (error) {
                console.error("Falha ao buscar dados do dashboard:", error);
                setError("Erro ao carregar dados do dashboard. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const handleCardClick = (type) => {
        // Implementar lógica para abrir modal com dados específicos
        // Por enquanto, mantém a estrutura existente
        switch (type) {
            case 'vencimentos':
                setModal({
                    isOpen: true,
                    title: 'Vencimentos Próximos',
                    columns: vencimentoColumns,
                    data: [] // Aqui viriam os dados da API futuramente
                });
                break;
            default:
                break;
        }
    };

    const formatValue = (value, defaultValue = '0') => {
        if (isLoading) return '...';
        if (error) return '--';
        return value ?? defaultValue;
    };

    const getStatusColor = () => {
        if (error) return '#ef4444';
        if (isLoading) return '#6b7280';
        return 'var(--cor-primaria-medio)';
    };

    return (
        <>
            <div className={styles.container}>
                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--raio-borda)',
                        padding: '1rem',
                        color: '#dc2626',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}
                
                <div className={styles.cardsGrid}>
                    <Card 
                        icon={<Users size={32} />}
                        title="Total de Funcionários Ativos"
                        value={formatValue(summaryData?.totalFuncionarios)}
                        color={getStatusColor()}
                        onClick={() => window.location.href = '/funcionarios'}
                        isLoading={isLoading}
                    />
                    <Card 
                        icon={<CalendarCheck size={32} />}
                        title="Planejamento Ativo"
                        value={formatValue(summaryData?.planejamentoAtivo, 'N/A')}
                        color="var(--cor-feedback-sucesso)"
                        isLoading={isLoading}
                    />
                    <Card 
                        icon={<AlertTriangle size={32} />}
                        title="Vencimentos em 90 dias"
                        value={formatValue(summaryData?.vencimentosProximos)}
                        color="var(--cor-feedback-alerta)"
                        onClick={() => handleCardClick('vencimentos')}
                        isLoading={isLoading}
                    />
                    <Card 
                        icon={<TrendingUp size={32} />}
                        title="Cobertura (Mês Atual)"
                        value={formatValue('85%', '85%')} // Este dado ainda é mockado
                        color="#8B5CF6"
                        isLoading={isLoading}
                    />
                </div>
                
                <div className={styles.mainContent}>
                    <div className={styles.actionPanelColumn}>
                        <ActionPanel 
                            items={summaryData?.actionItems || []} 
                            isLoading={isLoading}
                        />
                    </div>
                    
                    <div className={styles.rightColumn}>
                        <div className={styles.chartSection}>
                            <h3>
                                <BarChart3 size={24} style={{ 
                                    display: 'inline', 
                                    marginRight: '0.5rem', 
                                    verticalAlign: 'middle' 
                                }} />
                                Colaboradores em Férias por Mês
                            </h3>
                            <CoverageChart 
                                data={mockGraficoCobertura} 
                                isLoading={isLoading}
                            />
                        </div>
                        
                
                    </div>
                </div>
            </div>

            <Modal 
                isOpen={modal.isOpen} 
                onClose={() => setModal({ ...modal, isOpen: false })} 
                title={modal.title}
            >
                <Table 
                    columns={vencimentoColumns} 
                    data={modal.data} 
                    emptyMessage="Nenhum vencimento encontrado"
                />
            </Modal>
        </>
    );
}