// src/components/Header/Header.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import Image from 'next/image';
import { Menu, X, LogOut, User } from 'lucide-react';

const navItems = [
    { href: '/funcionarios', label: 'Funcionários' },
    { href: '/importacao', label: 'Importar Planilha' },
    { href: '/dashboard', label: 'Dashboard' },
];

const mockUser = {
    name: 'Admin RH',
    email: 'admin@empresa.com'
}

export default function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <Link href="/dashboard" className={styles.logoContainer}>
                    {/* Substitua "logo.png" pelo caminho correto se não estiver na raiz de public */}
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
                    <span className={styles.userName}>{mockUser.name}</span>
                </div>
                <button className={styles.logoutButton}>
                    <LogOut size={20} />
                </button>
                
                {/* Botão do menu hamburguer para mobile */}
                <button className={styles.menuToggle} onClick={toggleMenu}>
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}