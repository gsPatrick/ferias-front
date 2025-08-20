// src/app/(dashboard)/afastados/page.js
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import FilterPanel from '@/components/FilterPanel/FilterPanel'; 
import Pagination from '@/components/Pagination/Pagination';
import styles from './afastados.module.css'; // Usaremos um CSS dedicado
import { Search, Filter, FileWarning, XCircle } from 'lucide-react';

// Função auxiliar para formatar datas
const formatDate = (dateString) => {
    if (!dateString) return 'Em aberto';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

function AfastadosComponent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [afastamentos, setAfastamentos] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});

    const fetchAfastamentos = useCallback(async (currentSearchParams) => {
        setIsLoading(true);
        try {
            const params = Object.fromEntries(currentSearchParams.entries());
            const response = await api.afastamentos.getAllActive(params);
            setAfastamentos(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Falha ao buscar afastamentos:", error);
            alert('Não foi possível carregar os dados de afastamentos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const term = searchParams.get('q') || '';
        setSearchTerm(term);
        const filters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && key !== 'limit' && key !== 'q') {
                filters[key] = value;
            }
        }
        setActiveFilters(filters);
        fetchAfastamentos(searchParams);
    }, [searchParams, fetchAfastamentos]);

    const updateUrlParams = (newParams) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });
        router.push(`${pathname}?${current.toString()}`);
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        updateUrlParams({ q: term, page: '1' });
    };

    const handleApplyFilters = (filters) => {
        updateUrlParams({ ...filters, page: '1' });
        setIsFilterOpen(false);
    };
    
    const handlePageChange = (page) => {
        updateUrlParams({ page: String(page) });
    };

    const clearAllFilters = () => router.push(pathname);

    const columns = [
        { header: 'Nome do Funcionário', accessor: 'Funcionario.nome_funcionario' },
        { header: 'Matrícula', accessor: 'Funcionario.matricula' },
        { header: 'Motivo', accessor: 'motivo' },
        { header: 'Data de Início', accessor: 'data_inicio', cell: (row) => formatDate(row.data_inicio) },
        { header: 'Data de Fim', accessor: 'data_fim', cell: (row) => formatDate(row.data_fim) },
        { header: 'Impacta Férias?', accessor: 'impacta_ferias', cell: (row) => (row.impacta_ferias ? 'Sim' : 'Não') },
    ];

    const hasActiveFiltersOrSearch = searchTerm || Object.keys(activeFilters).length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <FileWarning size={32} />
                    <h1>Funcionários Afastados</h1>
                </div>
                <div className={styles.actionsContainer}>
                    <div className={styles.searchContainer}>
                        <Search size={20} className={styles.searchIcon} />
                        <input type="text" placeholder="Buscar por nome ou matrícula..." value={searchTerm} onChange={handleSearch} className={styles.searchInput} />
                    </div>
                    <Button variant="secondary" icon={<Filter size={16} />} onClick={() => setIsFilterOpen(true)}>Filtros</Button>
                </div>
            </div>

            {hasActiveFiltersOrSearch && (
                <div className={styles.activeFiltersContainer}>
                    <span>Filtros Ativos:</span>
                    {Object.entries(activeFilters).map(([key, value]) => value && <span key={key} className={styles.filterPill}>{key}: {value}</span>)}
                    <Button variant="secondary" onClick={clearAllFilters} icon={<XCircle size={16}/>}>Limpar</Button>
                </div>
            )}
            
            <div className={styles.tableWrapper}>
                <Table columns={columns} data={afastamentos} isLoading={isLoading} />
            </div>

            <Pagination pagination={pagination} onPageChange={handlePageChange} />
            
            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilters={handleApplyFilters} initialFilters={activeFilters}/>
        </div>
    );
}

export default function AfastadosPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AfastadosComponent />
        </Suspense>
    );
}