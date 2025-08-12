'use client'; // Necessário para estado e eventos

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * @param {object} props
 * @param {boolean} props.isOpen - Controla a visibilidade do modal.
 * @param {function} props.onClose - Função para fechar o modal.
 * @param {string} props.title - O título do modal.
 * @param {React.ReactNode} props.children - O conteúdo interno do modal (formulário, texto, etc.).
 */
export default function Modal({ isOpen, onClose, title, children }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modalContent}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()} // Impede que o clique feche o modal
                    >
                        <div className={styles.header}>
                            <h2 className={styles.title}>{title}</h2>
                            <button onClick={onClose} className={styles.closeButton}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.body}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}