// src/components/Header/Header.js
'use client';

import { useState, useEffect } from 'react'; // NOVO: Adicionado useEffect
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // NOVO: Adicionado useRouter
import styles from './Header.module.css';
import Image from 'next/image';
import { Menu, X, LogOut, User } from 'lucide-react';

const navItems = [
        { href: '/dashboard', label: 'Dashboard' },
    { href: '/funcionarios', label: 'Funcionários' },
    { href: '/importacao', label: 'Importar Planilha' },
        { href: '/planejamento', label: 'Planejamento' },

];

// REMOVIDO: O mockUser não é mais necessário
// const mockUser = {
//     name: 'Admin RH',
//     email: 'admin@empresa.com'
// }

export default function Header() {
    const pathname = usePathname();
    const router = useRouter(); // NOVO: Hook para navegação
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // NOVO: Estado para o usuário logado

    // NOVO: Efeito para carregar os dados do usuário do localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }
    }, []);


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // NOVO: Função para realizar o logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
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
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`} onClick={toggleMenu}>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.headerRight}>
                <div className={styles.userInfo}>
                    <User size={20} className={styles.userIcon} />
                    {/* ALTERADO: Exibe o nome do usuário do estado, com um fallback */}
                    <span className={styles.userName}>{currentUser ? currentUser.name : 'Usuário'}</span>
                </div>
                {/* ALTERADO: Adicionado onClick ao botão de logout */}
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