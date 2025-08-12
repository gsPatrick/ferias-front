'use client';

import { useState } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import CoverageChart from '@/components/Charts/CoverageChart';
import styles from './relatorios.module.css';
import { AlertTriangle, Users, Download, DollarSign } from 'lucide-react';

// Dados que permanecerão mockados por enquanto
const mockGraficoCobertura = { /* ... */ };
const mockCustos = [ { mes: 'Janeiro', custo_estimado: 'R$ 15.200,50' }, /* ... */ ];
const custosColumns = [ { header: 'Mês', accessor: 'mes' }, { header: 'Custo Projetado (1/3 Férias)', accessor: 'custo_estimado' } ];

// Função helper para iniciar o download do arquivo
const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
};

export default function RelatoriosPage() {
    const [diasRisco, setDiasRisco] = useState(90);
    const [anoCustos, setAnoCustos] = useState(new Date().getFullYear());
    const [isDownloading, setIsDownloading] = useState(false);

    const handleExportRisco = async () => {
        setIsDownloading(true);
        try {
            const response = await api.relatorios.getRiscoVencimento(diasRisco);
            downloadFile(response.data, `Relatorio_Risco_Vencimento_${diasRisco}_dias.xlsx`);
        } catch (error) {
            console.error("Erro ao exportar relatório de risco:", error);
            alert("Não foi possível gerar o relatório.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExportCustos = async () => {
        setIsDownloading(true);
        try {
            const response = await api.relatorios.getProjecaoCustos(anoCustos);
            downloadFile(response.data, `Relatorio_Projecao_Custos_${anoCustos}.xlsx`);
        } catch (error) {
            console.error("Erro ao exportar projeção de custos:", error);
            alert("Não foi possível gerar o relatório.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <AlertTriangle className={styles.sectionIcon} style={{ color: 'var(--cor-feedback-alerta)' }} />
                    <h2>Risco de Vencimento de Férias</h2>
                </div>
                <div className={styles.reportControls}>
                    <label htmlFor="dias-risco">Mostrar vencimentos nos próximos:</label>
                    <input type="number" id="dias-risco" value={diasRisco} onChange={(e) => setDiasRisco(e.target.value)} className={styles.controlInput}/>
                    <span>dias</span>
                    <Button icon={<Download size={16}/>} onClick={handleExportRisco} disabled={isDownloading} className={styles.exportButton}>
                        {isDownloading ? 'Gerando...' : 'Exportar Lista'}
                    </Button>
                </div>
                <p className={styles.reportDescription}>Este relatório lista todos os funcionários ativos cujo prazo para gozo de férias expira no período selecionado. A lista é gerada em tempo real a partir dos dados do sistema.</p>
            </div>

            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <Users className={styles.sectionIcon} style={{ color: 'var(--cor-primaria-profundo)' }} />
                    <h2>Cobertura de Férias por Local (Visual)</h2>
                </div>
                <div className={styles.chartContainer}>
                    <CoverageChart data={mockGraficoCobertura} />
                </div>
            </div>

            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <DollarSign className={styles.sectionIcon} style={{ color: 'var(--cor-feedback-sucesso)' }} />
                    <h2>Projeção de Custos com Férias</h2>
                </div>
                <div className={styles.reportControls}>
                    <label>Ano de Referência:</label>
                     <select className={styles.controlInput} value={anoCustos} onChange={(e) => setAnoCustos(e.target.value)}><option>2024</option><option>2025</option></select>
                     <Button icon={<Download size={16}/>} onClick={handleExportCustos} disabled={isDownloading} className={styles.exportButton}>
                         {isDownloading ? 'Gerando...' : 'Exportar Projeção'}
                    </Button>
                </div>
                <Table columns={custosColumns} data={mockCustos} />
            </div>
        </div>
    );
}