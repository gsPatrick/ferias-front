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
            const allRowIds = new Set(data.map(row => row.id || row.matricula)); // Usa 'id' ou 'matricula' como chave
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

    if (isLoading) {
        return <div className={styles.loading}>Carregando dados...</div>;
    }

    if (!data || data.length === 0) {
        return <div className={styles.noData}>Nenhum dado encontrado para os filtros aplicados.</div>;
    }

    return (
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
                                    <td key={col.accessor} data-label={col.header}>
                                        {col.cell ? col.cell(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}