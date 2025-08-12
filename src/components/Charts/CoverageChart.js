'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CoverageChart.module.css';

export default function CoverageChart({ data }) {
    return (
        <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data.datasets}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} fontSize={12} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6B7280' }} fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--cor-branco)',
                            border: '1px solid #E5E7EB',
                            borderRadius: 'var(--raio-borda)',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                    <Bar dataKey="Sede Teresina" stackId="a" fill="var(--cor-primaria-medio)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Filial Parnaíba" stackId="a" fill="var(--cor-feedback-sucesso)" />
                    <Bar dataKey="Remoto" stackId="a" fill="var(--cor-feedback-alerta)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}