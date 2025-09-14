// src/components/ActionMenu/ActionMenu.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ActionMenu.module.css';
import { MoreHorizontal } from 'lucide-react';

const MenuPortal = ({ items, menuPosition, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // --- CORREÇÃO: Usando a classe global 'no-scroll' ---
        document.body.classList.add('no-scroll');

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('no-scroll');
        };
    }, [onClose]);

    const menuStyle = {
        position: 'absolute',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                ref={menuRef}
                className={styles.menuContent}
                style={menuStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                        className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function ActionMenu({ items }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const [portalContainer, setPortalContainer] = useState(null);

    useEffect(() => {
        setPortalContainer(document.body);
    }, []);

    const toggleMenu = (event) => {
        event.stopPropagation();
        
        if (!isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = items.length * 40 + 16;
            
            const top = spaceBelow > menuHeight 
                ? rect.bottom + window.scrollY + 5 
                : rect.top + window.scrollY - menuHeight - 5;

            setMenuPosition({
                top: top,
                left: rect.right + window.scrollX - 150, 
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.actionMenuContainer}>
            <button ref={buttonRef} onClick={toggleMenu} className={styles.menuButton}>
                <MoreHorizontal size={20} />
            </button>
            {isOpen && portalContainer && createPortal(
                <MenuPortal items={items} menuPosition={menuPosition} onClose={() => setIsOpen(false)} />,
                portalContainer
            )}
        </div>
    );
}