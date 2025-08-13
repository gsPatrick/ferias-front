// src/app/(dashboard)/layout.js
'use client';

import { useState, useEffect } from 'react';
// Removido: import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
    // Removido: isSidebarCollapsed state e a lógica de resize/toggle

    return (
        <div className={styles.layout}>
            {/* Removido: Sidebar component */}
            <div className={styles.mainContainer}>
                {/* Não precisamos mais passar isSidebarCollapsed para o Header */}
                <Header />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}