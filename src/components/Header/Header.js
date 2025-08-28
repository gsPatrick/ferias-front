// src/components/Header/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import Image from 'next/image';
import { Menu, X, LogOut, User } from 'lucide-react';

// ==========================================================
// ALTERADO: Adicionado novo item de navegação para "Visão Geral"
// ==========================================================
const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/funcionarios', label: 'Funcionários' },
    { href: '/afastados', label: 'Afastados' },
    { href: '/planejamento', label: 'Planejamento' },
    { href: '/planejamento/visao-geral', label: 'Visão Geral' }, // NOVO LINK
    { href: '/importacao', label: 'Importar Planilha' },
    { href: '/usuarios', label: 'Usuários' },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Tenta buscar os dados do usuário do localStorage.
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setCurrentUser({ name: userData.nome || 'Admin', ...userData });
            } catch (error) {
                console.error("Erro ao parsear dados do usuário:", error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setCurrentUser(null);
        router.push('/login');
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <Link href="/dashboard" className={styles.logoContainer}>
                    <Image src="/logo.png" alt="Logo da Empresa" width={70} height={50} className={styles.logo} />
                </Link>
            </div>

            <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
                <button className={styles.closeMenuButton} onClick={toggleMenu}>
                    <X size={24} />
                </button>
                <ul>
                    {navItems.map((item) => {
                        // Lógica de ativação ajustada para corresponder exatamente ou ao início do caminho
                        const isActive = item.href === '/planejamento/visao-geral' 
                            ? pathname === item.href 
                            : pathname.startsWith(item.href) && pathname !== '/planejamento/visao-geral';
                        
                        // Lógica especial para o link de Planejamento não ficar ativo quando Visão Geral estiver
                        if (item.href === '/planejamento' && pathname === '/planejamento/visao-geral') {
                            const isActiveOverride = false;
                             return (
                                <li key={item.href}>
                                    <Link 
                                        href={item.href} 
                                        className={`${styles.navLink} ${isActiveOverride ? styles.active : ''}`} 
                                        onClick={() => isMenuOpen && toggleMenu()}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        }
                        
                        return (
                            <li key={item.href}>
                                <Link 
                                    href={item.href} 
                                    className={`${styles.navLink} ${isActive ? styles.active : ''}`} 
                                    onClick={() => isMenuOpen && toggleMenu()}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.headerRight}>
                {currentUser && (
                     <div className={styles.userInfo}>
                        <User size={20} className={styles.userIcon} />
                        <span className={styles.userName}>{currentUser.nome || 'Usuário'}</span>
                    </div>
                )}
                <button className={styles.logoutButton} onClick={handleLogout} title="Sair">
                    <LogOut size={20} />
                </button>
                
                <button className={styles.menuToggle} onClick={toggleMenu}>
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}