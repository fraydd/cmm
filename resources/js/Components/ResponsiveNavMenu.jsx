import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Dropdown, Space } from 'antd';
import { MoreOutlined, CheckOutlined } from '@ant-design/icons';
import styles from './ResponsiveNavMenu.module.scss';

const ResponsiveNavMenu = ({ items, activeKey, onItemClick }) => {
    // 🔥 Memoizar items para evitar recálculos innecesarios
    const memoizedItems = useMemo(() => {
        return items;
    }, [JSON.stringify(items)]); // Comparación profunda
    
    const [visibleItems, setVisibleItems] = useState(memoizedItems);
    const [hiddenItems, setHiddenItems] = useState([]);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);
    const itemsRef = useRef([]);

    // Hook para observar cambios en el tamaño del contenedor
    useEffect(() => {
        if (!containerRef.current) return;

        let lastWidth = 0;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const newWidth = entry.contentRect.width;
                const difference = Math.abs(newWidth - lastWidth);
                
                // Solo actualizar si el cambio es significativo (>10px)
                if (difference > 10) {
                    lastWidth = newWidth;
                    setContainerWidth(newWidth);
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const calculateVisibleItems = () => {
            if (!containerRef.current) return;

            const currentContainerWidth = containerRef.current.offsetWidth;
            const moreButtonWidth = 50; // Ancho aproximado del botón "Más"
            const gap = 8; // Gap entre elementos
            
            // Primero, renderizar todos los elementos temporalmente para medir
            const tempVisible = [...memoizedItems];
            const tempHidden = [];
            
            setVisibleItems(tempVisible);
            setHiddenItems(tempHidden);
            
            // Esperar un momento para que se rendericen los elementos
            setTimeout(() => {
                let totalWidth = 0;
                let visibleCount = 0;
                
                // Calcular el ancho real de cada elemento
                for (let i = 0; i < memoizedItems.length; i++) {
                    const itemElement = itemsRef.current[i];
                    if (itemElement) {
                        const itemWidth = itemElement.offsetWidth + gap;
                        
                        // Si es el último elemento y cabe todo, no necesitamos botón "Más"
                        const needsMoreButton = (i < memoizedItems.length - 1) || (visibleCount < memoizedItems.length - 1);
                        const requiredSpace = needsMoreButton ? moreButtonWidth : 0;
                        
                        if (totalWidth + itemWidth + requiredSpace <= currentContainerWidth) {
                            totalWidth += itemWidth;
                            visibleCount++;
                        } else {
                            break;
                        }
                    }
                }
                
                // Si todos los elementos caben, mostrar todos
                if (visibleCount === memoizedItems.length) {
                    setVisibleItems(memoizedItems);
                    setHiddenItems([]);
                } else {
                    // Asegurarse de que hay espacio para el botón "Más"
                    while (visibleCount > 0) {
                        const currentTotalWidth = itemsRef.current
                            .slice(0, visibleCount)
                            .reduce((acc, el) => acc + (el ? el.offsetWidth + gap : 0), 0);
                        
                        if (currentTotalWidth + moreButtonWidth <= currentContainerWidth) {
                            break;
                        }
                        visibleCount--;
                    }
                    
                    setVisibleItems(memoizedItems.slice(0, visibleCount));
                    setHiddenItems(memoizedItems.slice(visibleCount));
                }
            }, 10);
        };

        // Calcular inicialmente y en cada cambio de items
        const timeoutId = setTimeout(calculateVisibleItems, 50);

        // Recalcular al redimensionar
        const handleResize = () => {
            calculateVisibleItems();
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, [memoizedItems]); // 🔥 Usar memoizedItems en lugar de items

    const dropdownItems = hiddenItems.map(item => ({
        key: item.key,
        label: (
            <div className={styles.dropdownItemContainer}>
                <span>{item.label}</span>
                {activeKey === item.key && (
                    <CheckOutlined 
                        className={styles.dropdownCheckIcon}
                    />
                )}
            </div>
        ),
        onClick: () => onItemClick(item.key)
    }));

    return (
        <div className={styles.navContainer} ref={containerRef}>
            <div className={styles.visibleItems}>
                {visibleItems.map((item, index) => (
                    <Button
                        key={item.key}
                        ref={el => itemsRef.current[index] = el}
                        type="text"
                        size="small"
                        onClick={() => onItemClick(item.key)}
                        className={`${styles.navItem} ${activeKey === item.key ? styles.navItemActive : ''}`}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
            
            {hiddenItems.length > 0 && (
                <Dropdown
                    menu={{ items: dropdownItems }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <Button 
                        size="small" 
                        icon={<MoreOutlined />}
                        className={`${styles.moreButton} ${
                            hiddenItems.some(item => item.key === activeKey) 
                                ? styles.moreButtonActive 
                                : ''
                        }`}
                    >
                        Más
                    </Button>
                </Dropdown>
            )}
        </div>
    );
};

export default ResponsiveNavMenu;
