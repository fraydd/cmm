import React, { useRef } from 'react';
import { Layout, Avatar, Space, Typography, ConfigProvider, Button } from 'antd';
import { 
    UserOutlined,
    LogoutOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useSidebarState } from '../hooks/useSidebarState';
import { useBranch } from '../hooks/useBranch';
import { useEffect, useState } from 'react';
import styles from './AdminLayout.module.scss';
import { Dropdown } from 'antd';
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
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Detectar si es móvil
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setSidebarVisible(false);
            }
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Manejar toggle del sidebar en móvil
    const handleMobileToggle = () => {
        if (isMobile) {
            setSidebarVisible(!sidebarVisible);
        } else {
            handleToggleSidebar();
        }
    };

    useEffect(() => {
        fetch('/admin/branches')
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
                onClick: () => {
                    // Limpiar branch seleccionado y otros datos de sesión local si es necesario
                    localStorage.removeItem('selectedBranchId');
                    // Puedes limpiar aquí otros datos relacionados a la sesión si los usas
                    router.post('/auth/logout');
                }
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
                    onToggle={handleMobileToggle}
                    isMobile={isMobile}
                    isVisible={isMobile ? sidebarVisible : true}
                />
                
                <Layout>
                    {/* Header */}
                    <Header className={styles.header}>
                        {/* Contenedor del botón hamburguesa (solo móvil) */}
                        <div className={styles.mobileButtonContainer}>
                            {isMobile && (
                                <Button
                                    type="text"
                                    icon={<MenuOutlined />}
                                    onClick={handleMobileToggle}
                                    className={styles.mobileMenuButton}
                                />
                            )}
                        </div>

                        <div className={styles.titleContainer}>
                            <Title level={4} className={styles.headerTitle}>
                                {title}
                            </Title>
                        </div>
                        {/* Usuario, sede y acciones alineados */}
                        <div className={styles.userAndBranchContainer}>
                            <Dropdown
                                menu={{
                                    items: branches.map(b => ({
                                        key: b.id,
                                        icon: <ShopOutlined />,
                                        label: b.name,
                                        onClick: () => setSelectedBranch(b),
                                        className: selectedBranch && selectedBranch.id === b.id ? 'branch-selected' : ''
                                    }))
                                }}
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
                                                {auth?.user?.role || (auth?.user?.roles?.length ? auth.user.roles[0].name : 'NA')}
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