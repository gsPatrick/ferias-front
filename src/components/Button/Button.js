// src/components/Button/Button.js
import styles from './Button.module.css';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children - O conteúdo do botão (texto, ícone)
 * @param {function} props.onClick - A função a ser executada no clique
 * @param {'primary' | 'secondary' | 'danger'} [props.variant='primary'] - A variante visual do botão
 * @param {React.ReactNode} [props.icon] - Um ícone (opcional) para ser exibido à esquerda do texto
 * @param {string} [props.className] - Classes CSS adicionais
 */
export default function Button({ 
    children, 
    onClick, 
    variant = 'primary', 
    icon,
    className = '',
    ...props 
}) {
    return (
        <button 
            className={`${styles.button} ${styles[variant]} ${className}`} 
            onClick={onClick}
            {...props}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </button>
    );
}