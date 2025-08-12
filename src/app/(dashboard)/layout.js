// src/app/(dashboard)/layout.js
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import styles from './layout.module.css';

// Este layout NÃO tem <html> ou <body>
export default function DashboardLayout({ children }) {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.mainContainer}>
                <Header />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}