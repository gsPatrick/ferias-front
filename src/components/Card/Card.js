// src/components/Card/Card.js
import styles from './Card.module.css';

export default function Card({ icon, title, value, color, onClick }) {
    const cardStyle = { '--card-accent-color': color };
    
    // Adiciona a classe 'clickable' se uma função onClick for fornecida
    const cardClassName = `${styles.card} ${onClick ? styles.clickable : ''}`;

    return (
        <div className={cardClassName} style={cardStyle} onClick={onClick}>
            <div className={styles.iconWrapper}>
                {icon}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.value}>{value}</p>
            </div>
        </div>
    );
}