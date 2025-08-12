import Link from 'next/link';
import styles from './ActionPanel.module.css';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

/**
 * @param {object} props
 * @param {Array<object>} props.items - Itens para exibir. Ex: [{ title, count, link, variant }]
 */
export default function ActionPanel({ items = [] }) {
    const getVariantClass = (variant) => {
        if (variant === 'danger') return styles.danger;
        if (variant === 'warning') return styles.warning;
        return styles.info;
    };

    const getIcon = (variant) => {
        if (variant === 'danger') return <AlertTriangle size={24} />;
        if (variant === 'warning') return <Clock size={24} />;
        return <CheckCircle size={24} />;
    };

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Ações Requeridas</h3>
            <div className={styles.itemsContainer}>
                {items.length > 0 ? items.map((item, index) => (
                    <Link href={item.link} key={index} className={`${styles.item} ${getVariantClass(item.variant)}`}>
                        <div className={styles.itemIcon}>
                            {getIcon(item.variant)}
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.itemCount}>{item.count}</span>
                        </div>
                    </Link>
                )) : <p className={styles.noActions}>Nenhuma ação pendente. Tudo em ordem!</p>}
            </div>
        </div>
    );
}