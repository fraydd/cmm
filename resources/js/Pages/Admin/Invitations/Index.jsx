import React, { useState } from 'react';
import { 
    Card, 
    Form, 
    Input, 
    Button, 
    Table, 
    Tag, 
    Space, 
    Modal, 
    Typography,
    Alert,
    Tooltip,
    Popconfirm
} from 'antd';
import { 
    UserAddOutlined, 
    MailOutlined, 
    ReloadOutlined,
    CloseOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { router, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

const { Title, Text } = Typography;

export default function InvitationsIndex({ invitations, errors, success, error }) {
    const [loading, setLoading] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        email: ''
    });

    const handleSubmit = (values) => {
        setLoading(true);
        post('/admin/invitaciones', {
            onSuccess: () => {
                setLoading(false);
                reset();
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    const handleResend = (invitationId) => {
        router.post(`/admin/invitations/${invitationId}/resend`);
    };

    const handleCancel = (invitationId) => {
        router.delete(`/admin/invitations/${invitationId}`);
    };

    const getStatusTag = (status, expiresAt) => {
        const isExpired = new Date(expiresAt) < new Date();
        
        if (status === 'accepted') {
            return <Tag color="green" icon={<CheckCircleOutlined />}>Aceptada</Tag>;
        } else if (status === 'expired' || isExpired) {
            return <Tag color="red" icon={<CloseCircleOutlined />}>Expirada</Tag>;
        } else {
            return <Tag color="blue" icon={<ClockCircleOutlined />}>Pendiente</Tag>;
        }
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <Space>
                    <MailOutlined />
                    <Text>{email}</Text>
                </Space>
            )
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => getStatusTag(status, record.expires_at)
        },
        {
            title: 'Enviada por',
            dataIndex: 'inviter',
            key: 'inviter',
            render: (inviter) => inviter?.name || 'N/A'
        },
        {
            title: 'Fecha de envío',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('es-ES')
        },
        {
            title: 'Expira',
            dataIndex: 'expires_at',
            key: 'expires_at',
            render: (date) => new Date(date).toLocaleDateString('es-ES')
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Reenviar invitación">
                                <Button 
                                    type="text" 
                                    icon={<ReloadOutlined />}
                                    onClick={() => handleResend(record.id)}
                                />
                            </Tooltip>
                            <Popconfirm
                                title="¿Cancelar invitación?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => handleCancel(record.id)}
                                okText="Sí"
                                cancelText="No"
                            >
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<CloseOutlined />}
                                />
                            </Popconfirm>
                        </>
                    )}
                    {record.status === 'accepted' && (
                        <Text type="secondary">Aceptada por {record.accepter?.name}</Text>
                    )}
                </Space>
            )
        }
    ];

    return (
        <AdminLayout title="Gestionar Invitaciones">
            <div>
                <Title level={2}>Gestionar Invitaciones</Title>
                <Text type="secondary">
                    Envía invitaciones por email para que nuevos usuarios puedan registrarse en la plataforma.
                </Text>

                {/* Alertas */}
                {success && (
                    <Alert
                        message="Éxito"
                        description={success}
                        type="success"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Formulario de nueva invitación */}
                <Card 
                    title={
                        <Space>
                            <UserAddOutlined />
                            <span>Enviar Nueva Invitación</span>
                        </Space>
                    }
                    style={{ marginBottom: 24 }}
                >
                    <Form
                        name="invitation"
                        onFinish={handleSubmit}
                        layout="vertical"
                    >
                        <Form.Item
                            name="email"
                            label="Correo Electrónico"
                            rules={[
                                { required: true, message: 'Por favor ingresa un correo electrónico' },
                                { type: 'email', message: 'Por favor ingresa un correo válido' }
                            ]}
                            validateStatus={errors.email ? 'error' : ''}
                            help={errors.email}
                        >
                            <Input
                                placeholder="usuario@ejemplo.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                prefix={<MailOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing || loading}
                                icon={<MailOutlined />}
                                size="large"
                            >
                                Enviar Invitación
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>

                {/* Lista de invitaciones */}
                <Card 
                    title={
                        <Space>
                            <MailOutlined />
                            <span>Invitaciones Enviadas</span>
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={invitations.data}
                        rowKey="id"
                        pagination={{
                            current: invitations.current_page,
                            total: invitations.total,
                            pageSize: invitations.per_page,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} de ${total} invitaciones`
                        }}
                    />
                </Card>
            </div>
        </AdminLayout>
    );
} 