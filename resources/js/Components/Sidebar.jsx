import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
    UserOutlined, 
    DollarOutlined, 
    TeamOutlined,
    DashboardOutlined,
    SettingOutlined,
    MailOutlined,
    SkinOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { router, usePage } from '@inertiajs/react';
import { usePermissions } from '../hooks/usePermissions';
import SidebarToggleButton from './SidebarToggleButton';
import { getAvailableThemes, getCurrentTheme, setTheme } from '../utils/themeManager';
import styles from './Sidebar.module.scss';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = forwardRef(({ collapsed, auth, onToggle }, ref) => {
    const { can } = usePermissions();
    const { url } = usePage();
    const [selectedKeys, setSelectedKeys] = useState(['dashboard']);
    const [openKeys, setOpenKeys] = useState([]);
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

    // Exponer métodos para control externo
    useImperativeHandle(ref, () => ({
        toggle: () => onToggle && onToggle(),
        collapse: () => !collapsed && onToggle && onToggle(),
        expand: () => collapsed && onToggle && onToggle()
    }));

    // Detectar la ruta actual y actualizar las claves seleccionadas
    useEffect(() => {
        const path = url;
        
        // Mapear rutas a claves del menú
        if (path.includes('/admin/dashboard')) {
            setSelectedKeys(['dashboard']);
        } else if (path.includes('/admin/modelos')) {
            setSelectedKeys(['modelos.index']);
            setOpenKeys(['modelos']);
        } else if (path.includes('/admin/invitaciones')) {
            setSelectedKeys(['invitaciones']);
        } else if (path.includes('/admin/caja')) {
            setSelectedKeys(['caja.index']);
            setOpenKeys(['caja']);
        } else if (path.includes('/admin/academia')) {
            setSelectedKeys(['academia.index']);
            setOpenKeys(['academia']);
        } else if (path.includes('/admin/settings')) {
            setSelectedKeys(['settings.users']);
            setOpenKeys(['settings']);
        } else {
            setSelectedKeys(['dashboard']);
        }
    }, [url]);

    // Función para cambiar tema
    const handleThemeChange = (themeName) => {
        setTheme(themeName);
        setCurrentTheme(themeName);
    };

    // Obtener temas disponibles dinámicamente
    const availableThemes = getAvailableThemes();
    
    // Crear submenú de temas
    const themeSubmenu = {
        key: 'settings.themes',
        label: 'Temas',
        icon: <SkinOutlined />,
        children: availableThemes.map(themeName => ({
            key: `theme.${themeName}`,
            label: themeName.charAt(0).toUpperCase() + themeName.slice(1),
            onClick: () => handleThemeChange(themeName),
            className: currentTheme === themeName ? styles.activeTheme : ''
        }))
    };

    // Menú basado en permisos
    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => router.visit('/admin/dashboard')
        },
        {
            key: 'modelos',
            icon: <UserOutlined />,
            label: 'Modelos',
            children: [
                { 
                    key: 'modelos.index', 
                    label: 'Lista de Modelos',
                    onClick: () => router.visit('/admin/modelos')
                },
                { 
                    key: 'modelos.create', 
                    label: 'Nuevo Modelo',
                    onClick: () => router.visit('/admin/modelos/create')
                }
            ]
        },
        {
            key: 'invitaciones',
            icon: <MailOutlined />,
            label: 'Invitaciones',
            onClick: () => router.visit('/admin/invitaciones')
        },
        {
            key: 'asistencia',
            label: 'Asistencia',
            icon: <ClockCircleOutlined />,
            children: [
                {
                    key: 'checkin',
                    label: 'Check-in',
                    icon: <CheckCircleOutlined />,
                    onClick: () => router.visit('/admin/checkin')
                },
                {
                    key: 'asistencias',
                    label: 'Asistencias',
                    icon: <ClockCircleOutlined />,
                    onClick: () => router.visit('/admin/asistencias')
                }
            ]
        },
        {
            key: 'caja',
            icon: <DollarOutlined />,
            label: 'Caja',
            children: [
                { 
                    key: 'caja.index', 
                    label: 'Flujo de Caja',
                    onClick: () => router.visit('/admin/caja')
                },
                { 
                    key: 'caja.reports', 
                    label: 'Reportes',
                    onClick: () => router.visit('/admin/caja/reports')
                }
            ]
        },
        {
            key: 'academia',
            icon: <TeamOutlined />,
            label: 'Academia',
            children: [
                { 
                    key: 'academia.index', 
                    label: 'Asistencias',
                    onClick: () => router.visit('/admin/academia')
                },
                { 
                    key: 'academia.schedule', 
                    label: 'Horarios',
                    onClick: () => router.visit('/admin/academia/schedule')
                }
            ]
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Configuración',
            children: [
                { 
                    key: 'settings.users', 
                    label: 'Usuarios',
                    onClick: () => router.visit('/admin/settings/users')
                },
                { 
                    key: 'settings.roles', 
                    label: 'Roles y Permisos',
                    onClick: () => router.visit('/admin/settings/roles')
                },
                themeSubmenu
            ]
        }
    ].filter(item => {
        // Filtrar por permisos
        if (item.key === 'dashboard') return true;
        if (item.key === 'settings') return true; // Configuración disponible para todos
        if (item.key === 'modelos') return can('view_modelos');
        if (item.key === 'invitaciones') return can('view_invitations');
        if (item.key === 'caja') return can('view_caja');
        if (item.key === 'academia') return can('view_academia');
        return true;
    });

    return (
        <Sider 
            trigger={null} 
            collapsible 
            collapsed={collapsed}
            width={250}
            className={styles.sidebar}
        >
            {/* Logo */}
            <div className={styles.logoContainer}>
                <Title 
                    level={4} 
                    className={`${styles.logoTitle} ${collapsed ? styles.collapsed : styles.expanded}`}
                >
                    {collapsed ? 'CMM' : 'CMM Admin'}
                </Title>
                
                {/* Botón personalizado para colapsar */}
                <SidebarToggleButton
                    collapsed={collapsed}
                    onToggle={onToggle}
                    tooltip={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                />
            </div>
            
            {/* Menú principal */}
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                onOpenChange={setOpenKeys}
                inlineCollapsed={collapsed}
                items={menuItems}
                className={styles.menu}
            />
        </Sider>
    );
});

export default Sidebar; 