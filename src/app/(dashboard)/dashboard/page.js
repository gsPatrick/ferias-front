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
import { Users, CalendarCheck, AlertTriangle, TrendingUp, CalendarPlus, Upload, Download } from 'lucide-react';

// Dados que não vêm da API (links, colunas, gráfico mockado)
const quickLinks = [ /* ... */ ];
const vencimentoColumns = [ /* ... */ ];
const mockGraficoCobertura = { /* ... */ };

export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, title: '', columns: [], data: [] });

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.dashboard.getSummary();
                setSummaryData(response.data);
            } catch (error) {
                console.error("Falha ao buscar dados do dashboard:", error);
                // Aqui você pode mostrar uma mensagem de erro para o usuário
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, []); // Array vazio significa que roda apenas uma vez, quando o componente monta

    return (
        <>
            <div className={styles.container}>
                <div className={styles.cardsGrid}>
                    <Card 
                        icon={<Users size={32} />}
                        title="Total de Funcionários Ativos"
                        value={isLoading ? '...' : summaryData?.totalFuncionarios ?? '0'}
                        color="var(--cor-primaria-medio)"
                        onClick={() => window.location.href = '/funcionarios'}
                    />
                    <Card 
                        icon={<CalendarCheck size={32} />}
                        title="Planejamento Ativo"
                        value={isLoading ? '...' : summaryData?.planejamentoAtivo ?? 'N/A'}
                        color="var(--cor-feedback-sucesso)"
                    />
                    <Card 
                        icon={<AlertTriangle size={32} />}
                        title="Vencimentos em 90 dias"
                        value={isLoading ? '...' : summaryData?.vencimentosProximos ?? '0'}
                        color="var(--cor-feedback-alerta)"
                        // onClick={() => handleCardClick('vencimentos')} // Futuramente, este modal também usaria dados da API
                    />
                    <Card 
                        icon={<TrendingUp size={32} />}
                        title="Cobertura (Mês Atual)"
                        value={isLoading ? '...' : '85%'} // Este dado ainda é mockado
                        color="#8B5CF6"
                    />
                </div>
                
                <div className={styles.mainContent}>
                    <div className={styles.actionPanelColumn}>
                        <ActionPanel items={summaryData?.actionItems || []} />
                    </div>
                    
                    <div className={styles.rightColumn}>
                        <div className={styles.chartSection}>
                            <h3>Colaboradores em Férias por Mês</h3>
                            <CoverageChart data={mockGraficoCobertura} />
                        </div>
                        <div className={styles.quickLinksSection}>
                            <h3>Links Rápidos</h3>
                            <div className={styles.linksContainer}>
                                {quickLinks.map(link => (
                                    <Link key={link.label} href={link.href} className={styles.quickLink}>
                                        {link.icon}<span>{link.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title}>
                <Table columns={vencimentoColumns} data={modal.data} />
            </Modal>
        </>
    );
}