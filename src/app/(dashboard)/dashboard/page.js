// src/app/(dashboard)/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // <<< 1. IMPORTAR O ROUTER
import Link from 'next/link';
import api from '@/services/api';
import Card from '@/components/Card/Card';
import DashboardChart from './DashboardChart';
import Button from '@/components/Button/Button';
import styles from './dashboard.module.css';
import { Users, CalendarCheck, Percent, AlertTriangle, AlertOctagon, Info, CalendarX, RefreshCw } from 'lucide-react';

// --- COMPONENTE INTERNO PARA ITENS DE AÇÃO ---
const ActionItem = ({ item }) => {
    // ... (componente interno inalterado)
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const router = useRouter(); // <<< 2. INICIALIZAR O ROUTER

    // Função para buscar os dados do dashboard
    const fetchSummaryData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.dashboard.getSummary();
            setSummaryData(response.data);
        } catch (err) {
            console.error("Falha ao buscar dados do dashboard:", err);
            setError("Não foi possível carregar os dados do painel. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaryData();
    }, []);

    // ======================================================================
    // CORREÇÃO: Função agora redireciona para a página de importação.
    // ======================================================================
    const handleGerarPlanejamento = () => {
        // Simplesmente navega para a página de importação.
        // O nome da rota pode variar, ajuste se necessário (ex: '/importar-planilha').
        router.push('/importacao'); 
    };

    // Renderização condicional de Loading, Erro ou Conteúdo
    if (isLoading) {
        return <div className={styles.loadingContainer}>Carregando painel de controle...</div>;
    }

    if (error) {
        return <div className={styles.errorContainer}>{error}</div>;
    }

    if (!summaryData) {
        return <div className={styles.loadingContainer}>Nenhum dado disponível.</div>;
    }

    const { cardsPrincipais, itensDeAcao, distribuicaoMensal } = summaryData;
    const hasChartData = distribuicaoMensal && distribuicaoMensal.some(m => m.total > 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Painel de Controle</h1>
                <Button 
                    onClick={handleGerarPlanejamento} 
                    icon={<RefreshCw size={16} />}
                >
                    Gerar Novo Planejamento
                </Button>
            </div>
            
            <div className={styles.cardsGrid}>
                <Card 
                    icon={<Users size={28} />} 
                    title="Total de Funcionários Ativos" 
                    value={cardsPrincipais.totalFuncionarios} 
                />
                <Card 
                    icon={<CalendarCheck size={28} />} 
                    title="Planejamento Ativo" 
                    value={cardsPrincipais.planejamentoAtivo}
                />
                <Card 
                    icon={<Percent size={28} />} 
                    title="% do Quadro Planejado" 
                    value={cardsPrincipais.percentualPlanejado}
                    color="var(--cor-sucesso)"
                />
                <Card 
                    icon={<Users size={28} />} 
                    title="Funcionários Planejados" 
                    value={cardsPrincipais.funcionariosComFeriasPlanejadas} 
                />
            </div>
            
            <div className={styles.mainContentGrid}>
                <div className={styles.chartSection}>
                    {hasChartData ? (
                        <DashboardChart data={distribuicaoMensal} />
                    ) : (
                        <div className={styles.chartPlaceholder}>
                            <h3 className={styles.sectionTitle}>Distribuição de Férias no Ano</h3>
                            <div className={styles.placeholderContent}>
                                <CalendarX size={48} />
                                <p>Nenhum dado de férias encontrado no planejamento ativo para o ano atual.</p>
                                <Button onClick={handleGerarPlanejamento}>
                                    Importar planilha para gerar planejamento
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.actionsSection}>
                    <h3 className={styles.sectionTitle}>Pontos de Atenção</h3>
                    <div className={styles.actionsList}>
                        {itensDeAcao && itensDeAcao.map((item, index) => (
                           <ActionItem key={index} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}