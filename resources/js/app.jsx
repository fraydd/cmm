import './bootstrap';
import '../css/app.css';
import 'antd/dist/reset.css'; // Estilos de Ant Design

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { App, ConfigProvider } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import { initializeTheme } from './utils/themeManager';
import { BranchProvider } from './hooks/useBranch';

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
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#547792', // Usar color de la paleta CMM
                        borderRadius: 6,
                    },
                }}
            >
                <App>
                    <AppWithBranchProvider>
                        <InertiaApp {...props} />
                    </AppWithBranchProvider>
                </App>
            </ConfigProvider>
        );
    },
}); 