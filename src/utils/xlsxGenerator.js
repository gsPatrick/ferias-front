// src/utils/xlsxGenerator.js

import * as XLSX from 'xlsx';

/**
 * Gera um arquivo XLSX a partir de um array de objetos e força o download.
 * @param {Array<object>} data - O array de dados JSON.
 * @param {string} fileName - O nome do arquivo a ser gerado (sem a extensão).
 */
export const generateAndDownloadXLSX = (data, fileName) => {
    // Cria uma nova workbook
    const wb = XLSX.utils.book_new();
    
    // Converte os dados JSON para uma worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Adiciona a worksheet à workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    
    // Gera o arquivo e inicia o download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Gera um Aviso de Férias em formato XLSX.
 * @param {object} funcionario - O objeto do funcionário.
 * @param {object} ferias - O objeto do período de férias.
 */
export const generateAvisoFeriasXLSX = (funcionario, ferias) => {
    const data = [
        ["AVISO DE FÉRIAS"],
        [], // Linha em branco
        ["Prezado(a) Colaborador(a),"],
        [funcionario.nome],
        [],
        ["Comunicamos, para os devidos fins, que suas férias relativas ao período aquisitivo de:", funcionario.periodo_aquisitivo],
        ["Serão concedidas conforme a programação abaixo:"],
        [],
        ["Início do Gozo:", ferias.inicio],
        ["Fim do Gozo:", ferias.fim],
        ["Total de Dias:", ferias.dias],
        [],
        ["Atenciosamente,"],
        ["Departamento de Recursos Humanos"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aviso de Férias");
    XLSX.writeFile(wb, `Aviso_Ferias_${funcionario.nome.replace(/\s/g, '_')}.xlsx`);
};