import React, { useRef } from 'react';
import { Layout, Avatar, Space, Dropdown, Typography, ConfigProvider } from 'antd';
import { 
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useSidebarState } from '../hooks/useSidebarState';
import styles from './AdminLayout.module.scss';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children, title = "Panel de Administración" }) {
    const { auth } = usePage().props;
    const { collapsed, toggle: handleToggleSidebar } = useSidebarState();
    const sidebarRef = useRef();
    const theme = useTheme();

    // Métodos disponibles del sidebar para uso externo:
    // sidebarRef.current.toggle() - Alternar colapsado/expandido
    // sidebarRef.current.collapse() - Colapsar sidebar
    // sidebarRef.current.expand() - Expandir sidebar

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
        <ConfigProvider theme={theme}>
            <Layout className={styles.adminLayout}>
                <Sidebar 
                    ref={sidebarRef}
                    collapsed={collapsed} 
                    auth={auth} 
                    onToggle={handleToggleSidebar}
                />
                
                <Layout>
                    {/* Header */}
                    <Header className={styles.header}>
                        <div className={styles.titleContainer}>
                            <Title level={4} className={styles.headerTitle}>
                                {title}
                            </Title>
                        </div>
                        
                        {/* Usuario y acciones */}
                        <div className={styles.userContainer}>
                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                <div className={styles.userDropdown}>
                                    <div className={styles.avatarContainer}>
                                        <Avatar 
                                            icon={<UserOutlined />} 
                                            className={styles.userAvatar}
                                            size="default"
                                        />
                                        <div className={styles.avatarStatus}></div>
                                    </div>
                                    <div className={styles.userInfo}>
                                        <span className={styles.userName}>
                                            {auth?.user?.name || 'Usuario'}
                                        </span>
                                        <span className={styles.userRole}>
                                            Administrador
                                        </span>
                                    </div>
                                </div>
                            </Dropdown>
                        </div>
                    </Header>
                    
                    {/* Contenido principal */}
                    <Content className={styles.content}>
                        <div className={styles.contentInner}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
} 