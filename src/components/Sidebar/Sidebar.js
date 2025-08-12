'use client'; // Necessário para usar hooks como usePathname e para interações

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { 
    LayoutDashboard, 
    Users, 
    CalendarClock, 
    History, 
    LineChart, 
    UploadCloud,
    LogOut,
    Building2 // Ícone para o logo
} from 'lucide-react';

// Dados mockados dos itens de navegação
const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/funcionarios', label: 'Funcionários', icon: Users },
    { href: '/planejamento', label: 'Planejamento', icon: CalendarClock },
    { href: '/historico', label: 'Histórico', icon: History },
    { href: '/relatorios', label: 'Relatórios', icon: LineChart },
        { href: '/importacao', label: 'Importar Planilha', icon: UploadCloud }, // NOVA PÁGINA

];

// Dados mockados do usuário
const mockUser = {
    name: 'Admin RH',
    email: 'admin@empresa.com'
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <Building2 size={32} color="var(--cor-primaria-medio)" />
                <h1 className={styles.logoTitle}>Gestão de Férias</h1>
            </div>
            
            <nav className={styles.nav}>
                <ul>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{mockUser.name}</span>
                    <span className={styles.userEmail}>{mockUser.email}</span>
                </div>
                <button className={styles.logoutButton}>
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}