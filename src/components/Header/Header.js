// src/components/Header/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import Image from 'next/image';
import { Menu, X, LogOut, User } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/funcionarios', label: 'Funcionários' },
    { href: '/afastados', label: 'Afastados' },
    { href: '/planejamento', label: 'Planejamento' },
    { href: '/planejamento/visao-geral', label: 'Visão Geral' },

    { href: '/importacao', label: 'Importar Planilha' },
    { href: '/usuarios', label: 'Usuários' },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Efeito para buscar os dados do usuário do localStorage assim que o componente for montado no navegador.
    useEffect(() => {
        // O localStorage só existe no ambiente do navegador.
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                // Armazena os dados do usuário no estado do componente.
                setCurrentUser(userData);
            } catch (error) {
                console.error("Erro ao processar dados do usuário:", error);
                // Se os dados estiverem corrompidos, força o logout.
                handleLogout();
            }
        }
    }, []); // O array vazio [] garante que este código rode apenas uma vez.

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
                        const isActive = item.href === '/planejamento/visao-geral' 
                            ? pathname === item.href 
                            : pathname.startsWith(item.href) && pathname !== '/planejamento/visao-geral';
                        
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
                {/* A MÁGICA ACONTECE AQUI */}
                {/* Este bloco só é renderizado se 'currentUser' tiver dados */}
                {currentUser && (
                     <div className={styles.userInfo}>
                        <User size={20} className={styles.userIcon} />
                        {/* Exibe o nome do usuário. Se não houver, exibe 'Usuário' como fallback. */}
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