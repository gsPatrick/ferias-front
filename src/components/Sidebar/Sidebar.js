// src/components/Sidebar/Sidebar.js
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
    Building2, // Ícone para o logo
    ChevronLeft, // NOVO: Ícone para indicar colapsar
    ChevronRight // NOVO: Ícone para indicar expandir
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

export default function Sidebar({ isCollapsed, toggleCollapse }) { // NOVO: Recebe props isCollapsed e toggleCollapse
    const pathname = usePathname();

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <div className={styles.logoContainer}>
                <Building2 size={isCollapsed ? 24 : 32} color="var(--cor-primaria-medio)" /> {/* Ajustar tamanho do ícone */}
                {!isCollapsed && <h1 className={styles.logoTitle}>Gestão de Férias</h1>} {/* Esconder título */}
                <button className={styles.toggleButton} onClick={toggleCollapse}> {/* Botão de toggle */}
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
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
                                    {!isCollapsed && <span>{item.label}</span>} {/* Esconder label */}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    {!isCollapsed && <span className={styles.userName}>{mockUser.name}</span>} {/* Esconder info */}
                    {!isCollapsed && <span className={styles.userEmail}>{mockUser.email}</span>}
                </div>
                <button className={styles.logoutButton}>
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}