'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';
import styles from './FilterPanel.module.css';
import { SlidersHorizontal, X } from 'lucide-react';

export default function FilterPanel({ isOpen, onClose, onApplyFilters, initialFilters = {} }) {
    // Estado local para os dados do formulário de filtro
    const [formData, setFormData] = useState(initialFilters);

    // Efeito para sincronizar o estado local do formulário com os filtros iniciais (da URL)
    useEffect(() => {
        setFormData(initialFilters);
    }, [initialFilters]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Dados mockados para os selects (em um app real, viriam da API)
    const mockMunicipios = ['Teresina', 'Parnaíba', 'Floriano', 'Picos', 'Outro'];
    const mockCategoriasTrabalhador = ['Mensalista', 'Intermitente', 'Horista', 'Terceirizado', 'Outro'];
    const mockConvencoes = ['1-SEEACEPI', '10-SECAPI INTERIOR', 'SIND.COMERCIARIOS', 'Outra'];
    const mockStatusContrato = ['Ativo', 'Inativo'];
    const mockTipoContrato = ['CLT', 'PJ', 'Estágio', 'Temporário'];
    const mockHorario = ['Integral', 'Meio Período', 'Noturno', 'Flexível'];
    const mockFiliais = ['Filial 01', 'Filial 02', 'Filial 03']; // Exemplo
    const mockCargos = ['Analista RH', 'Gerente', 'Assistente Administrativo', 'Desenvolvedor']; // Exemplo

    const handleApply = () => {
        onApplyFilters(formData);
    };

    const handleClear = () => {
        setFormData({}); // Limpa o estado local do formulário
        onApplyFilters({}); // Notifica o pai para limpar os filtros
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
                            <h4>Dados do Funcionário</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="status">Status do Contrato</label>
                                <select id="status" name="status" value={formData.status || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {mockStatusContrato.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_admissao_inicio">Data de Admissão (Início)</label>
                                <input id="dth_admissao_inicio" name="dth_admissao_inicio" type="date" value={formData.dth_admissao_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_admissao_fim">Data de Admissão (Fim)</label>
                                <input id="dth_admissao_fim" name="dth_admissao_fim" type="date" value={formData.dth_admissao_fim || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="salario_base_min">Salário Base (Mínimo)</label>
                                <input id="salario_base_min" name="salario_base_min" type="number" step="0.01" placeholder="Ex: 1500" value={formData.salario_base_min || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="salario_base_max">Salário Base (Máximo)</label>
                                <input id="salario_base_max" name="salario_base_max" type="number" step="0.01" placeholder="Ex: 5000" value={formData.salario_base_max || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="contrato_tipo">Tipo de Contrato</label>
                                <select id="contrato_tipo" name="contrato_tipo" value={formData.contrato_tipo || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {mockTipoContrato.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria_trabalhador">Categoria do Trabalhador</label>
                                <select id="categoria_trabalhador" name="categoria_trabalhador" value={formData.categoria_trabalhador || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {mockCategoriasTrabalhador.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="horario_tipo">Horário de Trabalho</label>
                                <select id="horario_tipo" name="horario_tipo" value={formData.horario_tipo || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {mockHorario.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>

                            <h4>Férias e Períodos</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="dias_para_vencer">Férias Vencendo em (dias)</label>
                                <input id="dias_para_vencer" name="dias_para_vencer" type="number" placeholder="Ex: 30" value={formData.dias_para_vencer || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_limite_ferias_inicio">Data Limite Férias (Início)</label>
                                <input id="dth_limite_ferias_inicio" name="dth_limite_ferias_inicio" type="date" value={formData.dth_limite_ferias_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="dth_limite_ferias_fim">Data Limite Férias (Fim)</label>
                                <input id="dth_limite_ferias_fim" name="dth_limite_ferias_fim" type="date" value={formData.dth_limite_ferias_fim || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="saldo_dias_ferias_min">Saldo de Dias de Férias (Mínimo)</label>
                                <input id="saldo_dias_ferias_min" name="saldo_dias_ferias_min" type="number" placeholder="Ex: 15" value={formData.saldo_dias_ferias_min || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="saldo_dias_ferias_max">Saldo de Dias de Férias (Máximo)</label>
                                <input id="saldo_dias_ferias_max" name="saldo_dias_ferias_max" type="number" placeholder="Ex: 30" value={formData.saldo_dias_ferias_max || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="ultima_ferias_inicio">Últimas Férias (Início Gozo)</label>
                                <input id="ultima_ferias_inicio" name="ultima_ferias_inicio" type="date" value={formData.ultima_ferias_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="ultima_ferias_fim">Últimas Férias (Fim Gozo)</label>
                                <input id="ultima_ferias_fim" name="ultima_ferias_fim" type="date" value={formData.ultima_ferias_fim || ''} onChange={handleChange}/>
                            </div>
                             <div className={styles.formGroup}>
                                <label htmlFor="periodo_aquisitivo_inicio">Período Aquisitivo (Início)</label>
                                <input id="periodo_aquisitivo_inicio" name="periodo_aquisitivo_inicio" type="date" value={formData.periodo_aquisitivo_inicio || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="periodo_aquisitivo_fim">Período Aquisitivo (Fim)</label>
                                <input id="periodo_aquisitivo_fim" name="periodo_aquisitivo_fim" type="date" value={formData.periodo_aquisitivo_fim || ''} onChange={handleChange}/>
                            </div>

                            <h4>Estrutura Organizacional</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="municipio_local_trabalho">Município do Local de Trabalho</label>
                                <select id="municipio_local_trabalho" name="municipio_local_trabalho" value={formData.municipio_local_trabalho || ''} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {mockMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="razao_social_filial">Razão Social Filial</label>
                                <select id="razao_social_filial" name="razao_social_filial" value={formData.razao_social_filial || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {mockFiliais.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                             <div className={styles.formGroup}>
                                <label htmlFor="codigo_filial">Código da Filial</label>
                                <input id="codigo_filial" name="codigo_filial" type="text" placeholder="Ex: FIL001" value={formData.codigo_filial || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="local_de_trabalho_descricao">Local de Trabalho (Descrição)</label>
                                <input id="local_de_trabalho_descricao" name="local_de_trabalho_descricao" type="text" placeholder="Ex: Escritório Centro" value={formData.local_de_trabalho_descricao || ''} onChange={handleChange}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria_cargo">Categoria/Cargo</label>
                                <select id="categoria_cargo" name="categoria_cargo" value={formData.categoria_cargo || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {mockCargos.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="convencao">Convenção Coletiva</label>
                                <select id="convencao" name="convencao" value={formData.convencao || ''} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {mockConvencoes.map(c => <option key={c} value={c}>{c}</option>)}
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