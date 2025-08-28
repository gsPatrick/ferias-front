// src/app/(dashboard)/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Card from '@/components/Card/Card';
import Modal from '@/components/Modal/Modal';
import DashboardChart from './DashboardChart';
import Button from '@/components/Button/Button';
import styles from './dashboard.module.css';
import { Users, CalendarCheck, Percent, AlertTriangle, AlertOctagon, Info, CalendarX, RefreshCw, UserCheck } from 'lucide-react';

// --- COMPONENTE INTERNO PARA PONTOS DE ATENÇÃO ---
const ActionItem = ({ item }) => {
    const getIcon = () => {
        switch (item.variant) {
            case 'danger': return <AlertTriangle className={styles.actionIconDanger} />;
            case 'warning': return <AlertOctagon className={styles.actionIconWarning} />;
            case 'info': return <Info className={styles.actionIconInfo} />;
            default: return <UserCheck className={styles.actionIconNeutral} />; // Ícone genérico para "reprogramação"
        }
    };
    return (
        <Link href={item.link || '#'} className={`${styles.actionItem} ${styles[item.variant]}`}>
            <div className={styles.actionInfo}>
                {getIcon()}
                <span className={styles.actionTitle}>{item.title}</span>
            </div>
            <span className={styles.actionCount}>{item.count}</span>
        </Link>
    );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planejados, setPlanejados] = useState([]);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    const fetchSummaryData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // ==========================================================
            // ALTERADO: Busca os dados do resumo e do novo alerta em paralelo
            // ==========================================================
            const [summaryResponse, reprogramacaoResponse] = await Promise.all([
                api.dashboard.getSummary(),
                api.alertas.getNecessitaReprogramacao() // Padrão de 30 dias
            ]);

            const summary = summaryResponse.data;
            const necessitamReprogramacao = reprogramacaoResponse.data;

            // Adiciona o novo item de ação à lista existente
            if (necessitamReprogramacao && necessitamReprogramacao.length > 0) {
                summary.itensDeAcao.push({
                    title: 'Necessitam Reprogramação',
                    count: necessitamReprogramacao.length,
                    link: '/funcionarios?filtro=reprogramar',
                    variant: 'warning' // 'warning' para indicar que requer atenção
                });
            }

            setSummaryData(summary);
        } catch (err) {
            console.error("Falha ao buscar dados do dashboard:", err);
            setError("Não foi possível carregar os dados do painel.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaryData();
    }, []);

    const handleGerarPlanejamento = () => {
        router.push('/importacao'); 
    };

    const handleOpenPlanejadosModal = async () => {
        setIsModalOpen(true);
        setIsLoadingModal(true);
        try {
            const response = await api.ferias.getPlanejamentoAtivo({ ano: new Date().getFullYear(), limit: 10000 });
            
            const funcionariosUnicos = response.data.data.reduce((acc, ferias) => {
                if (ferias.Funcionario && !acc.some(f => f.matricula === ferias.Funcionario.matricula)) {
                    acc.push(ferias.Funcionario);
                }
                return acc;
            }, []);
            setPlanejados(funcionariosUnicos);
        } catch (error) {
            console.error("Erro ao buscar funcionários planejados:", error);
            alert("Não foi possível carregar a lista de funcionários.");
        } finally {
            setIsLoadingModal(false);
        }
    };

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
        <>
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
                        color="var(--cor-primaria-medio)"
                    />
                    <Card 
                        icon={<CalendarCheck size={28} />} 
                        title="Planejamento Ativo" 
                        value={cardsPrincipais.planejamentoAtivo}
                        color="var(--cor-primaria-profundo)"
                    />
                    <Card 
                        icon={<Percent size={28} />} 
                        title="% do Quadro Planejado" 
                        value={cardsPrincipais.percentualPlanejado}
                        color="var(--cor-feedback-sucesso)"
                    />
                    <Card 
                        icon={<Users size={28} />} 
                        title="Funcionários Planejados" 
                        value={cardsPrincipais.funcionariosComFeriasPlanejadas}
                        color="var(--cor-feedback-info)"
                        onClick={handleOpenPlanejadosModal}
                    />
                </div>
                
                <div className={styles.mainContentGrid}>
                    <div className={styles.chartSection}>
                        {hasChartData ? (
                            <DashboardChart data={distribuicaoMensal} />
                        ) : (
                            <div className={styles.chartPlaceholder}>
                                 <div className={styles.placeholderContent}>
                                    <CalendarX size={48} />
                                    <h3>Nenhum dado de férias para exibir</h3>
                                    <p>Importe uma planilha para gerar um planejamento e visualizar a distribuição anual aqui.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.actionsSection}>
                        <h3 className={styles.sectionTitle}>Pontos de Atenção</h3>
                        <div className={styles.actionsList}>
                            {itensDeAcao && itensDeAcao.length > 0 ? (
                                itensDeAcao.map((item, index) => (
                                   <ActionItem key={index} item={item} />
                                ))
                            ) : (
                                <p className={styles.noActions}>Nenhuma ação pendente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Funcionários com Férias Planejadas"
            >
                {isLoadingModal ? (
                    <p>Carregando lista...</p>
                ) : planejados.length > 0 ? (
                    <ul className={styles.modalList}>
                        {planejados.map(func => (
                            <li key={func.matricula} className={styles.modalListItem}>
                                <Link href={`/funcionarios/${func.matricula}`} onClick={() => setIsModalOpen(false)}>
                                    <span className={styles.modalListName}>{func.nome_funcionario}</span>
                                    <span className={styles.modalListMatricula}>Matrícula: {func.matricula}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhum funcionário encontrado no planejamento ativo.</p>
                )}
            </Modal>
        </>
    );
}