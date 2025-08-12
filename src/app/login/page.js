'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import styles from './login.module.css';
import Button from '@/components/Button/Button';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@empresa.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault(); // Impede o recarregamento padrão da página
        setError('');
        setIsLoading(true);

        try {
            // Chama a função de login do nosso serviço de API
            const response = await api.auth.login(email, password);

            // Armazena o token e os dados do usuário no localStorage
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Redireciona para o dashboard em caso de sucesso
            router.push('/dashboard');

        } catch (err) {
            // Captura o erro da API e exibe a mensagem para o usuário
            setError(err.response?.data?.message || 'Erro ao tentar fazer login. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <div className={styles.logoContainer}>
                    <Building2 size={40} className={styles.logoIcon} />
                    <h1 className={styles.title}>Sistema de Gestão de Férias</h1>
                    <p className={styles.subtitle}>Acesse sua conta para continuar</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <Mail className={styles.inputIcon} size={20} />
                        <input 
                            type="email" 
                            placeholder="E-mail" 
                            className={styles.input} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            autoComplete="email"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <Lock className={styles.inputIcon} size={20} />
                        <input 
                            type="password" 
                            placeholder="Senha" 
                            className={styles.input} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    
                    <a href="#" className={styles.forgotPassword}>Esqueceu a senha?</a>
                    
                    {error && (
                        <div className={styles.errorBox}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}