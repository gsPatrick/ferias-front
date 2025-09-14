'use client';

import styles from './Table.module.css';

/**
 * Componente de Tabela Dinâmica e Reutilizável
 * @param {object} props
 * @param {Array<object>} props.columns - Configuração das colunas. Ex: [{ header: 'Nome', accessor: 'nome' }]
 * @param {Array<object>} props.data - Os dados a serem exibidos.
 * @param {boolean} [props.isLoading=false] - Indica se os dados estão carregando.
 */
export default function Table({ columns, data, isLoading = false }) {
    // Estado de Carregamento
    if (isLoading) {
        return <div className={styles.loading}>Carregando dados...</div>;
    }

    // Estado Sem Dados
    if (!data || data.length === 0) {
        return <div className={styles.noData}>Nenhum registro encontrado.</div>;
    }

    // Função para obter o valor de uma célula, suportando aninhamento (Ex: 'Funcionario.nome')
    const getCellValue = (row, accessor) => {
        if (!accessor) return null;
        return accessor.split('.').reduce((acc, part) => acc && acc[part], row);
    };

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col.header}>{col.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex}>
                        {columns.map((col) => (
                            <td key={col.accessor || col.header}>
                                {col.cell ? col.cell(row) : getCellValue(row, col.accessor)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}