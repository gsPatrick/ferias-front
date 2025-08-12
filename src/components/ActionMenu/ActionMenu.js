'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import styles from './ActionMenu.module.css';

/**
 * @param {object} props
 * @param {Array<object>} props.items - Array de itens do menu. Ex: [{ label, icon, onClick, variant }]
 */
export default function ActionMenu({ items = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Fecha o menu se clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleItemClick = (onClick) => {
        onClick();
        setIsOpen(false);
    };

    return (
        <div className={styles.menuWrapper} ref={menuRef}>
            <button className={styles.triggerButton} onClick={() => setIsOpen(!isOpen)}>
                <MoreHorizontal size={20} />
            </button>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    <ul>
                        {items.map((item, index) => (
                            <li 
                                key={index} 
                                onClick={() => handleItemClick(item.onClick)}
                                className={styles[item.variant]} // Para variantes como 'danger'
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}