// src/app/(dashboard)/planejamento/page.js
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import api from '@/services/api';
import styles from './planejamento.module.css';
import { Calendar, Briefcase, ChevronLeft, ChevronRight, User, Filter } from 'lucide-react';
import Link from 'next/link';
import FilterPanel from '@/components/FilterPanel/FilterPanel'; // Importa o painel de filtros
import Button from '@/components/Button/Button'; // Importa o componente de botão

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

function PlanejamentoComponent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dataReferencia, setDataReferencia] = useState(new Date());
    const [isFilterOpen, setIsFilterOpen] = useState(false); // Estado para o painel de filtros
    const [activeFilters, setActiveFilters] = useState({}); // Estado para os filtros ativos

    const ano = dataReferencia.getFullYear();
    const mes = dataReferencia.getMonth() + 1;

    useEffect(() => {
        // Carrega os filtros da URL quando o componente monta
        const currentFilters = {};
        for (const [key, value] of searchParams.entries()) {
            currentFilters[key] = value;
        }
        setActiveFilters(currentFilters);
        
        const fetchVisaoGeral = async () => {
            setIsLoading(true);
            try {
                // Passa os filtros ativos para a API
                const response = await api.planejamento.getVisaoGeral(ano, mes, currentFilters);
                setEventos(response.data);
            } catch (error) {
                console.error("Falha ao buscar visão geral do planejamento:", error);
                alert("Erro ao buscar dados do planejamento.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisaoGeral();
    }, [ano, mes, searchParams]); // Adiciona searchParams como dependência

    const handleApplyFilters = (filters) => {
        const current = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) current.set(key, value);
        });
        router.push(`${pathname}?${current.toString()}`);
        setIsFilterOpen(false);
    };

    const handleMesAnterior = () => {
        setDataReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleMesSeguinte = () => {
        setDataReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const eventosAgrupadosPorDia = useMemo(() => {
        const grouped = {};
        eventos.forEach(evento => {
            const dia = new Date(evento.data_inicio).getUTCDate();
            if (!grouped[dia]) grouped[dia] = [];
            grouped[dia].push(evento);
        });
        return grouped;
    }, [eventos]);

    const nomeMesAtual = dataReferencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Visão Geral do Planejamento</h1>
                    <div className={styles.controls}>
                        <div className={styles.dateSelector}>
                            <button onClick={handleMesAnterior} className={styles.navButton}><ChevronLeft /></button>
                            <span className={styles.currentMonth}>{nomeMesAtual}</span>
                            <button onClick={handleMesSeguinte} className={styles.navButton}><ChevronRight /></button>
                        </div>
                        <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setIsFilterOpen(true)}>
                            Filtros
                        </Button>
                    </div>
                </div>

                <div className={styles.timelineContainer}>
                    {isLoading ? (
                        <div className={styles.loadingState}>Carregando eventos...</div>
                    ) : Object.keys(eventosAgrupadosPorDia).length === 0 ? (
                        <div className={styles.noEvents}>Nenhuma férias ou afastamento encontrado para este mês com os filtros aplicados.</div>
                    ) : (
                        Object.entries(eventosAgrupadosPorDia).sort((a,b) => a[0] - b[0]).map(([dia, eventosDoDia]) => (
                            <div key={dia} className={styles.dayGroup}>
                                <div className={styles.dayMarker}>
                                    <div className={styles.dayNumber}>{dia}</div>
                                </div>
                                <div className={styles.eventsList}>
                                    {eventosDoDia.map(evento => (
                                        <div key={evento.id} className={`${styles.eventCard} ${styles[evento.tipo.toLowerCase()]}`}>
                                            <div className={styles.eventIcon}>
                                                {evento.tipo === 'Férias' ? <Calendar size={20} /> : <Briefcase size={20} />}
                                            </div>
                                            <div className={styles.eventDetails}>
                                                <div className={styles.eventHeader}>
                                                    <span className={styles.eventType}>{evento.tipo}</span>
                                                    <span className={styles.eventStatus}>{evento.status}</span>
                                                </div>
                                                <Link href={`/funcionarios/${evento.matricula}`} className={styles.employeeName}>
                                                    <User size={14} /> {evento.funcionario}
                                                </Link>
                                                <p className={styles.eventDates}>
                                                    {formatDateForDisplay(evento.data_inicio)} até {formatDateForDisplay(evento.data_fim)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <FilterPanel 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)} 
                onApplyFilters={handleApplyFilters} 
                initialFilters={activeFilters}
            />
        </>
    );
}

export default function PlanejamentoPage() {
    return (
        <Suspense fallback={<div>Carregando planejamento...</div>}>
            <PlanejamentoComponent />
        </Suspense>
    );
}