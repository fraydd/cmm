import React, { useState } from 'react';
import { Layout, Menu, Avatar, Space, Dropdown, Button, Typography } from 'antd';
import { 
    UserOutlined, 
    DollarOutlined, 
    TeamOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    SettingOutlined,
    MailOutlined
} from '@ant-design/icons';
import { Link, usePage, router } from '@inertiajs/react';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children, title = "Panel de Administración" }) {
    const { auth } = usePage().props;
    const [collapsed, setCollapsed] = useState(false);

    // Función para verificar permisos usando los roles del usuario
    const hasPermission = (permission) => {
        if (!auth?.user) return false;
        
        // Si el usuario tiene rol admin, tiene todos los permisos
        if (auth.user.roles?.some(role => role.name === 'admin')) {
            return true;
        }
        
        // Verificar permisos específicos
        return auth.user.permissions?.some(p => p.name === permission) || 
               auth.user.roles?.some(role => role.permissions?.some(p => p.name === permission));
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
                }
            ]
        }
    ].filter(item => {
        // Filtrar por permisos
        if (item.key === 'dashboard') return true;
        if (item.key === 'modelos') return hasPermission('view_modelos');
        if (item.key === 'invitaciones') return hasPermission('view_invitations');
        if (item.key === 'caja') return hasPermission('view_caja');
        if (item.key === 'academia') return hasPermission('view_academia');
        if (item.key === 'settings') return hasPermission('view_users');
        return true;
    });

    // Menú de usuario
    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Mi Perfil',
                onClick: () => router.visit('/admin/profile')
            },
            {
                type: 'divider'
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Cerrar Sesión',
                onClick: () => router.post('/auth/logout')
            }
        ]
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                width={250}
                style={{
                    background: '#001529',
                }}
            >
                {/* Logo */}
                <div style={{ 
                    height: 64, 
                    background: '#001529',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #303030'
                }}>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>
                        {collapsed ? 'CMM' : 'CMM Admin'}
                    </Title>
                </div>
                
                {/* Menú principal */}
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            
            <Layout>
                {/* Header */}
                <Header style={{ 
                    background: '#fff', 
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: '16px', width: 64, height: 64 }}
                        />
                        <Title level={4} style={{ margin: 0, marginLeft: 16 }}>
                            {title}
                        </Title>
                    </div>
                    
                    {/* Usuario y acciones */}
                    <Space>
                        <Dropdown menu={userMenu} placement="bottomRight">
                            <Space style={{ cursor: 'pointer', padding: '8px' }}>
                                <Avatar icon={<UserOutlined />} />
                                <span>{auth?.user?.name || 'Usuario'}</span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>
                
                {/* Contenido principal */}
                <Content style={{ 
                    margin: '24px',
                    background: '#f0f2f5',
                    borderRadius: '8px',
                    overflow: 'auto'
                }}>
                    <div style={{ 
                        background: '#fff',
                        padding: '24px',
                        borderRadius: '8px',
                        minHeight: 'calc(100vh - 200px)'
                    }}>
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
} 