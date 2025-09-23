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
    IdcardOutlined,
    ShopOutlined,
    ToolOutlined,
    BarChartOutlined
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
    const { can, permissions: userPermissions } = usePermissions();
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
        } else if (path.includes('/admin/tienda/surtir')) {
            setSelectedKeys(['tienda.administrar']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/tienda')) {
            setSelectedKeys(['tienda.ventas']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/caja')) {
            setSelectedKeys(['caja.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/academia')) {
            setSelectedKeys(['academia.index']);
            // No establecer openKeys automáticamente
        } else if (path.includes('/admin/roles')) {
            setSelectedKeys(['settings.roles']);
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

    // Definición completa del menú con permisos requeridos
    const allMenuItems = [
        // Dashboard - Sin permisos requeridos (siempre visible)
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => router.visit('/admin/dashboard'),
            requiredPermissions: [] // Sin permisos = siempre visible
        },
        
        // Modelos
        {
            key: 'modelos',
            icon: <UserOutlined />,
            label: 'Modelos',
            requiredPermissions: ['ver_modelos'],
            children: [
                { 
                    key: 'modelos.index', 
                    label: 'Lista de Modelos',
                    onClick: () => {
                        const url = selectedBranch?.id 
                            ? `/admin/modelos?branch_id=${selectedBranch.id}`
                            : '/admin/modelos';
                        router.visit(url);
                    },
                    requiredPermissions: ['ver_modelos']
                }
            ]
        },
        
        // Empleados
        {
            key: 'empleados',
            icon: <IdcardOutlined />, 
            label: 'Empleados',
            requiredPermissions: ['ver_empleados', 'ver_invitaciones'], // OR logic
            children: [
                { 
                    key: 'empleados.index', 
                    label: 'Lista de Empleados',
                    onClick: () => router.visit('/admin/empleados'),
                    requiredPermissions: ['ver_empleados']
                },
                { 
                    key: 'empleados.invitaciones', 
                    label: 'Invitaciones',
                    onClick: () => router.visit('/admin/invitaciones'),
                    requiredPermissions: ['ver_invitaciones']
                }
            ]
        },
        
        // Tienda
        {
            key: 'tienda',
            icon: <DollarOutlined />,
            label: 'Tienda',
            requiredPermissions: ['ver_tienda', 'ver_admin_tienda'], // OR logic
            children: [
                {
                    key: 'tienda.ventas',
                    label: 'Ventas',
                    icon: <ShopOutlined />,
                    onClick: () => router.visit('/admin/tienda'),
                    requiredPermissions: ['ver_tienda']
                },
                {
                    key: 'tienda.administrar',
                    label: 'Administrar',
                    icon: <ToolOutlined />,
                    onClick: () => router.visit('/admin/tienda/surtir'),
                    requiredPermissions: ['ver_admin_tienda']
                }
            ]
        },
        
        // Asistencia
        {
            key: 'asistencia',
            label: 'Asistencia',
            icon: <ClockCircleOutlined />,
            requiredPermissions: ['ver_asistencias', 'crear_asistencias'],
            children: [
                {
                    key: 'checkin',
                    label: 'Check-in',
                    icon: <CheckCircleOutlined />,
                    onClick: () => router.visit('/admin/checkin'),
                    requiredPermissions: ['crear_asistencias']
                },
                {
                    key: 'asistencias',
                    label: 'Asistencias',
                    icon: <ClockCircleOutlined />,
                    onClick: () => router.visit('/admin/asistencias'),
                    requiredPermissions: ['ver_asistencias']
                }
            ]
        },
        
        // Caja
        {
            key: 'cash_register',
            icon: <DollarOutlined />,
            label: 'Caja',
            requiredPermissions: ['ver_cajas', 'ver_facturas'], // OR logic
            children: [
                {
                    key: 'cash_register.index',
                    label: 'Cierres de caja',
                    onClick: () => router.visit('/admin/cash-register'),
                    requiredPermissions: ['ver_cajas']
                },
                { 
                    key: 'cash_register.invoices', 
                    label: 'Facturas',
                    onClick: () => router.visit('/admin/invoices'),
                    requiredPermissions: ['ver_facturas']
                }
            ]
        },
        // Reportes
        {
            key: 'informes',
            icon: <BarChartOutlined />,
            label: 'Reportes',
            onClick: () => router.visit('/admin/informes'),
            requiredPermissions: ['ver_reportes']
        },
        
        // Configuración - Sin permisos requeridos (siempre visible)
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Configuración',
            requiredPermissions: [], // Sin permisos = siempre visible
            children: [
                {
                    key: 'settings.sedes',
                    label: 'Sedes',
                    onClick: () => router.visit('/admin/sedes'),
                    requiredPermissions: ['ver_sedes']
                },
                { 
                    key: 'settings.roles', 
                    label: 'Roles y Permisos',
                    onClick: () => router.visit('/admin/roles'),
                    requiredPermissions: ['ver_roles']
                },
                themeSubmenu // Temas siempre visibles
            ]
        }
    ];

    // Función para verificar si el usuario tiene al menos uno de los permisos requeridos
    const hasRequiredPermission = (requiredPermissions) => {
        // Si no hay permisos requeridos, siempre es visible
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        
        // Verificar si el usuario tiene al menos uno de los permisos (OR logic)
        return requiredPermissions.some(permission => can(permission));
    };

    // Función para filtrar menús recursivamente
    const filterMenuItems = (menuItems) => {
        return menuItems
            .filter(item => hasRequiredPermission(item.requiredPermissions))
            .map(item => ({
                ...item,
                // Si tiene children, filtrarlos también
                ...(item.children && {
                    children: filterMenuItems(item.children)
                })
            }))
            // Remover elementos que no tienen children visibles (si originalmente tenían children)
            .filter(item => {
                if (!item.children) return true;
                return item.children.length > 0;
            });
    };

    // Aplicar filtros de permisos
    const visibleMenuItems = filterMenuItems(allMenuItems);

    // Crear elementos del menú con manejo de clics para móvil
    const processedMenuItems = createMenuItems(visibleMenuItems);

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