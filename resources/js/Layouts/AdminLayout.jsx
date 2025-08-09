import React, { useRef } from 'react';
import { Layout, Avatar, Space, Typography, ConfigProvider } from 'antd';
import { 
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useSidebarState } from '../hooks/useSidebarState';
import { useBranch } from '../hooks/useBranch';
import { useEffect, useState } from 'react';
import styles from './AdminLayout.module.scss';
import { Dropdown, Menu } from 'antd';
import { ShopOutlined, DownOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children, title = "Panel de Administración" }) {
    const { auth } = usePage().props;
    const { collapsed, toggle: handleToggleSidebar } = useSidebarState();
    const sidebarRef = useRef();
    const theme = useTheme();
    const { selectedBranch, setSelectedBranch } = useBranch();
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);

    useEffect(() => {
        fetch('/admin/branches/list')
            .then(res => res.json())
            .then(data => {
                setBranches(data);
                // Seleccionar la sede guardada o la primera por defecto
                const saved = localStorage.getItem('selectedBranchId');
                let branch = null;
                if (saved) {
                    branch = data.find(b => b.id === Number(saved));
                }
                if (!branch && data.length > 0) {
                    branch = data[0];
                }
                if (branch) {
                    setSelectedBranch(branch);
                }
                setLoadingBranches(false);
            });
    }, []);

    // Guardar en localStorage cada vez que cambia la sede
    useEffect(() => {
        if (selectedBranch) {
            localStorage.setItem('selectedBranchId', selectedBranch.id);
        }
    }, [selectedBranch]);

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
                        {/* Usuario, sede y acciones alineados */}
                        <div className={styles.userAndBranchContainer}>
                            <Dropdown
                                menu={
                                    <Menu>
                                        {branches.map(b => (
                                            <Menu.Item key={b.id} onClick={() => setSelectedBranch(b)}>
                                                <ShopOutlined style={{ marginRight: 8 }} />
                                                {b.name}
                                            </Menu.Item>
                                        ))}
                                    </Menu>
                                }
                                trigger={['click']}
                            >
                                <span className={styles.branchSelector}>
                                   {loadingBranches ? (
                                       <Skeleton.Input active size="small" style={{ width: 140, height: 24, marginRight: 6 }} />
                                   ) : (
                                        <>
                                            <ShopOutlined style={{ marginRight: 6 }} />
                                            <span className={styles.branchSelectorName}>
                                                {selectedBranch ? selectedBranch.name : 'Seleccione'}
                                            </span>
                                            <DownOutlined style={{ marginLeft: 6, fontSize: 12 }} />
                                        </>
                                   )}
                                </span>
                            </Dropdown>
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