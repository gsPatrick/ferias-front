// src/components/Table/Table.js

'use client';

import { useState, useEffect } from 'react';
import styles from './Table.module.css';

/**
 * @param {object} props
 * @param {Array<object>} props.columns - Configuração das colunas.
 * @param {Array<object>} props.data - Os dados a serem exibidos.
 * @param {boolean} [props.isSelectable=false] - Habilita a seleção de linhas com checkboxes.
 * @param {function} [props.onSelectionChange] - Callback que retorna as linhas selecionadas.
 */
export default function Table({ columns, data, isLoading = false, isSelectable = false, onSelectionChange }) {
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Limpa a seleção quando os dados mudam
    useEffect(() => {
        setSelectedRows(new Set());
    }, [data]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allRowIds = new Set(data.map(row => row.id || row.matricula));
            setSelectedRows(allRowIds);
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (rowId, isChecked) => {
        const newSelectedRows = new Set(selectedRows);
        if (isChecked) {
            newSelectedRows.add(rowId);
        } else {
            newSelectedRows.delete(rowId);
        }
        setSelectedRows(newSelectedRows);
    };
    
    // Notifica o componente pai sobre a mudança na seleção
    useEffect(() => {
        if (onSelectionChange) {
            const selectedData = data.filter(row => selectedRows.has(row.id || row.matricula));
            onSelectionChange(selectedData);
        }
    }, [selectedRows, data, onSelectionChange]);

    // Função para formatar datas para exibição
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    // Função para calcular dias até vencimento
    const calculateDaysUntilExpiry = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        const expiryDate = new Date(dateString);
        const timeDiff = expiryDate.getTime() - today.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    };

    // Função para determinar criticidade do prazo
    const getFieldCriticality = (days) => {
        if (days === null || days === undefined) return '';
        if (days < 0) return 'critical';
        if (days <= 30) return 'critical';
        if (days <= 60) return 'important';
        return '';
    };

    if (isLoading) {
        return <div className={styles.loading}>Carregando dados...</div>;
    }

    if (!data || data.length === 0) {
        return <div className={styles.noData}>Nenhum dado encontrado para os filtros aplicados.</div>;
    }

    return (
        <>
            {/* Layout Desktop - Tabela */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {isSelectable && (
                                <th className={styles.checkboxCell}>
                                    <input 
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedRows.size > 0 && selectedRows.size === data.length}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th key={col.accessor}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => {
                            const rowId = row.id || row.matricula;
                            const isSelected = selectedRows.has(rowId);
                            return (
                                <tr key={rowId} className={isSelected ? styles.selectedRow : ''}>
                                    {isSelectable && (
                                        <td className={styles.checkboxCell}>
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td 
                                            key={col.accessor} 
                                            data-label={col.header}
                                            className={col.tdClassName || ''}
                                        >
                                            {col.cell ? col.cell(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Layout Mobile - Cards */}
            <div className={styles.cardContainer}>
                {data.map((row, rowIndex) => {
                    const rowId = row.id || row.matricula;
                    const isSelected = selectedRows.has(rowId);
                    const diasLimite = calculateDaysUntilExpiry(row.dth_limite_ferias);
                    const criticality = getFieldCriticality(diasLimite);

                    return (
                        <div key={rowId} className={`${styles.employeeCard} ${isSelected ? styles.selectedCard : ''}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    <div className={styles.cardName}>
                                        {row.nome_funcionario}
                                    </div>
                                    <div className={styles.cardMatricula}>
                                        Matrícula: {row.matricula}
                                    </div>
                                </div>
                                {isSelectable && (
                                    <div className={styles.cardCheckbox}>
                                        <input 
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardContent}>
                                <div className={styles.cardField}>
                                    <div className={styles.cardFieldLabel}>Período Aquisitivo</div>
                                    <div className={styles.cardFieldValue}>
                                        {formatDateForDisplay(row.periodo_aquisitivo_atual_inicio)} - {formatDateForDisplay(row.periodo_aquisitivo_atual_fim)}
                                    </div>
                                </div>

                                <div className={styles.cardField}>
                                    <div className={styles.cardFieldLabel}>Saldo Dias</div>
                                    <div className={`${styles.cardFieldValue} ${styles.saldoCell}`}>
                                        {row.saldo_dias_ferias} dias
                                    </div>
                                </div>

                                <div className={`${styles.cardField} ${criticality === 'critical' ? styles.cardFieldCritical : criticality === 'important' ? styles.cardFieldImportant : ''}`}>
                                    <div className={styles.cardFieldLabel}>Limite Férias</div>
                                    <div className={`${styles.cardFieldValue} ${styles.limiteCell}`}>
                                        <div className={`${styles.riskIndicator} ${
                                            diasLimite === null ? '' : 
                                            diasLimite < 0 ? styles.expired :
                                            diasLimite <= 30 ? styles.high :
                                            diasLimite <= 60 ? styles.medium : styles.low
                                        }`}></div>
                                        <span>{formatDateForDisplay(row.dth_limite_ferias)}</span>
                                        {diasLimite !== null && (
                                            <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                                                ({diasLimite < 0 ? `Vencido há ${Math.abs(diasLimite)} dias` : `${diasLimite} dias`})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.cardField}>
                                    <div className={styles.cardFieldLabel}>Status</div>
                                    <div className={styles.cardFieldValue}>
                                        <span className={`${styles.statusBadge} ${row.status === 'Ativo' ? styles.statusAtivo : styles.statusInativo}`}>
                                            {row.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                {/* Encontrar a coluna de ações e renderizar */}
                                {columns.find(col => col.accessor === 'acoes')?.cell && 
                                    columns.find(col => col.accessor === 'acoes').cell(row)
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}