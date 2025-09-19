import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { Button, Space, Typography, Table, Tag, Empty, Input, Select, DatePicker, Tooltip, Popconfirm, message, Pagination } from 'antd';
import { 
    PlusOutlined, 
    UserOutlined, 
    DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { usePermissions } from '../../../hooks/usePermissions.jsx';
import NatModal from './NatModal.jsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';
import ColumnGroup from 'antd/es/table/ColumnGroup.js';

const { Title, Text } = Typography;

export default function Index({ roles = [], permisos = [] }) {
    const { can } = usePermissions();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [rolesState, setRolesState] = useState(Array.isArray(roles) ? roles : []);
    const [natModalOpen, setNatModalOpen] = useState(false);
    const [isEditModal, setIsEditModal] = useState(false);
    const [editRoleData, setEditRoleData] = useState(null);
    const { showSuccess, showError } = useNotifications();
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [permisosState, setPermisosState] = useState(Array.isArray(permisos) ? permisos : []);

    // Handler para crear rol
    const handleCreateRole = async (formValues) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/admin/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formValues.name,
                    permissions: formValues.permisos
                })
            });
            if (!response.ok) {
                let errorMsg = 'Error al crear el rol';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
            }
            showSuccess('Rol creado exitosamente');
            setNatModalOpen(false);
            setIsEditModal(false);
            setEditRoleData(null);
            refreshData();
        } catch (error) {
            showError(error.message || 'No se pudo crear el rol');
        }
    };

    // Handler para editar rol
    const handleEditRole = async (formValues) => {
        if (!editRoleData || !editRoleData.id) return;
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/admin/roles/${editRoleData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formValues.name,
                    permissions: formValues.permisos
                })
            });
            if (!response.ok) {
                let errorMsg = 'Error al editar el rol';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
            }
            showSuccess('Rol editado exitosamente');
            setNatModalOpen(false);
            setIsEditModal(false);
            setEditRoleData(null);
            refreshData();
        } catch (error) {
            showError(error.message || 'No se pudo editar el rol');
        }
    };

    // Función para recargar datos dinámicamente
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const url = `/admin/roles/getRoles`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const data = await response.json();
            if (Array.isArray(data.roles)) {
                setRolesState(data.roles);
            }
        } catch (error) {
            console.error('Error al recargar datos:', error);
            showError('Error al recargar los datos. Inténtalo de nuevo.');
        } finally {
            setIsRefreshing(false);
        }
    };



    // Handler para eliminar rol
    const handleDeleteRole = async (roleId) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/admin/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                let errorMsg = 'Error al eliminar el rol';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
            }
            showSuccess('Rol eliminado exitosamente');
            refreshData();
        } catch (error) {
            showError(error.message || 'No se pudo eliminar el rol');
        }
    };

    // Configuración de la tabla de permisos
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            render: (id) => <Text>{id}</Text>,
        },
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 160 : 200,
            render: (text) => <Text strong ellipsis style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text || 'N/A'}</Text>,
        },
        {
            title: 'Guard',
            dataIndex: 'guard_name',
            key: 'guard_name',
            width: windowWidth <= 576 ? 100 : windowWidth <= 768 ? 130 : 160,
            render: (text) => <Text ellipsis style={{ maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text || 'N/A'}</Text>,
        },
        {
            title: 'Permisos',
            dataIndex: 'permissions',
            key: 'permissions',
            width: windowWidth <= 576 ? 180 : windowWidth <= 768 ? 250 : 350,
            render: (permissions) => {
                if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
                    return <Text type="secondary">Sin permisos</Text>;
                }
                const permisosStr = permissions.map(p => p.name).join(', ');
                const maxLen = 50;
                const displayStr = permisosStr.length > maxLen ? permisosStr.slice(0, maxLen) + '...' : permisosStr;
                return (
                    <Tooltip title={permisosStr} placement="top">
                        <Text ellipsis style={{ maxWidth: 320, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                            {displayStr}
                        </Text>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: windowWidth <= 576 ? 80 : windowWidth <= 768 ? 100 : 120,
            render: (_, record) => (
                <Space size={windowWidth <= 576 ? "small" : "middle"}>
                    <Tooltip title="Editar rol">
                        <Button
                            type="text"
                            size={windowWidth <= 768 ? "small" : "middle"}
                            icon={<EditOutlined />}
                            onClick={() => {
                                const permisosCompletos = Array.isArray(record.permissions)
                                    ? record.permissions.map(p => {
                                        return permisosState.find(full => full.id === p.id) || p;
                                    })
                                    : [];
                                setEditRoleData({
                                    ...record,
                                    permissions: permisosCompletos
                                });
                                setIsEditModal(true);
                                setNatModalOpen(true);
                            }}
                            disabled={!can('editar_roles')}
                        />
                    </Tooltip>
                    <Tooltip title="Eliminar rol">
                        <Popconfirm
                            title="¿Estás seguro de eliminar este rol?"
                            description="Esta acción no se puede deshacer"
                            onConfirm={() => handleDeleteRole(record.id)}
                            okText="Sí, eliminar"
                            cancelText="Cancelar"
                        >
                            <Button
                                type="text"
                                size={windowWidth <= 768 ? "small" : "middle"}
                                danger
                                icon={<DeleteOutlined />}
                                disabled={!can('editar_roles')}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];
    
    return (
        <AdminLayout title="Gestión de Roles">
            <div className={styles.modelosPage}>
                {/* Header de la página */}
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Lista de Roles
                        </Title>
                        <Text type="secondary">
                            Gestiona todos los roles registrados en el sistema
                            <span> • {Array.isArray(rolesState) ? rolesState.length : 0} total(es)</span>
                        </Text>
                    </div>
                </div>

                {/* Modal para crear/editar rol */}
                <NatModal
                    open={natModalOpen}
                    onCancel={() => {
                        setNatModalOpen(false);
                        setIsEditModal(false);
                        setEditRoleData(null);
                    }}
                    onCreate={handleCreateRole}
                    onEdit={handleEditRole}
                    isEdit={isEditModal}
                    permisos={permisosState}
                    initialValues={editRoleData}
                />

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    <div style={{ margin: '16px 16px 16px 0px', textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNatModalOpen(true)} disabled={!can('editar_roles')}>
                            Agregar
                        </Button>
                    </div>
                    {/* CONTENEDOR 3 - Tabla */}
                    <div className={styles.tableContainer}>
                        {rolesState.length > 0 ? (
                            <Table 
                                columns={columns} 
                                dataSource={rolesState}
                                rowKey={(record) => record?.id || `fallback-${Math.random()}`}
                                pagination={false}
                            />
                        ) : (
                            <Empty
                                description="No hay permisos registrados que coincidan con los filtros"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button type="primary" onClick={() => setNatModalOpen(true)} disabled={!can('editar_roles')}>
                                    Agregar Primer Rol
                                </Button>
                            </Empty>
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}