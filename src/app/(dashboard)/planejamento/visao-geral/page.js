// /app/(dashboard)/planejamento/visao-geral/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Table from '@/components/Table/Table';
import Pagination from '@/components/Pagination/Pagination';
import styles from './visao-geral.module.css';
import { Users, Search, XCircle } from 'lucide-react';

// --- HELPERS ---

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
};

const getDynamicOptions = (data, key) => {
    if (!data) return [];
    const uniqueValues = new Set(
        data.map(item => item.Funcionario?.[key]).filter(Boolean)
    );
    return Array.from(uniqueValues).sort((a, b) => a.localeCompare(b));
};

// --- COMPONENTE PRINCIPAL ---

export default function VisaoGeralTabelaPage() {
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const itemsPerPage = 20;

    const fetchAllData = useCallback(async (year) => {
        setIsLoading(true);
        try {
            const eventsResponse = await api.planejamento.getVisaoGeral(year);
            setAllEvents(eventsResponse.data || []);
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
            setAllEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData(currentYear);
    }, [currentYear, fetchAllData]);

    const filterOptions = useMemo(() => {
        if (isLoading || allEvents.length === 0) {
            return { gestoes: [], municipios: [], categorias: [], tiposContrato: [], estados: [], clientes: [], contratos: [] };
        }
        return {
            gestoes: getDynamicOptions(allEvents, 'des_grupo_contrato'),
            municipios: getDynamicOptions(allEvents, 'municipio_local_trabalho'),
            estados: getDynamicOptions(allEvents, 'sigla_local'),
            clientes: getDynamicOptions(allEvents, 'cliente'),
        };
    }, [allEvents, isLoading]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const funcionario = event.Funcionario || {};

            const searchMatch = searchTerm.trim() === '' || 
                funcionario.nome_funcionario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                String(funcionario.matricula || '').toLowerCase().includes(searchTerm.toLowerCase());

            const startDateMatch = !filters.data_inicio_de || new Date(event.data_inicio) >= new Date(filters.data_inicio_de + 'T00:00:00');
            const endDateMatch = !filters.data_inicio_ate || new Date(event.data_inicio) <= new Date(filters.data_inicio_ate + 'T00:00:00');

            const customFiltersMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                if (key === 'data_inicio_de' || key === 'data_inicio_ate') return true;

                if (key === 'tipo') {
                    return String(event.tipo).toLowerCase() === value.toLowerCase();
                }
                
                const itemValue = funcionario[key];
                if (itemValue === null || itemValue === undefined) return false;
                
                return String(itemValue).toLowerCase().includes(value.toLowerCase());
            });

            return searchMatch && startDateMatch && endDateMatch && customFiltersMatch;
        });
    }, [allEvents, searchTerm, filters]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEvents, currentPage]);

    const paginationInfo = {
        currentPage: currentPage, totalPages: Math.ceil(filteredEvents.length / itemsPerPage), totalItems: filteredEvents.length
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleYearChange = (e) => {
        setCurrentYear(e.target.value);
        handleClearFilters();
    };
    
    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
        if (document.getElementById('filter-form')) {
            document.getElementById('filter-form').reset();
        }
    };

    const columns = [
        { header: 'Tipo', accessor: 'tipo', cell: (row) => <span className={`${styles.badge} ${row.tipo === 'Férias' ? styles.badgeFerias : styles.badgeAfastamento}`}>{row.tipo}</span> },
        { header: 'Funcionário', accessor: 'Funcionario.nome_funcionario', cell: (row) => <Link href={`/funcionarios/${row.Funcionario.matricula}`} className={styles.nomeLink}>{row.Funcionario.nome_funcionario}</Link> },
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Data Início', accessor: 'data_inicio', cell: (row) => formatDateForDisplay(row.data_inicio) },
        { header: 'Data Fim', accessor: 'data_fim', cell: (row) => formatDateForDisplay(row.data_fim) },
        { header: 'Status / Motivo', accessor: 'status' },
        { header: 'Grupo/Gestão', accessor: 'Funcionario.des_grupo_contrato' },
        { header: 'Cliente', accessor: 'Funcionario.cliente' },
        { header: 'Contrato', accessor: 'Funcionario.contrato' },
        { header: 'Categoria/Cargo', accessor: 'Funcionario.categoria' },
        { header: 'Tipo de Contrato', accessor: 'Funcionario.categoria_trab' },
        { header: 'Município (Local)', accessor: 'Funcionario.municipio_local_trabalho' },
        { header: 'Estado (UF)', accessor: 'Funcionario.sigla_local' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Users size={32} />
                    <h1>Visão Geral de Ausências</h1>
                    <select className={styles.yearSelector} value={currentYear} onChange={handleYearChange}>
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>
                </div>
            </div>

            <form id="filter-form" className={styles.filterGrid}>
                <div className={`${styles.formGroup} ${styles.searchGroup}`}><label>Busca Rápida</label><div className={styles.inputIconWrapper}><Search size={18} className={styles.inputIcon} /><input type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange} /></div></div>
                <div className={styles.formGroup}><label>Tipo de Evento</label><select name="tipo" onChange={handleFilterChange} value={filters.tipo || ''}><option value="">Todos</option><option value="Férias">Férias</option><option value="Afastamento">Afastamento</option></select></div>
                
                <div className={styles.formGroup}><label>Início (a partir de)</label><input type="date" name="data_inicio_de" onChange={handleFilterChange} value={filters.data_inicio_de || ''} /></div>
                <div className={styles.formGroup}><label>Início (até)</label><input type="date" name="data_inicio_ate" onChange={handleFilterChange} value={filters.data_inicio_ate || ''} /></div>

                <div className={styles.formGroup}><label>Grupo/Gestão</label><select name="des_grupo_contrato" onChange={handleFilterChange} value={filters.des_grupo_contrato || ''}><option value="">Todos</option>{filterOptions.gestoes.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className={styles.formGroup}><label>Cliente</label><select name="cliente" onChange={handleFilterChange} value={filters.cliente || ''}><option value="">Todos</option>{filterOptions.clientes.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                
                {/* ================== CAMPOS ALTERADOS PARA INPUT ================== */}
                <div className={styles.formGroup}>
                    <label>Contrato</label>
                    <input name="contrato" type="text" placeholder="Digite para filtrar..." value={filters.contrato || ''} onChange={handleFilterChange} />
                </div>
                <div className={styles.formGroup}>
                    <label>Categoria/Cargo</label>
                    <input name="categoria" type="text" placeholder="Digite para filtrar..." value={filters.categoria || ''} onChange={handleFilterChange} />
                </div>
                <div className={styles.formGroup}>
                    <label>Tipo de Contrato</label>
                    <input name="categoria_trab" type="text" placeholder="Digite para filtrar..." value={filters.categoria_trab || ''} onChange={handleFilterChange} />
                </div>
                {/* =============================================================== */}

                <div className={styles.formGroup}><label>Município (Local)</label><select name="municipio_local_trabalho" onChange={handleFilterChange} value={filters.municipio_local_trabalho || ''}><option value="">Todos</option>{filterOptions.municipios.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className={styles.formGroup}><label>Estado (UF)</label><select name="sigla_local" onChange={handleFilterChange} value={filters.sigla_local || ''}><option value="">Todos</option>{filterOptions.estados.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                
                <div className={styles.filterActions}><Button type="button" variant="secondary" onClick={handleClearFilters} icon={<XCircle size={16}/>}>Limpar</Button></div>
            </form>

            <div className={styles.tableWrapper}>
                <Table columns={columns} data={paginatedData} isLoading={isLoading} />
            </div>

            {paginationInfo && paginationInfo.totalPages > 1 && (
                <Pagination pagination={paginationInfo} onPageChange={setCurrentPage} />
            )}
        </div>
    );
}