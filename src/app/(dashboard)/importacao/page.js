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
} from 'lucide-react';

export default function ImportacaoPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Estados para o período de distribuição
    const [dataInicioDist, setDataInicioDist] = useState('');
    const [dataFimDist, setDataFimDist] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('ready');
            setMessage('');
            setUploadProgress(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        setMessage('');
        setUploadProgress(0);

        // Simula um progresso mais realista
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + Math.random() * 10, 90));
        }, 300);

        const formData = new FormData();
        formData.append('file', file);
        
        // ==========================================================
        // LÓGICA DE ENVIO DAS DATAS - JÁ IMPLEMENTADA E CORRETA
        // Garante que as datas sejam enviadas para o backend processar.
        // ==========================================================
        if (dataInicioDist) {
            formData.append('data_inicio_distribuicao', dataInicioDist);
        }
        if (dataFimDist) {
            formData.append('data_fim_distribuicao', dataFimDist);
        }

        try {
            const response = await api.funcionarios.importPlanilha(formData);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            setTimeout(() => {
                setStatus('success');
                setMessage(response.data.message || 'Arquivo importado com sucesso!');
                setFile(null);
            }, 500);
        } catch (error) {
            clearInterval(progressInterval);
            setStatus('error');
            setMessage(error.response?.data?.message || 'Ocorreu um erro ao importar o arquivo.');
            setUploadProgress(0);
            console.error("Falha na importação:", error);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setStatus('idle');
        setMessage('');
        setUploadProgress(0);
        setDataInicioDist('');
        setDataFimDist('');
    };
    
    const renderStatus = () => {
        if(status === 'success') {
            return (
                <div className={`${styles.statusMessage} ${styles.success} ${styles.fadeIn}`}>
                    <div className={styles.statusIcon}><CheckCircle /></div>
                    <div className={styles.statusContent}>
                        <h3>Sucesso!</h3>
                        <p>{message}</p>
                    </div>
                </div>
            );
        }
        if(status === 'error') {
            return (
                <div className={`${styles.statusMessage} ${styles.error} ${styles.fadeIn}`}>
                    <div className={styles.statusIcon}><AlertTriangle /></div>
                    <div className={styles.statusContent}>
                        <h3>Erro na importação</h3>
                        <p>{message}</p>
                    </div>
                </div>
            );
        }
        if(status === 'uploading') {
            return (
                <div className={`${styles.statusMessage} ${styles.uploading} ${styles.fadeIn}`}>
                    <div className={styles.statusIcon}><div className={styles.spinner}></div></div>
                    <div className={styles.statusContent}>
                        <h3>Processando arquivo...</h3>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p>{uploadProgress > 90 ? 'Finalizando...' : 'Aguarde, isso pode levar alguns instantes.'}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <div className={styles.uploadSection}>
                <div className={styles.uploadCard}>
                    {!file ? (
                        <div {...getRootProps({ className: `${styles.dropzone} ${isDragActive ? styles.active : ''}` })}>
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
                            <div className={styles.fileIcon}><FileText size={32} /></div>
                            <div className={styles.fileInfo}>
                                <h4>{file.name}</h4>
                                <p>{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button className={styles.removeFile} onClick={resetUpload} disabled={status === 'uploading'}>×</button>
                        </div>
                    )}
                    
                    {file && status !== 'uploading' && status !== 'success' && (
                        <div className={styles.optionsSection}>
                            <h4>Período para Distribuição de Férias</h4>
                            <p>Defina o intervalo de datas para a alocação automática. Se deixado em branco, o sistema usará o ano corrente e a data limite de cada funcionário.</p>
                            <div className={styles.dateInputs}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="dataInicioDist">Distribuir a partir de:</label>
                                    <input 
                                        id="dataInicioDist" 
                                        type="date"
                                        value={dataInicioDist}
                                        onChange={(e) => setDataInicioDist(e.target.value)}
                                        className={styles.dateInput}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="dataFimDist">Até a data de:</label>
                                    <input 
                                        id="dataFimDist" 
                                        type="date"
                                        value={dataFimDist}
                                        onChange={(e) => setDataFimDist(e.target.value)}
                                        className={styles.dateInput}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {renderStatus()}

                    {file && status !== 'success' && (
                        <div className={styles.actions}>
                            <Button onClick={handleUpload} disabled={!file || status === 'uploading'} className={styles.uploadButton}>
                                {status === 'uploading' ? <><div className={styles.buttonSpinner}></div>Processando...</> : <>Iniciar Importação<ArrowRight size={16} /></>}
                            </Button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className={styles.actions}>
                            <Button onClick={resetUpload} className={styles.newUploadButton}>Nova Importação</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}