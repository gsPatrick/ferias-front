// src/components/FilterPanel/FilterPanel.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import Button from '../Button/Button';
import styles from './FilterPanel.module.css';
import { SlidersHorizontal, X } from 'lucide-react';

// Função para extrair opções únicas de um array de objetos
const getUniqueOptions = (data, key) => {
    if (!data || !Array.isArray(data)) return [];
    const options = new Set(data.map(item => item[key]).filter(Boolean));
    return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
};

export default function FilterPanel({ isOpen, onClose, onApplyFilters, initialFilters = {}, funcionariosData = [] }) {
    const [formData, setFormData] = useState(initialFilters);

    // Agora extrai as opções dos dados recebidos via props
    const filterOptions = {
        status: ['Ativo', 'Inativo'],
        categorias: getUniqueOptions(funcionariosData, 'categoria'),
        categorias_trab: getUniqueOptions(funcionariosData, 'categoria_trab'),
        horarios: getUniqueOptions(funcionariosData, 'horario'),
        escalas: getUniqueOptions(funcionariosData, 'escala'),
        siglas_local: getUniqueOptions(funcionariosData, 'sigla_local'),
        gestoes: getUniqueOptions(funcionariosData, 'des_grupo_contrato'),
        convencoes: getUniqueOptions(funcionariosData, 'convencao'),
        // Adicione aqui outros campos que você queira como select
    };

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
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div className={styles.overlay} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <motion.div className={styles.panel} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                        <div className={styles.header}>
                            <SlidersHorizontal size={20} />
                            <h3>Filtros Avançados</h3>
                            <button onClick={onClose} className={styles.closeButton}><X size={24}/></button>
                        </div>
                        <div className={styles.content}>
                            {/* ========================================================== */}
                            {/* FORMULÁRIO COMPLETO COM TODOS OS CAMPOS DA PLANILHA */}
                            {/* ========================================================== */}
                            
                            <h4>Status e Datas</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="status">Status</label>
                                <select id="status" name="status" value={formData.status || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {filterOptions.status.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_admissao_inicio">Admissão (a partir de)</label>
                                <input id="dth_admissao_inicio" name="dth_admissao_inicio" type="date" value={formData.dth_admissao_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_admissao_fim">Admissão (até)</label>
                                <input id="dth_admissao_fim" name="dth_admissao_fim" type="date" value={formData.dth_admissao_fim || ''} onChange={handleChange}/>
                            </div>

                            <h4>Estrutura Organizacional</h4>
                             <div className={styles.formGroup}>
                                <label htmlFor="des_grupo_contrato">Gestão do Contrato</label>
                                <select id="des_grupo_contrato" name="des_grupo_contrato" value={formData.des_grupo_contrato || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {filterOptions.gestoes.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="municipio_local_trabalho">Município</label>
                                <input id="municipio_local_trabalho" name="municipio_local_trabalho" type="text" placeholder="Digite para filtrar..." value={formData.municipio_local_trabalho || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="sigla_local">Estado (UF)</label>
                                <select id="sigla_local" name="sigla_local" value={formData.sigla_local || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {filterOptions.siglas_local.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {/* Adicionar 'cliente' se for necessário no futuro */}

                            <h4>Cargo e Contrato</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria">Categoria/Cargo</label>
                                <select id="categoria" name="categoria" value={formData.categoria || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {filterOptions.categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria_trab">Categoria do Trabalhador</label>
                                <select id="categoria_trab" name="categoria_trab" value={formData.categoria_trab || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {filterOptions.categorias_trab.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="convencao">Convenção Coletiva</label>
                                <select id="convencao" name="convencao" value={formData.convencao || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {filterOptions.convencoes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="escala">Escala</label>
                                <select id="escala" name="escala" value={formData.escala || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {filterOptions.escalas.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="horario">Horário</label>
                                <select id="horario" name="horario" value={formData.horario || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {filterOptions.horarios.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>

                            <h4>Dados de Férias</h4>
                             <div className={styles.formGroup}>
                                <label htmlFor="dth_limite_ferias_inicio">Data Limite (a partir de)</label>
                                <input id="dth_limite_ferias_inicio" name="dth_limite_ferias_inicio" type="date" value={formData.dth_limite_ferias_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_limite_ferias_fim">Data Limite (até)</label>
                                <input id="dth_limite_ferias_fim" name="dth_limite_ferias_fim" type="date" value={formData.dth_limite_ferias_fim || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="faltas_injustificadas_periodo_min">Qtd. Faltas (Mínimo)</label>
                                <input id="faltas_injustificadas_periodo_min" name="faltas_injustificadas_periodo_min" type="number" placeholder="Ex: 0" value={formData.faltas_injustificadas_periodo_min || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="faltas_injustificadas_periodo_max">Qtd. Faltas (Máximo)</label>
                                <input id="faltas_injustificadas_periodo_max" name="faltas_injustificadas_periodo_max" type="number" placeholder="Ex: 5" value={formData.faltas_injustificadas_periodo_max || ''} onChange={handleChange}/>
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