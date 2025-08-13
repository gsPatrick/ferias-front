// src/components/ActionMenu/ActionMenu.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ActionMenu.module.css';
import { MoreHorizontal } from 'lucide-react';

// Novo componente para o conteúdo do menu, que será renderizado em um portal
const MenuContent = ({ items, menuPosition, onClose }) => {
    const menuRef = useRef(null);

    // Efeito para fechar o menu ao clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Estilo para posicionar o menu
    const menuStyle = {
        position: 'absolute',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
    };

    return (
        <div ref={menuRef} className={styles.menuContent} style={menuStyle}>
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        item.onClick();
                        onClose(); // Fecha o menu após clicar em um item
                    }}
                    className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};


export default function ActionMenu({ items }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    const toggleMenu = (event) => {
        event.stopPropagation(); // Previne que o clique feche o menu imediatamente

        if (!isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY + 5, // Abaixo do botão
                // Alinha à direita: começa na borda direita do botão e recua a largura do menu (aprox. 150px)
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
            {isOpen && createPortal(
                <MenuContent items={items} menuPosition={menuPosition} onClose={() => setIsOpen(false)} />,
                document.body // O portal renderiza o menu no body
            )}
        </div>
    );
}