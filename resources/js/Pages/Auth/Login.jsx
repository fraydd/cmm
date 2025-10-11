import React, { useState } from 'react';
// Estilos para autofill blanco en los inputs
const autofillStyle = `
.login-input:-webkit-autofill,
.login-input:-webkit-autofill:hover,
.login-input:-webkit-autofill:focus,
.login-input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
    -webkit-text-fill-color: #333333 !important;
    transition: background-color 5000s ease-in-out 0s !important;
    background-color: #ffffff !important;
    background: #ffffff !important;
}
`;
import { 
    Typography, 
    Divider,
    Alert
} from 'antd';
import { 
    UserOutlined, 
    LockOutlined,
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
                // Forzar recarga para obtener nuevo token CSRF y sesión limpia
                window.location.reload();
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
        <>
            {/* Inyectar estilos para autofill */}
            <style>{autofillStyle}</style>
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
                <button
                    onClick={handleCancel}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeftOutlined style={{ marginRight: '4px' }} />
                    Volver
                </button>

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
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (data.email && data.password) {
                        handleSubmit(data);
                    }
                }}>
                    {/* Campo Email */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: '#333', 
                            fontWeight: 500,
                            fontSize: '14px'
                        }}>
                            Correo Electrónico
                        </label>
                        <div style={{ position: 'relative' }}>
                            <UserOutlined style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#bfbfbf',
                                fontSize: '16px',
                                zIndex: 1
                            }} />
                            <input
                                type="email"
                                className="login-input"
                                placeholder="Correo electrónico"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="off"
                                required
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '8px',
                                    border: '1px solid #d9d9d9',
                                    background: '#ffffff',
                                    color: '#333333',
                                    paddingLeft: '40px',
                                    paddingRight: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                            />
                        </div>
                        {errors.email && (
                            <div style={{
                                color: '#ff4d4f',
                                fontSize: '12px',
                                marginTop: '4px'
                            }}>
                                {errors.email}
                            </div>
                        )}
                    </div>

                    {/* Campo Password */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: '#333', 
                            fontWeight: 500,
                            fontSize: '14px'
                        }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <LockOutlined style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#bfbfbf',
                                fontSize: '16px',
                                zIndex: 1
                            }} />
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Contraseña"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '8px',
                                    border: '1px solid #d9d9d9',
                                    background: '#ffffff',
                                    color: '#333333',
                                    paddingLeft: '40px',
                                    paddingRight: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                            />
                        </div>
                        {errors.password && (
                            <div style={{
                                color: '#ff4d4f',
                                fontSize: '12px',
                                marginTop: '4px'
                            }}>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: '#333',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                style={{
                                    marginRight: '8px',
                                    width: '16px',
                                    height: '16px',
                                    accentColor: '#667eea'
                                }}
                            />
                            Recordarme
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing || loading}
                        style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '8px',
                            background: processing || loading 
                                ? '#ccc' 
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: 'white',
                            cursor: processing || loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!processing && !loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!processing && !loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {processing || loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <Divider style={{ margin: '24px 0', borderColor: '#e8e8e8' }}>
                    <Text type="secondary" style={{ fontSize: '14px', color: '#999' }}>
                        ¿No tienes una cuenta?
                    </Text>
                </Divider>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Contacta al administrador para obtener acceso
                    </Text>
                </div>
            </div>
        </div>
        </>
    );
};

export default Login;