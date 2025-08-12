'use client'; // Necessário para usar o hook usePathname

import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

// Mapeamento das rotas para títulos amigáveis
const pageTitles = {
    '/dashboard': 'Dashboard',
    '/funcionarios': 'Gestão de Funcionários',
    '/planejamento': 'Planejamento de Férias',
    '/historico': 'Histórico de Planejamentos',
    '/relatorios': 'Relatórios Estratégicos',
};

export default function Header() {
    const pathname = usePathname();

    // Encontra o título correspondente à rota atual
    // Para rotas dinâmicas (ex: /funcionarios/123), ele pegará o título da rota base.
    const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] || 'Sistema de Férias';


    return (
        <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            {/* Futuramente, podemos adicionar outros elementos aqui, como notificações ou um menu de usuário */}
        </header>
    );
}