import './bootstrap';
import '../css/app.css';
import 'antd/dist/reset.css'; // Estilos de Ant Design

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { App, ConfigProvider } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import { initializeTheme } from './utils/themeManager';
import { useTheme } from './hooks/useTheme';
import { BranchProvider } from './hooks/useBranch';

// Componente que envuelve la app con el ConfigProvider dinámico
function AppWithTheme({ children }) {
    const theme = useTheme();
    
    return (
        <ConfigProvider theme={theme}>
            <App>
                <BranchProvider>
                    {children}
                </BranchProvider>
            </App>
        </ConfigProvider>
    );
}

export function AppWithBranchProvider({ children }) {
  return (
    <BranchProvider>
      {children}
    </BranchProvider>
  );
}

createInertiaApp({
    title: (title) => `${title} - CMM`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App: InertiaApp, props }) {
        // Inicializar tema antes de renderizar
        initializeTheme();
        
        const root = createRoot(el);
        root.render(
            <AppWithTheme>
                <InertiaApp {...props} />
            </AppWithTheme>
        );
    },
}); 