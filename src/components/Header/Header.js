// src/components/Header/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import Image from 'next/image';
import { Menu, X, LogOut, User } from 'lucide-react';

// ==========================================================
// ATUALIZAÇÃO: Adicionado o novo link para a página de Substitutos
// ==========================================================
const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/funcionarios', label: 'Funcionários' },
    { href: '/afastados', label: 'Afastados' },
    { href: '/planejamento', label: 'Planejamento' },
    { href: '/planejamento/visao-geral', label: 'Visão Geral' },
    { href: '/substitutos', label: 'Substitutos' }, // NOVO ITEM ADICIONADO AQUI
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
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setCurrentUser(userData);
            } catch (error) {
                console.error("Erro ao processar dados do usuário:", error);
                handleLogout();
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
                        // Lógica complexa para destacar corretamente os links de planejamento e visão geral
                        const isVisaoGeral = item.href === '/planejamento/visao-geral';
                        const isPlanejamento = item.href === '/planejamento';

                        let isActive = false;
                        if (isVisaoGeral) {
                            isActive = pathname === item.href;
                        } else if (isPlanejamento) {
                            isActive = pathname === item.href; // Só fica ativo na própria página /planejamento
                        } else {
                            isActive = pathname.startsWith(item.href);
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