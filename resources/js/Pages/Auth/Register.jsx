import React, { useState, useEffect } from 'react';
import { 
    Form, 
    Input, 
    Button, 
    Typography, 
    Alert,
    Space
} from 'antd';
import { 
    UserOutlined, 
    LockOutlined, 
    MailOutlined,
    EyeInvisibleOutlined, 
    EyeTwoTone,
    UserAddOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { router, useForm } from '@inertiajs/react';
import { useNotifications } from '../../hooks/useNotifications';

const { Title, Text } = Typography;

const Register = ({ token, email, invitation, errors }) => {
    const [loading, setLoading] = useState(false);
    const { showInfo } = useNotifications();
    const { data, setData, post, processing, reset } = useForm({
        token: token,
        name: '',
        email: email,
        password: '',
        password_confirmation: ''
    });

    // Mostrar información de la invitación al cargar el componente
    useEffect(() => {
        if (invitation) {
            const inviterName = invitation?.inviter?.name || 'Administrador';
            const expiresAt = invitation?.expires_at ? 
                new Date(invitation.expires_at).toLocaleDateString('es-ES') : 'N/A';
            
            showInfo(
                'Invitación válida',
                `Has sido invitado por: ${inviterName}\nFecha de expiración: ${expiresAt}`,
                8 // Duración más larga para que el usuario pueda leer
            );
        }
    }, [invitation, showInfo]);

    const handleSubmit = (values) => {
        setLoading(true);
        // Asegurar que el email esté incluido en los datos enviados
        const formData = {
            ...values,
            email: data.email, // Usar el email del estado, no del formulario
            token: data.token
        };
        
        post('/auth/register', {
            data: formData,
            onSuccess: () => {
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    const handleCancel = () => {
        router.visit('/');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '450px',
                width: '100%',
                padding: '40px',
                position: 'relative'
            }}>
                {/* Botón de cerrar */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleCancel}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        color: '#666'
                    }}
                >
                    Volver
                </Button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                    }}>
                        <UserAddOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={2} style={{ margin: 0, color: '#333' }}>
                        Completar Registro
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Completa tu información para acceder a CMM System
                    </Text>
                </div>



                {/* Errores */}
                {Object.keys(errors || {}).map(key => (
                    <Alert
                        key={key}
                        message={errors[key]}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                ))}

                {/* Formulario */}
                <Form
                    name="register"
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                    autoComplete="off"
                    initialValues={{
                        email: data.email,
                        token: data.token
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Nombre Completo"
                        rules={[
                            { required: true, message: 'Por favor ingresa tu nombre completo' }
                        ]}
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Tu nombre completo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoComplete="off"
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Correo Electrónico"
                        validateStatus={errors.email ? 'error' : ''}
                        help={errors.email}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="tu@email.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={true}
                            autoComplete="off"
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9',
                                background: '#f5f5f5'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Contraseña"
                        rules={[
                            { required: true, message: 'Por favor ingresa una contraseña' },
                            { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
                        ]}
                        validateStatus={errors.password ? 'error' : ''}
                        help={errors.password}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Contraseña (mínimo 8 caracteres)"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password_confirmation"
                        label="Confirmar Contraseña"
                        rules={[
                            { required: true, message: 'Por favor confirma tu contraseña' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Las contraseñas no coinciden'));
                                },
                            }),
                        ]}
                        validateStatus={errors.password_confirmation ? 'error' : ''}
                        help={errors.password_confirmation}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Confirma tu contraseña"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing || loading}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}
                        >
                            {processing || loading ? 'Creando cuenta...' : 'Completar Registro'}
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Al completar el registro, aceptas los términos y condiciones de CMM System
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default Register; 