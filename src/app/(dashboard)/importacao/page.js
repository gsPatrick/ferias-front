'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/services/api';
import styles from './page.module.css';
import Button from '@/components/Button/Button';
import { UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ImportacaoPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [message, setMessage] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        // Pega apenas o primeiro arquivo
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('ready');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Precisamos chamar o axios diretamente aqui para enviar FormData
            const token = localStorage.getItem('authToken');
            const response = await api.post('/funcionarios/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setStatus('success');
            setMessage(response.data.message || 'Arquivo importado com sucesso!');
            setFile(null); // Limpa o arquivo após o sucesso
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Ocorreu um erro ao importar o arquivo.');
            console.error("Falha na importação:", error);
        }
    };
    
    const renderStatus = () => {
        if(status === 'success') {
            return <div className={`${styles.statusMessage} ${styles.success}`}><CheckCircle /> {message}</div>;
        }
        if(status === 'error') {
            return <div className={`${styles.statusMessage} ${styles.error}`}><AlertTriangle /> {message}</div>;
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Importar Planilha de Funcionários</h1>
                <p>Faça o upload do arquivo CSV com os dados cadastrais. O sistema irá criar novos registros e atualizar os existentes com base na matrícula.</p>
            </div>

            <div className={styles.uploadCard}>
                <div {...getRootProps({ className: `${styles.dropzone} ${isDragActive ? styles.active : ''}` })}>
                    <input {...getInputProps()} />
                    <UploadCloud size={64} className={styles.uploadIcon} />
                    {isDragActive ? (
                        <p>Solte o arquivo aqui...</p>
                    ) : (
                        <p>Arraste e solte o arquivo CSV aqui, ou <strong>clique para selecionar</strong></p>
                    )}
                    <span className={styles.fileHint}>Apenas arquivos .csv são permitidos.</span>
                </div>

                {file && (
                    <div className={styles.filePreview}>
                        <FileText />
                        <span>{file.name}</span>
                        <span>({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                )}
                
                {renderStatus()}

                <div className={styles.actions}>
                    <Button onClick={handleUpload} disabled={!file || status === 'uploading'}>
                        {status === 'uploading' ? 'Importando...' : 'Iniciar Importação'}
                    </Button>
                </div>
            </div>

            <div className={styles.instructions}>
                <h2>Instruções e Padrão de Colunas</h2>
                <p>Para garantir uma importação correta, sua planilha CSV deve conter as seguintes colunas, na ordem correta:</p>
                <code className={styles.columnList}>
                    Matrícula, Nome Funcionário, Dth. Admissão, Categoria_Trabalhador, Municipio_Local_Trabalho, DiasAfastado, Dth. Última Férias, Dth. Limite Férias, ... (e as outras colunas)
                </code>
            </div>
        </div>
    );
}