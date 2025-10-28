// src/app/(dashboard)/dashboard/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Card from '@/components/Card/Card';
import Modal from '@/components/Modal/Modal';
import DashboardChart from './DashboardChart';
import Button from '@/components/Button/Button';
import FilterPanel from '@/components/FilterPanelDashboard/FilterPanel';
import styles from './dashboard.module.css';
import { Users, CalendarCheck, Percent, AlertTriangle, AlertOctagon, Info, CalendarX, RefreshCw, UserCheck, SlidersHorizontal } from 'lucide-react';

// --- COMPONENTE MODAL DE LISTA DE FUNCIONÁRIOS ---
const EmployeeListModal = ({ isOpen, onClose, modalData }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalData.title || 'Lista de Funcionários'}>
            {modalData.isLoading ? <p>Carregando...</p> : modalData.funcionarios?.length > 0 ? (
                <ul className={styles.modalList}>
                    {modalData.funcionarios.map(func => (
                        <li key={func.matricula} className={styles.modalListItem}>
                            <Link href={`/funcionarios/${func.matricula}`} onClick={onClose}>
                                <span className={styles.modalListName}>{func.nome_funcionario}</span>
                                <span className={styles.modalListMatricula}>Matrícula: {func.matricula}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : <p>Nenhum funcionário encontrado para esta categoria.</p>}
        </Modal>
    );
};

// --- COMPONENTE DE ITEM DE AÇÃO (PONTOS DE ATENÇÃO) ---
const ActionItem = ({ item, onClick }) => {
    const getIcon = () => {
        switch (item.variant) {
            case 'danger': return <AlertTriangle className={styles.actionIconDanger} />;
            case 'warning': return <AlertOctagon className={styles.actionIconWarning} />;
            case 'info': return <Info className={styles.actionIconInfo} />;
            default: return <UserCheck className={styles.actionIconNeutral} />;
        }
    };
    return (
        <div onClick={() => onClick(item.title, item.funcionarios)} className={`${styles.actionItem} ${styles[item.variant]}`}>
            <div className={styles.actionInfo}>{getIcon()}<span className={styles.actionTitle}>{item.title}</span></div>
            <span className={styles.actionCount}>{item.count}</span>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [filters, setFilters] = useState({});
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({});

    const [modalData, setModalData] = useState({ isOpen: false, title: '', funcionarios: [], isLoading: false });

    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await api.funcionarios.getFilterOptions();
            setFilterOptions(response.data);
        } catch (err) { console.error("Falha ao buscar opções de filtro:", err); }
    }, []);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        setAvailableYears(Array.from({ length: 11 }, (_, i) => currentYear - 5 + i));
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    const fetchSummaryData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = { year: selectedYear, ...filters };
            const [summaryResponse, reprogramacaoResponse, retornosResponse] = await Promise.all([
                api.dashboard.getSummary(params),
                api.alertas.getNecessitaReprogramacao(),
                api.alertas.getRetornosProximos(30)
            ]);

            const summary = summaryResponse.data;
            summary.itensDeAcao = summary.itensDeAcao || [];

            const necessitamReprogramacao = reprogramacaoResponse.data;
            if (necessitamReprogramacao?.length > 0) {
                summary.itensDeAcao.push({ title: 'Necessitam Reprogramação', count: necessitamReprogramacao.length, link: '/funcionarios?filtro=reprogramar', variant: 'warning', funcionarios: necessitamReprogramacao });
            }

            const retornosProximos = retornosResponse.data;
            if (retornosProximos?.length > 0) {
                summary.itensDeAcao.push({ title: 'Retornos Próximos (30d)', count: retornosProximos.length, link: '/afastados', variant: 'info', funcionarios: retornosProximos });
            }
            
            setSummaryData(summary);
        } catch (err) {
            console.error("Falha ao buscar dados do dashboard:", err);
            setError("Não foi possível carregar os dados do painel para os filtros selecionados.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, filters]);

    useEffect(() => { fetchSummaryData(); }, [fetchSummaryData]);

    const handleApplyFilters = (newFilters) => { setFilters(newFilters); };
    
    const openEmployeeModal = (title, funcionarios) => {
        if (!funcionarios || funcionarios.length === 0) return;
        setModalData({ isOpen: true, title, funcionarios, isLoading: false });
    };

    if (isLoading && !summaryData) { return <div className={styles.loadingContainer}>Carregando painel de controle...</div>; }
    if (error) { return <div className={styles.errorContainer}>{error}</div>; }

    const { cardsPrincipais, itensDeAcao, distribuicaoMensal } = summaryData || {};
    const hasChartData = distribuicaoMensal && distribuicaoMensal.some(m => m.total > 0);

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Painel de Controle</h1>
                    <div className={styles.headerActions}>
                        <div className={styles.yearSelectorContainer}>
                            <label htmlFor="year-select">Ano:</label>
                            <select id="year-select" className={styles.yearSelector} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} disabled={isLoading}>
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <Button variant="secondary" icon={<SlidersHorizontal size={16}/>} onClick={() => setIsFilterPanelOpen(true)}>Filtros</Button>
                        <Button onClick={() => router.push('/importacao')} icon={<RefreshCw size={16} />} disabled={isLoading}>Novo Planejamento</Button>
                    </div>
                </div>
                
                {isLoading && <div className={styles.loadingOverlay}>Atualizando dados...</div>}
                
                <div className={styles.cardsGrid}>
                    <Card icon={<Users size={28} />} title="Funcionários Filtrados" value={cardsPrincipais?.totalFuncionarios?.count ?? '0'} color="var(--cor-primaria-medio)" onClick={() => openEmployeeModal('Funcionários Filtrados', cardsPrincipais?.totalFuncionarios?.funcionarios)} />
                    <Card icon={<CalendarCheck size={28} />} title="Planejamento" value={cardsPrincipais?.planejamentoAtivo ?? 'Nenhum'} color="var(--cor-primaria-profundo)" />
                    <Card icon={<Percent size={28} />} title="% do Quadro Planejado" value={cardsPrincipais?.percentualPlanejado ?? '0%'} color="var(--cor-feedback-sucesso)" />
                    <Card icon={<Users size={28} />} title="Funcionários Planejados" value={cardsPrincipais?.funcionariosComFeriasPlanejadas?.count ?? '0'} color="var(--cor-feedback-info)" onClick={() => openEmployeeModal(`Funcionários Planejados (${selectedYear})`, cardsPrincipais?.funcionariosComFeriasPlanejadas?.funcionarios)} />
                </div>
                
                <div className={styles.mainContentGrid}>
                    <div className={styles.chartSection}>
                        {hasChartData ? <DashboardChart data={distribuicaoMensal} /> : (
                            <div className={styles.chartPlaceholder}>
                                 <div className={styles.placeholderContent}>
                                    <CalendarX size={48} />
                                    <h3>Nenhum dado de férias para exibir</h3>
                                    <p>Não há férias planejadas para o ano de {selectedYear} com os filtros atuais.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.actionsSection}>
                        <h3 className={styles.sectionTitle}>Pontos de Atenção</h3>
                        <div className={styles.actionsList}>
                            {itensDeAcao && itensDeAcao.length > 0 ? (
                                itensDeAcao.sort((a, b) => a.title.localeCompare(b.title)).map((item, index) => <ActionItem key={index} item={item} onClick={openEmployeeModal} />)
                            ) : <p className={styles.noActions}>Nenhuma ação pendente.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            <EmployeeListModal isOpen={modalData.isOpen} onClose={() => setModalData({ isOpen: false, title: '', funcionarios: [] })} modalData={modalData} />
            
            <FilterPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} onApplyFilters={handleApplyFilters} initialFilters={filters} filterOptions={filterOptions} />
        </>
    );
}