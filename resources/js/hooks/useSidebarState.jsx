import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'cmm_sidebar_collapsed';

export function useSidebarState() {
    // Obtener el estado inicial del localStorage
    const getInitialState = () => {
        try {
            const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
            // Si no existe, empezar abierto (false = no colapsado)
            return saved ? JSON.parse(saved) : false;
        } catch (error) {
            console.warn('Error reading sidebar state from localStorage:', error);
            // En caso de error, empezar abierto
            return false;
        }
    };

    const [collapsed, setCollapsed] = useState(getInitialState);

    // Guardar en localStorage cada vez que cambie el estado
    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(collapsed));
        } catch (error) {
            console.warn('Error saving sidebar state to localStorage:', error);
        }
    }, [collapsed]);

    const toggle = () => {
        setCollapsed(!collapsed);
    };

    const collapse = () => {
        setCollapsed(true);
    };

    const expand = () => {
        setCollapsed(false);
    };

    return {
        collapsed,
        toggle,
        collapse,
        expand
    };
} 