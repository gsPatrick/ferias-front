// src/components/FilterPanel/FilterPanel.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select'; // IMPORTA O COMPONENTE DE MÚLTIPLA SELEÇÃO
import Button from '../Button/Button';
import styles from './FilterPanel.module.css';
import { SlidersHorizontal, X } from 'lucide-react';

// Estilos customizados para o react-select combinar com o tema do seu projeto
const customSelectStyles = {
    control: (provided) => ({
        ...provided,
        border: '1px solid #D1D5DB',
        borderRadius: 'var(--raio-borda)',
        backgroundColor: 'var(--cor-fundo)',
        padding: '0.3rem',
        minHeight: '50px',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--cor-primaria-medio)' : state.isFocused ? 'var(--cor-fundo)' : 'var(--cor-branco)',
        color: state.isSelected ? 'var(--cor-branco)' : 'var(--cor-texto-principal)',
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: 'var(--cor-fundo)',
        borderRadius: '4px',
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: 'var(--cor-primaria-profundo)',
        fontWeight: '500',
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        ':hover': {
            backgroundColor: '#FFDADA', // Um vermelho claro para indicar exclusão
            color: 'var(--cor-feedback-erro)',
        },
    }),
};


export default function FilterPanel({ isOpen, onClose, onApplyFilters, initialFilters = {}, filterOptions = {} }) {
    const [formData, setFormData] = useState(initialFilters);
    const [selectedCategories, setSelectedCategories] = useState([]);

    useEffect(() => {
        setFormData(initialFilters);
        // Sincroniza o estado do react-select com os filtros iniciais
        const initialCategories = initialFilters.categoria || [];
        setSelectedCategories(initialCategories.map(cat => ({ value: cat, label: cat })));
    }, [initialFilters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler específico para o campo de múltipla seleção de categorias
    const handleMultiSelectChange = (selectedOptions) => {
        setSelectedCategories(selectedOptions);
        const categoryValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setFormData(prev => ({ ...prev, categoria: categoryValues }));
    };

    const handleApply = () => {
        onApplyFilters(formData);
        onClose();
    };
    
    const handleClear = () => {
        setFormData({});
        setSelectedCategories([]); // Limpa também o estado do seletor de categorias
        onApplyFilters({});
    };

    // Formata as opções para o formato que o react-select espera: { value: '...', label: '...' }
    const categoryOptions = filterOptions.categorias?.map(cat => ({ value: cat, label: cat })) || [];

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
                                <Select
                                    id="categoria"
                                    isMulti
                                    isClearable
                                    options={categoryOptions}
                                    value={selectedCategories}
                                    onChange={handleMultiSelectChange}
                                    styles={customSelectStyles}
                                    placeholder="Selecione um ou mais cargos..."
                                    noOptionsMessage={() => "Nenhuma opção encontrada"}
                                />
                            </div>
                             <div className={styles.formGroup}>
                                <label htmlFor="contrato">Tipo de Contrato</label>
                                <select id="contrato" name="contrato" value={formData.contrato || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {/* Mapeia as opções de tipo de contrato vindas da API */}
                                    {filterOptions.contratos?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
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