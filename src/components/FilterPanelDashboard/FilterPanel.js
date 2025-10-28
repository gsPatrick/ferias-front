// src/components/FilterPanel/FilterPanel.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';
import styles from './FilterPanel.module.css';
import { SlidersHorizontal, X } from 'lucide-react';

export default function FilterPanel({ isOpen, onClose, onApplyFilters, initialFilters = {}, filterOptions = {} }) {
    const [formData, setFormData] = useState(initialFilters);

    useEffect(() => {
        setFormData(initialFilters);
    }, [initialFilters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApplyFilters(formData);
        onClose();
    };
    
    const handleClear = () => {
        setFormData({});
        onApplyFilters({});
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div className={styles.overlay} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div className={styles.panel} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                        <div className={styles.header}>
                            <SlidersHorizontal size={20} />
                            <h3>Filtrar Dashboard</h3>
                            <button onClick={onClose} className={styles.closeButton}><X size={24}/></button>
                        </div>
                        <div className={styles.content}>
                            <h4>Estrutura</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="municipio_local_trabalho">Município</label>
                                <input id="municipio_local_trabalho" name="municipio_local_trabalho" type="text" placeholder="Filtrar por município..." value={formData.municipio_local_trabalho || ''} onChange={handleChange}/>
                            </div>
                             <div className={styles.formGroup}>
                                <label htmlFor="des_grupo_contrato">Gestão do Contrato</label>
                                <select id="des_grupo_contrato" name="des_grupo_contrato" value={formData.des_grupo_contrato || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {filterOptions.gestoes?.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            
                            <h4>Cargo e Contrato</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria">Categoria/Cargo</label>
                                <select id="categoria" name="categoria" value={formData.categoria || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {filterOptions.categorias?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="contrato">Tipo de Contrato</label>
                                <input id="contrato" name="contrato" type="text" placeholder="Filtrar por contrato..." value={formData.contrato || ''} onChange={handleChange}/>
                            </div>
                        </div>
                        <div className={styles.footer}>
                            <Button variant="secondary" onClick={handleClear}>Limpar Filtros</Button>
                            <Button variant="primary" onClick={handleApply}>Aplicar</Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}