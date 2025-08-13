// src/app/(dashboard)/planejamento/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import styles from './planejamento.module.css'; // Criaremos este CSS
import { Calendar, Briefcase, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function PlanejamentoPage() {
    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dataReferencia, setDataReferencia] = useState(new Date());

    const ano = dataReferencia.getFullYear();
    const mes = dataReferencia.getMonth() + 1; // getMonth é 0-indexado

    useEffect(() => {
        const fetchVisaoGeral = async () => {
            setIsLoading(true);
            try {
                const response = await api.planejamento.getVisaoGeral(ano, mes);
                setEventos(response.data);
            } catch (error) {
                console.error("Falha ao buscar visão geral do planejamento:", error);
                alert("Erro ao buscar dados do planejamento.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisaoGeral();
    }, [ano, mes]);

    const handleMesAnterior = () => {
        setDataReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleMesSeguinte = () => {
        setDataReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    // Agrupa os eventos por dia para facilitar a renderização
    const eventosAgrupadosPorDia = useMemo(() => {
        const grouped = {};
        eventos.forEach(evento => {
            const dia = new Date(evento.data_inicio).getUTCDate();
            if (!grouped[dia]) {
                grouped[dia] = [];
            }
            grouped[dia].push(evento);
        });
        return grouped;
    }, [eventos]);

    const nomeMesAtual = dataReferencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Visão Geral do Planejamento</h1>
                <div className={styles.dateSelector}>
                    <button onClick={handleMesAnterior} className={styles.navButton}><ChevronLeft /></button>
                    <span className={styles.currentMonth}>{nomeMesAtual}</span>
                    <button onClick={handleMesSeguinte} className={styles.navButton}><ChevronRight /></button>
                </div>
            </div>

            <div className={styles.timelineContainer}>
                {isLoading ? (
                    <p>Carregando eventos...</p>
                ) : Object.keys(eventosAgrupadosPorDia).length === 0 ? (
                    <p className={styles.noEvents}>Nenhuma férias ou afastamento encontrado para este mês.</p>
                ) : (
                    Object.entries(eventosAgrupadosPorDia).map(([dia, eventosDoDia]) => (
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
    );
}