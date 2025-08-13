'use client';

import { useState } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import CoverageChart from '@/components/Charts/CoverageChart';
import styles from './relatorios.module.css';
import { AlertTriangle, Users, Download, DollarSign } from 'lucide-react';

// --- DADOS MOCKADOS (PARA COMPONENTES QUE AINDA NÃO TÊM API) ---

// Cobertura por Local (Dados para o Gráfico)
const mockGraficoCobertura = {
    datasets: [
        { name: 'Jan', 'Sede Teresina': 5, 'Filial Parnaíba': 2, 'Remoto': 1 },
        { name: 'Fev', 'Sede Teresina': 6, 'Filial Parnaíba': 3, 'Remoto': 1 },
        { name: 'Mar', 'Sede Teresina': 8, 'Filial Parnaíba': 3, 'Remoto': 2 },
        { name: 'Abr', 'Sede Teresina': 7, 'Filial Parnaíba': 4, 'Remoto': 1 },
        { name: 'Mai', 'Sede Teresina': 9, 'Filial Parnaíba': 3, 'Remoto': 2 },
        { name: 'Jun', 'Sede Teresina': 10, 'Filial Parnaíba': 5, 'Remoto': 2 },
        { name: 'Jul', 'Sede Teresina': 15, 'Filial Parnaíba': 6, 'Remoto': 3 },
    ]
};

// Projeção de Custos (Tabela ainda mockada)
const mockCustos = [
    { mes: 'Janeiro', custo_estimado: 'R$ 15.200,50' },
    { mes: 'Fevereiro', custo_estimado: 'R$ 18.150,00' },
    { mes: 'Março', custo_estimado: 'R$ 25.400,00' },
    { mes: 'Julho', custo_estimado: 'R$ 55.800,90' },
];
const custosColumns = [
    { header: 'Mês', accessor: 'mes' },
    { header: 'Custo Projetado (1/3 Férias)', accessor: 'custo_estimado' },
];

// --- FUNÇÃO HELPER ---

// Função para pegar o blob da API e iniciar o download no navegador
const downloadFile = (blob, fileName) => {
    try {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Erro ao criar link de download:", error);
        alert("Falha ao iniciar o download do arquivo.");
    }
};

// --- COMPONENTE PRINCIPAL ---

export default function RelatoriosPage() {
    const [diasRisco, setDiasRisco] = useState(90);
    const [anoCustos, setAnoCustos] = useState(new Date().getFullYear());
    const [isDownloading, setIsDownloading] = useState({ risco: false, custos: false });

    const handleExportRisco = async () => {
        setIsDownloading(prev => ({ ...prev, risco: true }));
        try {
            const response = await api.relatorios.getRiscoVencimento(diasRisco);
            downloadFile(response.data, `Relatorio_Risco_Vencimento_${diasRisco}_dias.xlsx`);
        } catch (error) {
            console.error("Erro ao exportar relatório de risco:", error);
            alert(error.response?.data?.message || "Não foi possível gerar o relatório de risco.");
        } finally {
            setIsDownloading(prev => ({ ...prev, risco: false }));
        }
    };

    const handleExportCustos = async () => {
        setIsDownloading(prev => ({ ...prev, custos: true }));
        try {
            const response = await api.relatorios.getProjecaoCustos(anoCustos);
            downloadFile(response.data, `Relatorio_Projecao_Custos_${anoCustos}.xlsx`);
        } catch (error) {
            console.error("Erro ao exportar projeção de custos:", error);
            alert(error.response?.data?.message || "Não foi possível gerar o relatório de custos.");
        } finally {
            setIsDownloading(prev => ({ ...prev, custos: false }));
        }
    };

    return (
        <div className={styles.container}>
            {/* Seção 1: Relatório de Risco de Vencimento */}
            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <AlertTriangle className={styles.sectionIcon} style={{ color: 'var(--cor-feedback-alerta)' }} />
                    <h2>Risco de Vencimento de Férias</h2>
                </div>
                <div className={styles.reportControls}>
                    <label htmlFor="dias-risco">Mostrar vencimentos nos próximos:</label>
                    <input 
                        type="number" 
                        id="dias-risco" 
                        value={diasRisco} 
                        onChange={(e) => setDiasRisco(e.target.value)} 
                        className={styles.controlInput}
                    />
                    <span>dias</span>
                    <Button 
                        icon={<Download size={16}/>} 
                        onClick={handleExportRisco} 
                        disabled={isDownloading.risco} 
                        className={styles.exportButton}
                    >
                        {isDownloading.risco ? 'Gerando...' : 'Exportar Relatório'}
                    </Button>
                </div>
                <p className={styles.reportDescription}>
                    Gera um arquivo XLSX com a lista de todos os funcionários ativos cujo prazo para gozo de férias expira no período selecionado. A lista é gerada em tempo real a partir dos dados atuais do sistema.
                </p>
            </div>

            {/* Seção 2: Relatório de Cobertura por Local */}
            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <Users className={styles.sectionIcon} style={{ color: 'var(--cor-primaria-profundo)' }} />
                    <h2>Cobertura de Férias por Local (Visual)</h2>
                </div>
                <div className={styles.chartContainer}>
                    <CoverageChart data={mockGraficoCobertura} />
                </div>
            </div>

            {/* Seção 3: Relatório de Projeção de Custos */}
            <div className={styles.reportSection}>
                <div className={styles.sectionHeader}>
                    <DollarSign className={styles.sectionIcon} style={{ color: 'var(--cor-feedback-sucesso)' }} />
                    <h2>Projeção de Custos com Férias</h2>
                </div>
                <div className={styles.reportControls}>
                    <label htmlFor="ano-custos">Ano de Referência:</label>
                     <select 
                        id="ano-custos"
                        className={styles.controlInput} 
                        value={anoCustos} 
                        onChange={(e) => setAnoCustos(e.target.value)}
                    >
                        <option>2025</option>
                        <option>2024</option>
                        <option>2023</option>
                    </select>
                     <Button 
                        icon={<Download size={16}/>} 
                        onClick={handleExportCustos} 
                        disabled={isDownloading.custos} 
                        className={styles.exportButton}
                    >
                        {isDownloading.custos ? 'Gerando...' : 'Exportar Projeção'}
                    </Button>
                </div>
                <p className={styles.reportDescription}>
                    Esta tabela exibe uma projeção de custos com o terço de férias, baseada nos agendamentos do planejamento ativo para o ano selecionado. (Atualmente com dados de exemplo).
                </p>
                <Table columns={custosColumns} data={mockCustos} />
            </div>
        </div>
    );
}