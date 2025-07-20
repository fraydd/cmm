import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Table, 
    Tag, 
    Space, 
    Typography,
    Alert,
    Tooltip,
    Popconfirm,
    message,
    App,
    Empty,
    Pagination
} from 'antd';
import { 
    UserAddOutlined, 
    MailOutlined, 
    ReloadOutlined,
    CloseOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { router, useForm } from '@inertiajs/react';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import InvitationModal from '../../../Components/InvitationModal';
import styles from './Index.module.scss';

const { Title, Text } = Typography;

export default function InvitationsIndex({ invitations, errors, success, error }) {
    const { notification } = App.useApp();
    const { showSuccess, showError, showInfo, showWarning } = useNotifications();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [filteredData, setFilteredData] = useState(invitations.data || []);
    const [isUpdated, setIsUpdated] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        email: ''
    });

    // Función helper para obtener el token CSRF
    const getCsrfToken = () => {
        const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
        
        if (!csrfMetaTag) {
            throw new Error('No se pudo obtener el token CSRF. Recarga la página e intenta de nuevo.');
        }
        
        const token = csrfMetaTag.getAttribute('content');
        
        if (!token) {
            throw new Error('Token CSRF vacío. Recarga la página e intenta de nuevo.');
        }
        
        return token;
    };

    // Actualizar datos filtrados cuando cambian las invitaciones
    useEffect(() => {
        setFilteredData(invitations.data || []);
    }, [invitations]);

    // Mostrar notificaciones de éxito/error
    useEffect(() => {
        if (success) {
            showSuccess(success);
        }
        if (error) {
            showError(error);
        }
    }, [success, error, showSuccess, showError]);

    const handleAddInvitation = () => {
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        reset();
    };

    const handleModalSubmit = async (values) => {
        setLoading(true);
        try {
            // Obtener el token CSRF usando la función helper
            const token = getCsrfToken();
            // Usar FormData en vez de JSON
            const formData = new FormData();
            formData.append('email', values.email);

            // Petición al backend usando fetch con CSRF
            const response = await fetch('/admin/invitaciones', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            if (!response.ok) {
                let errorMessage = 'Error al crear la invitación';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    // No hacer nada
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            showSuccess('Invitación enviada exitosamente!');
            setLoading(false);
            setIsModalVisible(false);
            reset();
            // Recargar datos después de crear
            await refreshData();
        } catch (error) {
            showError(error.message || 'Error al crear la invitación. Inténtalo de nuevo.');
            setLoading(false);
        }
    };

    const handleResend = async (invitationId) => {
        try {
            // Obtener el token CSRF usando la función helper
            const token = getCsrfToken();
            
            // Llamada al backend para reenviar invitación
            const response = await fetch(`/admin/invitaciones/${invitationId}/resend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reenviar la invitación');
            }

            const result = await response.json();
            showSuccess(result.message);
            // Recargar datos después de reenviar
            await refreshData();
        } catch (error) {
            console.error('Error al reenviar invitación:', error);
            showError(error.message || 'Error al reenviar la invitación');
        }
    };

    const handleCancel = async (invitationId) => {
        try {
            // Obtener el token CSRF usando la función helper
            const token = getCsrfToken();
            
            // Llamada al backend para cancelar invitación
            const response = await fetch(`/admin/invitaciones/${invitationId}/cancel`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cancelar la invitación');
            }

            const result = await response.json();
            showSuccess(result.message);
            // Recargar datos después de cancelar
            await refreshData();
        } catch (error) {
            console.error('Error al cancelar invitación:', error);
            showError(error.message || 'Error al cancelar la invitación');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const token = getCsrfToken();
            const response = await fetch(`/admin/invitaciones`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ids: selectedRowKeys
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar las invitaciones');
            }
            const result = await response.json();
            showSuccess(result.message);
            setSelectedRowKeys([]);
            await refreshData();
        } catch (error) {
            showError(error.message || 'Error al eliminar las invitaciones');
        }
    };

    const handleDelete = async (invitationId) => {
        try {
            const token = getCsrfToken();
            const response = await fetch(`/admin/invitaciones`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ids: [invitationId]
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la invitación');
            }
            const result = await response.json();
            showSuccess(result.message);
            await refreshData();
        } catch (error) {
            showError(error.message || 'Error al eliminar la invitación');
        }
    };

    // Funciones para acciones masivas
    const handleBulkResend = async () => {
        try {
            // Obtener el token CSRF usando la función helper
            const token = getCsrfToken();
            
            // Llamada al backend para reenviar múltiples invitaciones
            const response = await fetch(`/admin/invitaciones/${selectedRowKeys[0]}/resend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ids: selectedRowKeys
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reenviar las invitaciones');
            }

            const result = await response.json();
            showSuccess(result.message);
            setSelectedRowKeys([]);
            // Recargar datos después de reenviar
            await refreshData();
        } catch (error) {
            console.error('Error al reenviar invitaciones:', error);
            showError(error.message || 'Error al reenviar las invitaciones');
        }
    };

    const handleBulkCancel = async () => {
        try {
            // Obtener el token CSRF usando la función helper
            const token = getCsrfToken();
            
            // Llamada al backend para cancelar múltiples invitaciones
            const response = await fetch(`/admin/invitaciones/${selectedRowKeys[0]}/cancel`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ids: selectedRowKeys
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cancelar las invitaciones');
            }

            const result = await response.json();
            showSuccess(result.message);
            setSelectedRowKeys([]);
            // Recargar datos después de cancelar
            await refreshData();
        } catch (error) {
            console.error('Error al cancelar invitaciones:', error);
            showError(error.message || 'Error al cancelar las invitaciones');
        }
    };

    // Función para recargar datos dinámicamente
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/admin/invitaciones', {
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
            setFilteredData(data.invitations.data);
            // showSuccess('Datos actualizados correctamente'); // Quitar notificación
            setIsUpdated(true);
            setTimeout(() => setIsUpdated(false), 1000);
        } catch (error) {
            console.error('Error al recargar datos:', error);
            showError('Error al recargar los datos. Inténtalo de nuevo.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusTag = (status, expiresAt) => {
        const isExpired = new Date(expiresAt) < new Date();
        
        if (status === 'accepted') {
            return <Tag color="success" icon={<CheckCircleOutlined />}>Aceptada</Tag>;
        } else if (status === 'expired' || isExpired) {
            return <Tag color="error" icon={<CloseCircleOutlined />}>Expirada</Tag>;
        } else {
            return <Tag color="warning" icon={<ClockCircleOutlined />}>Pendiente</Tag>;
        }
    };

    const formatDateShort = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hour}:${minute}`;
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 260,
            render: (email) => (
                <Space>
                    <MailOutlined />
                    <Text>{email}</Text>
                </Space>
            )
        },
        {
            title: 'Enviada por',
            dataIndex: 'inviter',
            key: 'inviter',
            width: 140,
            render: (inviter) => inviter?.name || 'N/A'
        },
        {
            title: 'Fecha de envío',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 170,
            render: (date) => formatDateShort(date)
        },
        {
            title: 'Expira',
            dataIndex: 'expires_at',
            key: 'expires_at',
            width: 170,
            render: (date) => formatDateShort(date)
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status, record) => getStatusTag(status, record.expires_at)
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 120,
            render: (_, record) => {
                const status = record.status_calculado || record.status;
                const isActive = record.is_active === true || record.is_active === 1;
                const canResend = isActive && (status === 'expired' || status === 'cancelled');
                const canCancel = isActive && status === 'pending';
                const canDelete = isActive && status !== 'accepted';
                return (
                    <Space>
                        <Tooltip title="Reenviar invitación">
                            <Button 
                                type="text" 
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => handleResend(record.id)}
                                disabled={!canResend}
                            />
                        </Tooltip>
                        <Tooltip title="Cancelar invitación">
                            <Popconfirm
                                title="¿Cancelar invitación?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => handleCancel(record.id)}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    type="text" 
                                    size="small"
                                    danger 
                                    icon={<CloseOutlined />}
                                    disabled={!canCancel}
                                />
                            </Popconfirm>
                        </Tooltip>
                        <Tooltip title="Eliminar invitación">
                            <Popconfirm
                                title="¿Eliminar invitación?"
                                description="Esta acción eliminará permanentemente la invitación."
                                onConfirm={() => handleDelete(record.id)}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    type="text" 
                                    size="small"
                                    danger 
                                    icon={<DeleteOutlined />}
                                    disabled={!canDelete}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                );
            }
        }
    ];

    return (
        <AdminLayout title="Gestionar Invitaciones">
            <div className={styles.invitationsPage}>
                {/* Header de la página */}
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <MailOutlined style={{ marginRight: '8px' }} />
                            Gestionar Invitaciones
                        </Title>
                        <Text type="secondary">Envía invitaciones por email para que nuevos usuarios puedan registrarse en la plataforma</Text>
                    </div>
                </div>

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    {/* CONTENEDOR 1 - Acciones masivas */}
                    <div className={styles.bulkActionsSection}>
                        <div className={styles.bulkActionsLeft}>
                            <Popconfirm
                                title={`¿Estás seguro de reenviar ${selectedRowKeys.length} invitación(es)?`}
                                onConfirm={handleBulkResend}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    size="small" 
                                    icon={<ReloadOutlined />}
                                    className={selectedRowKeys.length > 0 ? styles.visibleButton : styles.hiddenButton}
                                >
                                    Reenviar ({selectedRowKeys.length})
                                </Button>
                            </Popconfirm>
                            <Popconfirm
                                title={`¿Estás seguro de cancelar ${selectedRowKeys.length} invitación(es)?`}
                                onConfirm={handleBulkCancel}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    size="small" 
                                    danger 
                                    icon={<CloseOutlined />}
                                    className={selectedRowKeys.length > 0 ? styles.visibleButton : styles.hiddenButton}
                                >
                                    Cancelar ({selectedRowKeys.length})
                                </Button>
                            </Popconfirm>
                            <Popconfirm
                                title={`¿Estás seguro de eliminar ${selectedRowKeys.length} invitación(es)?`}
                                description="Esta acción eliminará permanentemente las invitaciones seleccionadas."
                                onConfirm={handleBulkDelete}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    size="small" 
                                    danger 
                                    icon={<DeleteOutlined />}
                                    className={selectedRowKeys.length > 0 ? styles.visibleButton : styles.hiddenButton}
                                >
                                    Eliminar ({selectedRowKeys.length})
                                </Button>
                            </Popconfirm>
                        </div>
                        <div className={styles.bulkActionsRight}>
                            <Button 
                                icon={
                                    isRefreshing ? <ReloadOutlined spin /> : isUpdated ? <CheckOutlined style={{ color: 'green' }} /> : <ReloadOutlined />
                                }
                                loading={isRefreshing}
                                onClick={refreshData}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? 'Actualizando...' : isUpdated ? 'Actualizado' : 'Recargar'}
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<UserAddOutlined />}
                                onClick={handleAddInvitation}
                            >
                                Enviar Nueva Invitación
                            </Button>
                        </div>
                    </div>

                    {/* CONTENEDOR 2 - Tabla */}
                    <div className={styles.tableContainer}>
                        {filteredData.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={filteredData}
                                rowKey="id"
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: setSelectedRowKeys,
                                    getCheckboxProps: (record) => ({
                                        disabled: (record.status_calculado || record.status) === 'accepted'
                                    }),
                                    selections: [
                                        {
                                            key: 'all',
                                            text: 'Seleccionar todo',
                                            onSelect: () => setSelectedRowKeys(filteredData.filter(r => (r.status_calculado || r.status) !== 'accepted').map(item => item.id))
                                        },
                                        {
                                            key: 'none',
                                            text: 'Deseleccionar todo',
                                            onSelect: () => setSelectedRowKeys([])
                                        }
                                    ]
                                }}
                                pagination={false}
                                scroll={{ x: 900, y: 'calc(100vh - 400px)' }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        ) : (
                            <Empty
                                description="No hay invitaciones enviadas"
                                image={<MailOutlined style={{ fontSize: '48px', color: 'var(--cmm-text-secondary)' }} />}
                            >
                                <Button 
                                    type="primary" 
                                    icon={<UserAddOutlined />}
                                    onClick={handleAddInvitation}
                                >
                                    Enviar Primera Invitación
                                </Button>
                            </Empty>
                        )}
                    </div>

                    {/* CONTENEDOR 3 - Paginación */}
                    <div className={styles.paginationContainer}>
                        {filteredData.length > 0 && (
                            <Pagination
                                current={invitations.current_page}
                                pageSize={invitations.per_page}
                                total={invitations.total}
                                showSizeChanger={true}
                                showQuickJumper={true}
                                showTotal={(total, range) => 
                                    `${range[0]}-${range[1]} de ${total} invitaciones`}
                                pageSizeOptions={['10', '15', '20', '50']}
                                size="default"
                                responsive={true}
                                onChange={(page, pageSize) => {
                                    // Aquí podrías implementar la navegación de paginación si es necesario
                                    console.log('Página cambiada:', page, 'Tamaño:', pageSize);
                                }}
                                onShowSizeChange={(current, size) => {
                                    console.log('Tamaño de página cambiado:', current, 'Nuevo tamaño:', size);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Modal para enviar invitación */}
                <InvitationModal
                    visible={isModalVisible}
                    onCancel={handleModalCancel}
                    onSubmit={handleModalSubmit}
                    loading={loading}
                    errors={errors}
                    data={data}
                    setData={setData}
                />
            </div>
        </AdminLayout>
    );
} 