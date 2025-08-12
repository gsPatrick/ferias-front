'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';
import styles from './FilterPanel.module.css';
import { SlidersHorizontal, X } from 'lucide-react';

export default function FilterPanel({ isOpen, onClose, onApplyFilters }) {
    // Dados mockados para os selects
    const mockMunicipios = ['Teresina', 'Parnaíba', 'Floriano', 'Picos'];
    const mockCategorias = ['Mensalista', 'Intermitente'];
    const mockConvencoes = ['1-SEEACEPI', '10-SECAPI INTERIOR', 'Outra'];

    const handleApply = () => {
        // Em um app real, coletaria os dados dos inputs
        onApplyFilters({ municipio: 'Teresina' }); 
        onClose();
    };

    const handleClear = () => {
        onApplyFilters({}); // Limpa os filtros
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={styles.panel}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className={styles.header}>
                            <SlidersHorizontal size={20} />
                            <h3>Filtros Avançados</h3>
                            <button onClick={onClose} className={styles.closeButton}><X size={24}/></button>
                        </div>
                        <div className={styles.content}>
                            <div className={styles.formGroup}>
                                <label>Município do Local de Trabalho</label>
                                <select><option value="">Todos</option>{mockMunicipios.map(m => <option key={m} value={m}>{m}</option>)}</select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Categoria do Trabalhador</label>
                                <select><option value="">Todas</option>{mockCategorias.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Convenção Coletiva</label>
                                <select><option value="">Todas</option>{mockConvencoes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status do Contrato</label>
                                <select><option value="">Todos</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select>
                            </div>
                             <div className={styles.formGroup}>
                                <label>Com Férias Vencendo em (dias)</label>
                                <input type="number" placeholder="Ex: 90"/>
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