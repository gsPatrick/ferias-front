'use client';

import styles from './GanttChart.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * @param {object} props
 * @param {Array<object>} props.data - Dados das férias para exibir. Ex: [{ nome, inicio, fim }]
 */
export default function GanttChart({ data = [] }) {
    // Lógica simples para mockar a posição e largura das barras
    const getBarStyle = (inicio, fim) => {
        const diaInicio = parseInt(inicio.split('/')[0]);
        const mesInicio = parseInt(inicio.split('/')[1]) - 1;
        const diaFim = parseInt(fim.split('/')[0]);
        const mesFim = parseInt(fim.split('/')[1]) - 1;

        const startPercent = (mesInicio * 30 + diaInicio) / 365 * 100;
        const endPercent = (mesFim * 30 + diaFim) / 365 * 100;
        const widthPercent = endPercent - startPercent;

        return {
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
        };
    };

    return (
        <div className={styles.ganttContainer}>
            <div className={styles.timelineHeader}>
                {meses.map(mes => <div key={mes} className={styles.month}>{mes}</div>)}
            </div>
            <div className={styles.ganttBody}>
                {data.map((item, index) => (
                    <div key={index} className={styles.ganttRow}>
                        <div className={styles.rowLabel}>{item.nome}</div>
                        <div className={styles.rowTimeline}>
                            <div className={styles.ganttBar} style={getBarStyle(item.inicio, item.fim)}>
                                <span className={styles.barLabel}>{item.inicio} - {item.fim}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}