// /app/(dashboard)/planejamento/visao-geral/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Table from '@/components/Table/Table';
import Pagination from '@/components/Pagination/Pagination';
import styles from './visao-geral.module.css';
import { Users, Search, Filter, XCircle } from 'lucide-react';

// --- HELPERS ---

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    // Adiciona T00:00:00 para evitar problemas de fuso horário que podem mudar o dia
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
};

// --- COMPONENTE PRINCIPAL ---

export default function VisaoGeralTabelaPage() {
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({ gestoes: [], municipios: [], categorias: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const itemsPerPage = 20;

    const fetchAllEvents = useCallback(async (year) => {
        setIsLoading(true);
        try {
            const [feriasResponse, afastamentosResponse, optionsResponse] = await Promise.all([
                api.ferias.getPlanejamentoAtivo({ ano: year, limit: 10000 }),
                api.afastamentos.getAllActive({ limit: 10000 }),
                api.funcionarios.getFilterOptions()
            ]);

            const feriasEvents = (feriasResponse.data.data || []).map(f => ({
                id: `ferias-${f.id}`, tipo: 'Férias', Funcionario: f.Funcionario,
                data_inicio: f.data_inicio, data_fim: f.data_fim, detalhe: f.status,
            }));
            const afastamentosEvents = (afastamentosResponse.data.data || []).map(a => ({
                id: `afastamento-${a.id}`, tipo: 'Afastamento', Funcionario: a.Funcionario,
                data_inicio: a.data_inicio, data_fim: a.data_fim, detalhe: a.motivo,
            }));

            const combinedEvents = [...feriasEvents, ...afastamentosEvents];
            combinedEvents.sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio));
            
            setAllEvents(combinedEvents);
            setFilterOptions(optionsResponse.data || { gestoes: [], municipios: [], categorias: [] });
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllEvents(currentYear);
    }, [currentYear, fetchAllEvents]);

    // --- LÓGICA DE FILTRAGEM CORRIGIDA E COMPLETA ---
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const func = event.Funcionario || {};
            
            // Filtro de Busca Rápida (Nome ou Matrícula)
            const searchMatch = searchTerm.trim() === '' || 
                func.nome_funcionario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                String(func.matricula || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Filtro por Tipo (Férias/Afastamento)
            const typeMatch = !filters.tipo || event.tipo === filters.tipo;

            // Filtro por Município
            const municipioMatch = !filters.municipio || func.municipio_local_trabalho === filters.municipio;

            // Filtro por Gestão
            const gestaoMatch = !filters.gestao || func.des_grupo_contrato === filters.gestao;
            
            // Filtro por Categoria
            const categoriaMatch = !filters.categoria || func.categoria === filters.categoria;

            // Filtro por Status/Motivo
            const detalheMatch = !filters.detalhe || event.detalhe?.toLowerCase().includes(filters.detalhe.toLowerCase());
            
            // Filtro por Data de Início
            const startDateMatch = !filters.data_inicio_de || new Date(event.data_inicio) >= new Date(filters.data_inicio_de);
            const endDateMatch = !filters.data_inicio_ate || new Date(event.data_inicio) <= new Date(filters.data_inicio_ate);

            return searchMatch && typeMatch && municipioMatch && gestaoMatch && categoriaMatch && detalheMatch && startDateMatch && endDateMatch;
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
    const handleYearChange = (e) => setCurrentYear(e.target.value);
    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
        document.getElementById('filter-form').reset();
    };

    const columns = [
        { header: 'Tipo', accessor: 'tipo', cell: (row) => <span className={`${styles.badge} ${row.tipo === 'Férias' ? styles.badgeFerias : styles.badgeAfastamento}`}>{row.tipo}</span> },
        { header: 'Funcionário', accessor: 'Funcionario.nome_funcionario', cell: (row) => <Link href={`/funcionarios/${row.Funcionario.matricula}`} className={styles.nomeLink}>{row.Funcionario.nome_funcionario}</Link> },
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Data Início', accessor: 'data_inicio', cell: (row) => formatDateForDisplay(row.data_inicio) },
        { header: 'Data Fim', accessor: 'data_fim', cell: (row) => formatDateForDisplay(row.data_fim) },
        { header: 'Status / Motivo', accessor: 'detalhe' },
        { header: 'Município', accessor: 'Funcionario.municipio_local_trabalho' },
        { header: 'Gestão Contrato', accessor: 'Funcionario.des_grupo_contrato' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Users size={32} />
                    <h1>Visão Geral de Ausências</h1>
                    <select className={styles.yearSelector} value={currentYear} onChange={handleYearChange}>
                        <option>2025</option><option>2024</option><option>2023</option>
                    </select>
                </div>
            </div>

            <form id="filter-form" className={styles.filterGrid}>
                {/* LINHA 1 DE FILTROS */}
                <div className={`${styles.formGroup} ${styles.searchGroup}`} style={{ gridColumn: 'span 2' }}><label>Busca Rápida</label><div className={styles.inputIconWrapper}><Search size={18} className={styles.inputIcon} /><input type="text" placeholder="Nome ou matrícula..." value={searchTerm} onChange={handleSearchChange} /></div></div>
                <div className={styles.formGroup}><label>Tipo de Evento</label><select name="tipo" onChange={handleFilterChange}><option value="">Todos</option><option value="Férias">Férias</option><option value="Afastamento">Afastamento</option></select></div>
                <div className={styles.formGroup}><label>Status / Motivo</label><input type="text" name="detalhe" placeholder="Contém..." onChange={handleFilterChange} /></div>
                
                {/* LINHA 2 DE FILTROS */}
                <div className={styles.formGroup}><label>Início (a partir de)</label><input type="date" name="data_inicio_de" onChange={handleFilterChange} /></div>
                <div className={styles.formGroup}><label>Início (até)</label><input type="date" name="data_inicio_ate" onChange={handleFilterChange} /></div>
                <div className={styles.formGroup}><label>Município</label><select name="municipio" onChange={handleFilterChange}><option value="">Todos</option>{filterOptions.municipios.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className={styles.formGroup}><label>Gestão Contrato</label><select name="gestao" onChange={handleFilterChange}><option value="">Todas</option>{filterOptions.gestoes.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                
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
