// src/components/Dashboard/DashboardChart.js
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css'; // O CSS virá da página principal

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.customTooltip}>
                <p className={styles.tooltipLabel}>{`${label}`}</p>
                <p className={styles.tooltipValue}>{`Férias Iniciando: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

export default function DashboardChart({ data }) {
    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.sectionTitle}>Distribuição de Férias no Ano</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        {/* Gradiente usando as cores primárias do seu tema */}
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--cor-primaria-medio)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--cor-primaria-claro)" stopOpacity={0.5}/>
                        </linearGradient>
                    </defs>
                    {/* Linhas de grade mais sutis para o tema claro */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                        dataKey="mes" 
                        tick={{ fill: 'var(--cor-cinza-medio)' }} 
                        fontSize={12} 
                        axisLine={false} 
                        tickLine={false} 
                    />
                    <YAxis 
                        allowDecimals={false} 
                        tick={{ fill: 'var(--cor-cinza-medio)' }} 
                        fontSize={12} 
                        axisLine={false} 
                        tickLine={false}
                        domain={[0, dataMax => Math.max(Math.ceil(dataMax * 1.2), 8)]} // Margem de 20% no topo
                    />
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ fill: 'rgba(96, 165, 250, 0.1)' }} // Cor do hover da barra
                    />
                    <Bar 
                        dataKey="total" 
                        name="Férias Iniciando" 
                        radius={[4, 4, 0, 0]} 
                        fill="url(#colorUv)"
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}