import React, { useState } from 'react';
import { 
    Modal, 
    Form, 
    Input, 
    Button, 
    Checkbox, 
    Typography, 
    Divider,
    Alert,
    Space
} from 'antd';
import { 
    UserOutlined, 
    LockOutlined, 
    EyeInvisibleOutlined, 
    EyeTwoTone,
    LoginOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { router, useForm } from '@inertiajs/react';

const { Title, Text } = Typography;

const Login = ({ errors }) => {
    const [loading, setLoading] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (values) => {
        setLoading(true);
        post('/auth/login', {
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
                maxWidth: '400px',
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
                        <LoginOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={2} style={{ margin: 0, color: '#333' }}>
                        Iniciar Sesión
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Accede a tu cuenta de CMM System
                    </Text>
                </div>

                {/* Errores */}
                {errors.email && (
                    <Alert
                        message={errors.email}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                )}

                {/* Formulario */}
                <Form
                    name="login"
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Por favor ingresa tu correo electrónico' },
                            { type: 'email', message: 'Por favor ingresa un correo válido' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Correo electrónico"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Por favor ingresa tu contraseña' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Contraseña"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                >
                                    Recordarme
                                </Checkbox>
                            </Form.Item>
                            <Button type="link" style={{ padding: 0 }}>
                                ¿Olvidaste tu contraseña?
                            </Button>
                        </div>
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
                            {processing || loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </Form.Item>
                </Form>

                <Divider style={{ margin: '24px 0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        ¿No tienes una cuenta?
                    </Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Contacta al administrador para obtener acceso
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default Login; 