import './bootstrap';
import '../css/app.css';
import 'antd/dist/reset.css'; // Estilos de Ant Design

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { App, ConfigProvider } from 'antd';
import '@ant-design/v5-patch-for-react-19';

createInertiaApp({
    title: (title) => `${title} - CMM`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App: InertiaApp, props }) {
        const root = createRoot(el);
        root.render(
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#1890ff',
                        borderRadius: 6,
                    },
                }}
            >
                <App>
                    <InertiaApp {...props} />
                </App>
            </ConfigProvider>
        );
    },
}); 