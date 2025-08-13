// src/components/Pagination/Pagination.js
import styles from './Pagination.module.css';
import Button from '../Button/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.totalPages <= 1) {
        return null;
    }

    const { currentPage, totalPages } = pagination;

    return (
        <div className={styles.pagination}>
            <span>Página {currentPage} de {totalPages}</span>
            <div className={styles.buttons}>
                <Button 
                    variant="secondary" 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={16}/> Anterior
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Próxima <ChevronRight size={16}/>
                </Button>
            </div>
        </div>
    );
}

