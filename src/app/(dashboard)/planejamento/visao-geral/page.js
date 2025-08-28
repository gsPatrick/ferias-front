// /app/(dashboard)/planejamento/visao-geral/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import styles from './visao-geral.module.css';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { Calendar, Filter, XCircle, User, CalendarDays } from 'lucide-react';
import { eachDayOfInterval, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarView = ({ events, currentDate, handleEventClick }) => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const startingDayOfWeek = start.getDay(); // 0 for Sunday, 1 for Monday...

    return (
        <div className={styles.calendarGrid}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className={styles.dayHeader}>{day}</div>
            ))}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyCell}></div>
            ))}
            {days.map(day => {
                const dayEvents = events.filter(e => 
                    e.data_inicio && e.data_fim && isWithinInterval(day, { start: new Date(e.data_inicio), end: new Date(e.data_fim) })
                );
                return (
                    <div key={day.toString()} className={styles.dayCell}>
                        <span className={styles.dayNumber}>{format(day, 'd')}</span>
                        <div className={styles.eventsContainer}>
                            {dayEvents.map(event => (
                                <div 
                                    key={event.id} 
                                    className={`${styles.eventTag} ${styles[event.tipo.toLowerCase()]}`} 
                                    title={`${event.tipo}: ${event.funcionario}`}
                                    onClick={() => handleEventClick(event)}
                                >
                                    {event.funcionario}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export default function VisaoGeralPage() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filters, setFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({ 
        gestoes: [], municipios: [], categorias: [], tiposContrato: [], estados: [], clientes: [], contratos: [] 
    });
    const [modalState, setModalState] = useState({ isOpen: false, event: null });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await api.funcionarios.getFilterOptions();
                setFilterOptions({
                    gestoes: response.data.gestoes || [],
                    municipios: response.data.municipios || [],
                    categorias: response.data.categorias || [],
                    tiposContrato: response.data.tiposContrato || [],
                    estados: response.data.estados || [],
                    clientes: response.data.clientes || [],
                    contratos: response.data.contratos || [],
                });
            } catch (error) {
                console.error("Erro ao buscar opções de filtro:", error);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const ano = currentDate.getFullYear();
                const mes = currentDate.getMonth() + 1;
                const response = await api.planejamento.getVisaoGeral(ano, mes, filters);
                setEvents(response.data);
            } catch (error) {
                console.error("Erro ao buscar visão geral:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [currentDate, filters]);
    
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClearFilters = () => {
        setFilters({});
        document.getElementById('filter-form').reset();
    };

    const handleEventClick = (event) => {
        setModalState({ isOpen: true, event: event });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, event: null });
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <Calendar size={32} />
                        <h1>Visão Geral do Planejamento</h1>
                    </div>
                </div>

                <div className={styles.controlsAndFilters}>
                    <div className={styles.monthNavigator}>
                        <Button variant="secondary" onClick={handlePrevMonth}>&lt;</Button>
                        <h2 className={styles.currentMonth}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                        <Button variant="secondary" onClick={handleNextMonth}>&gt;</Button>
                    </div>
                    <form id="filter-form" className={styles.filterGrid}>
                        <select name="cliente" onChange={handleFilterChange} defaultValue=""><option value="">Todo Cliente</option>{filterOptions.clientes.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="contrato" onChange={handleFilterChange} defaultValue=""><option value="">Todo Contrato</option>{filterOptions.contratos.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="grupoContrato" onChange={handleFilterChange} defaultValue=""><option value="">Toda Gestão</option>{filterOptions.gestoes.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="municipio" onChange={handleFilterChange} defaultValue=""><option value="">Todo Município</option>{filterOptions.municipios.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="categoria" onChange={handleFilterChange} defaultValue=""><option value="">Toda Categoria</option>{filterOptions.categorias.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="tipoContrato" onChange={handleFilterChange} defaultValue=""><option value="">Todo Tipo Contrato</option>{filterOptions.tiposContrato.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <select name="estado" onChange={handleFilterChange} defaultValue=""><option value="">Todo Estado</option>{filterOptions.estados.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <Button type="button" variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar</Button>
                    </form>
                </div>

                <div className={styles.calendarWrapper}>
                    {isLoading ? (
                        <div className={styles.loadingState}>Carregando calendário...</div>
                    ) : (
                        <CalendarView events={events} currentDate={currentDate} handleEventClick={handleEventClick} />
                    )}
                </div>
            </div>
            
            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={`Detalhes do Evento - ${modalState.event?.tipo}`}
            >
                {modalState.event && (
                    <div className={styles.modalContent}>
                        <div className={styles.modalDetailItem}>
                            <User size={20} />
                            <div>
                                <span className={styles.modalLabel}>Funcionário</span>
                                <span className={styles.modalValue}>{modalState.event.funcionario}</span>
                            </div>
                        </div>
                        <div className={styles.modalDetailItem}>
                            <span className={styles.modalLabel}>Matrícula</span>
                            <span className={styles.modalValue}>{modalState.event.matricula}</span>
                        </div>
                        <div className={styles.modalDetailItem}>
                            <CalendarDays size={20} />
                            <div>
                                <span className={styles.modalLabel}>Período</span>
                                <span className={styles.modalValue}>
                                    {format(new Date(modalState.event.data_inicio), 'dd/MM/yyyy')} até {format(new Date(modalState.event.data_fim), 'dd/MM/yyyy')}
                                </span>
                            </div>
                        </div>
                        <div className={styles.modalDetailItem}>
                            <span className={styles.modalLabel}>{modalState.event.tipo === 'Férias' ? 'Status' : 'Motivo'}</span>
                            <span className={styles.modalValue}>{modalState.event.status}</span>
                        </div>
                        <div className={styles.modalActions}>
                            <Link href={`/funcionarios/${modalState.event.matricula}`} passHref>
                                <Button variant="secondary" onClick={closeModal}>Ver Perfil Completo</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}