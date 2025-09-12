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
    CheckCircleOutlined,
    IdcardOutlined
} from '@ant-design/icons';
import { router, usePage } from '@inertiajs/react';
import { usePermissions } from '../hooks/usePermissions';
import { useBranch } from '../hooks/useBranch';
import SidebarToggleButton from './SidebarToggleButton';
import { getAvailableThemes, getCurrentTheme, setTheme } from '../utils/themeManager';
import styles from './Sidebar.module.scss';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = forwardRef(({ collapsed, auth, onToggle, isMobile = false, isVisible = true }, ref) => {
    const { can } = usePermissions();
    const { selectedBranch } = useBranch();
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
        
        // Mapear rutas a claves del menú (solo selección, no apertura automática)
        if (path.includes('/admin/dashboard')) {
            setSelectedKeys(['dashboard']);
        } else if (path.includes('/admin/modelos')) {
            setSelectedKeys(['modelos.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/empleados')) {
            setSelectedKeys(['empleados.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/invitaciones')) {
            setSelectedKeys(['empleados.invitaciones']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/caja')) {
            setSelectedKeys(['caja.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/academia')) {
            setSelectedKeys(['academia.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/permisos')) {
            setSelectedKeys(['settings.permissions']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/settings')) {
            setSelectedKeys(['settings.users']);
            // No establecer openKeys automáticamente
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

    // Manejar clics en elementos del menú en móvil
    const handleMenuClick = (item) => {
        if (item.onClick) {
            item.onClick();
            // En móvil, cerrar sidebar después de hacer clic
            if (isMobile && onToggle) {
                onToggle();
            }
        }
    };

    // Crear elementos del menú con manejo de clics
    const createMenuItems = (items) => {
        return items.map(item => ({
            ...item,
            onClick: () => handleMenuClick(item),
            children: item.children ? createMenuItems(item.children) : undefined
        }));
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
                    onClick: () => {
                        const url = selectedBranch?.id 
                            ? `/admin/modelos?branch_id=${selectedBranch.id}`
                            : '/admin/modelos';
                        router.visit(url);
                    }
                },
            ]
        },
        {
            key: 'empleados',
            icon: <IdcardOutlined />, 
            label: 'Empleados',
            children: [
                { 
                    key: 'empleados.index', 
                    label: 'Lista de Empleados',
                    onClick: () => router.visit('/admin/empleados')
                },
                { 
                    key: 'empleados.invitaciones', 
                    label: 'Invitaciones',
                    onClick: () => router.visit('/admin/invitaciones')
                }
            ]
        },
        ...(can('ver_tienda') ? [{
            key: 'tienda',
            icon: <DollarOutlined />,
            label: 'Tienda',
            onClick: () => {
                const url = '/admin/tienda';
                router.visit(url);
            }
        }] : []),
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
            key: 'cash_register',
            icon: <DollarOutlined />,
            label: 'Caja',
            children: [
                {
                    key: 'cash_register.index',
                    label: 'Cierres de caja',
                    onClick: () => router.visit('/admin/cash-register')
                }
                // { 
                //     key: 'cash_register.movements', 
                //     label: 'Movimientos',
                //     onClick: () => router.visit('/admin/cash-movements')
                // }
                ,{ 
                    key: 'cash_register.invoices', 
                    label: 'Facturas',
                    onClick: () => router.visit('/admin/invoices')
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
                ...(can('view_branches') ? [{
                    key: 'settings.sedes',
                    label: 'Sedes',
                    onClick: () => router.visit('/admin/sedes')
                }] : []),
                ...(can('view_permissions') ? [{ 
                    key: 'settings.permissions', 
                    label: 'Permisos',
                    onClick: () => router.visit('/admin/permisos')
                }] : []),
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
        if (item.key === 'empleados') return can('view_employees') || can('view_invitations');
        if (item.key === 'cash_register') return can('view_cash_registers');
        if (item.key === 'academia') return can('view_academia');
        return true;
    });

    // Crear elementos del menú con manejo de clics para móvil
    const processedMenuItems = createMenuItems(menuItems);

    // Overlay para móvil
    const overlay = isMobile && isVisible && (
        <div 
            className={styles.overlay} 
            onClick={onToggle}
        />
    );

    return (
        <>
            {overlay}
            <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                width={250}
                className={`${styles.sidebar} ${isMobile ? styles.mobile : ''} ${isVisible ? styles.visible : styles.hidden}`}
            >
            {/* Logo */}
            <div className={styles.logoContainer}>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/storage/logos/logo.png" alt="CMM" style={{ width: 80, padding: '6px', filter: 'brightness(0) invert(1)' }} />
                </div>
                
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
                items={processedMenuItems}
                className={styles.menu}
            />
        </Sider>
        </>
    );
});

export default Sidebar; 