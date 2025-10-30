// src/app/(dashboard)/importacao/page.js
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/services/api';
import styles from './page.module.css';
import Button from '@/components/Button/Button';
import { 
    UploadCloud, 
    FileText, 
    CheckCircle, 
    AlertTriangle, 
    FileSpreadsheet,
    ArrowRight,
    CalendarCog, // Ícone para a nova seção
} from 'lucide-react';

export default function ImportacaoPage() {
    // Estados para a parte de Upload
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dataInicioDist, setDataInicioDist] = useState('');
    const [dataFimDist, setDataFimDist] = useState('');

    // ==========================================================
    // NOVOS ESTADOS PARA A GERAÇÃO MANUAL
    // ==========================================================
    const [manualAno, setManualAno] = useState(new Date().getFullYear() + 1);
    const [manualDescricao, setManualDescricao] = useState('');
    const [manualStatus, setManualStatus] = useState('idle'); // idle, generating, success, error
    const [manualMessage, setManualMessage] = useState('');


    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setUploadStatus('ready');
            setUploadMessage('');
            setUploadProgress(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file) return;
        setUploadStatus('uploading');
        setUploadMessage('');
        setUploadProgress(0);
        const progressInterval = setInterval(() => setUploadProgress(prev => Math.min(prev + Math.random() * 10, 90)), 300);

        const formData = new FormData();
        formData.append('file', file);
        if (dataInicioDist) formData.append('data_inicio_distribuicao', dataInicioDist);
        if (dataFimDist) formData.append('data_fim_distribuicao', dataFimDist);

        try {
            const response = await api.funcionarios.importPlanilha(formData);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setTimeout(() => {
                setUploadStatus('success');
                setUploadMessage(response.data.message || 'Arquivo importado com sucesso!');
                setFile(null);
            }, 500);
        } catch (error) {
            clearInterval(progressInterval);
            setUploadStatus('error');
            setUploadMessage(error.response?.data?.message || 'Ocorreu um erro ao importar o arquivo.');
            setUploadProgress(0);
        }
    };
    
    // ==========================================================
    // NOVA FUNÇÃO PARA GERAR PLANEJAMENTO MANUALMENTE
    // ==========================================================
    const handleGenerateManual = async (e) => {
        e.preventDefault();
        if (!manualAno) {
            alert('Por favor, preencha o ano do planejamento.');
            return;
        }

        setManualStatus('generating');
        setManualMessage('');

        try {
            // Usa o endpoint 'distribuir' que já existe na sua API
            const response = await api.ferias.distribuir({
                ano: manualAno,
                descricao: manualDescricao || `Planejamento manual para ${manualAno}`
            });
            setManualStatus('success');
            setManualMessage(response.data.message || `Planejamento para ${manualAno} gerado com sucesso!`);
        } catch (error) {
            setManualStatus('error');
            setManualMessage(error.response?.data?.message || `Falha ao gerar o planejamento para ${manualAno}.`);
            console.error("Falha na geração manual:", error);
        }
    };


    const resetUpload = () => {
        setFile(null);
        setUploadStatus('idle');
        setUploadMessage('');
        setUploadProgress(0);
        setDataInicioDist('');
        setDataFimDist('');
    };
    
    const renderStatus = (status, message) => {
        if(status === 'success') {
            return <div className={`${styles.statusMessage} ${styles.success} ${styles.fadeIn}`}><div className={styles.statusIcon}><CheckCircle /></div><div className={styles.statusContent}><h3>Sucesso!</h3><p>{message}</p></div></div>;
        }
        if(status === 'error') {
            return <div className={`${styles.statusMessage} ${styles.error} ${styles.fadeIn}`}><div className={styles.statusIcon}><AlertTriangle /></div><div className={styles.statusContent}><h3>Erro na Operação</h3><p>{message}</p></div></div>;
        }
        if(status === 'generating') {
            return <div className={`${styles.statusMessage} ${styles.uploading} ${styles.fadeIn}`}><div className={styles.statusIcon}><div className={styles.spinner}></div></div><div className={styles.statusContent}><h3>Gerando Planejamento...</h3><p>Aguarde, isso pode levar alguns instantes.</p></div></div>;
        }
        return null;
    };
    
    // ... o restante do componente

    return (
        <div className={styles.container}>
            {/* Seção 1: Upload de Planilha */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <UploadCloud size={28}/>
                    <h2>Importar e Sincronizar Planilha</h2>
                </div>
                {!file ? (
                    <div {...getRootProps({ className: `${styles.dropzone} ${isDragActive ? styles.active : ''}` })}>
                        {/* ... (código do dropzone inalterado) */}
                        <input {...getInputProps()} />
                        <div className={styles.dropzoneContent}>
                            <div className={styles.uploadIconContainer}><UploadCloud size={64} className={styles.uploadIcon} /></div>
                            <div className={styles.dropzoneText}>
                                {isDragActive ? <h3>Solte o arquivo aqui...</h3> : <><h3>Arraste sua planilha aqui</h3><p>ou <strong>clique para selecionar</strong></p></>}
                            </div>
                            <div className={styles.fileTypes}><FileSpreadsheet size={16} /><span>Apenas arquivos .xlsx</span></div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.filePreview}>
                        {/* ... (código do filePreview inalterado) */}
                        <div className={styles.fileIcon}><FileText size={32} /></div>
                        <div className={styles.fileInfo}><h4>{file.name}</h4><p>{(file.size / 1024).toFixed(2)} KB</p></div>
                        <button className={styles.removeFile} onClick={resetUpload} disabled={uploadStatus === 'uploading'}>×</button>
                    </div>
                )}
                
                {file && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
                    <div className={styles.optionsSection}>
                        <h4>Período para Distribuição de Férias</h4>
                        <p>Defina o intervalo de datas para a alocação automática. Se deixado em branco, o sistema usará o ano corrente e a data limite de cada funcionário.</p>
                        <div className={styles.dateInputs}>
                            <div className={styles.formGroup}><label htmlFor="dataInicioDist">Distribuir a partir de:</label><input id="dataInicioDist" type="date" value={dataInicioDist} onChange={(e) => setDataInicioDist(e.target.value)} className={styles.dateInput}/></div>
                            <div className={styles.formGroup}><label htmlFor="dataFimDist">Até a data de:</label><input id="dataFimDist" type="date" value={dataFimDist} onChange={(e) => setDataFimDist(e.target.value)} className={styles.dateInput}/></div>
                        </div>
                    </div>
                )}

                {renderStatus(uploadStatus, uploadMessage)}

                {file && uploadStatus !== 'success' && (
                    <div className={styles.actions}><Button onClick={handleUpload} disabled={!file || uploadStatus === 'uploading'} className={styles.uploadButton}>{uploadStatus === 'uploading' ? <><div className={styles.buttonSpinner}></div>Processando...</> : <>Iniciar Importação<ArrowRight size={16} /></>}</Button></div>
                )}
                {uploadStatus === 'success' && (
                    <div className={styles.actions}><Button onClick={resetUpload} className={styles.newUploadButton}>Nova Importação</Button></div>
                )}
            </div>

            {/* ========================================================== */}
            {/* SEÇÃO 2: GERAÇÃO MANUAL DE PLANEJAMENTO */}
            {/* ========================================================== */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <CalendarCog size={28}/>
                    <h2>Gerar ou Regenerar Planejamento Anual</h2>
                </div>
                <p className={styles.sectionDescription}>
                    Use esta ferramenta para criar um novo planejamento para um ano específico ou para corrigir um planejamento existente. 
                    Isso irá arquivar qualquer planejamento ativo do ano selecionado e criar um novo com base nos dados mais recentes dos funcionários.
                </p>
                <form onSubmit={handleGenerateManual}>
                    <div className={styles.manualFormGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="manualAno">Ano do Planejamento</label>
                            <input id="manualAno" type="number" placeholder="Ex: 2026" value={manualAno} onChange={(e) => setManualAno(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="manualDescricao">Descrição (Opcional)</label>
                            <input id="manualDescricao" type="text" placeholder="Ex: Regeneração para 2026" value={manualDescricao} onChange={(e) => setManualDescricao(e.target.value)} />
                        </div>
                    </div>
                    
                    {renderStatus(manualStatus, manualMessage)}

                    <div className={styles.actions}>
                        <Button type="submit" disabled={manualStatus === 'generating'} className={styles.generateButton}>
                            {manualStatus === 'generating' ? <><div className={styles.buttonSpinner}></div>Gerando...</> : <>Gerar Planejamento<ArrowRight size={16} /></>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}