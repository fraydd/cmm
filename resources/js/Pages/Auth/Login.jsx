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
import styles from './Login.module.scss';

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
        <div className={styles.loginOverlay}>
            <div className={styles.loginContainer}>
                {/* Botón de cerrar */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleCancel}
                    className={styles.backButton}
                >
                    Volver
                </Button>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.iconContainer}>
                        <LoginOutlined className={styles.icon} />
                    </div>
                    <Title level={2} className={styles.title}>
                        Iniciar Sesión
                    </Title>
                    <Text type="secondary" className={styles.subtitle}>
                        Accede a tu cuenta de CMM System
                    </Text>
                </div>

                {/* Errores */}
                {errors.email && (
                    <Alert
                        message={errors.email}
                        type="error"
                        showIcon
                        className={styles.errorAlert}
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
                            prefix={<UserOutlined className={styles.inputIcon} />}
                            placeholder="Correo electrónico"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className={styles.inputField}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Por favor ingresa tu contraseña' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className={styles.inputIcon} />}
                            placeholder="Contraseña"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            className={styles.inputField}
                        />
                    </Form.Item>

                    <Form.Item>
                        <div className={styles.rememberContainer}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                >
                                    Recordarme
                                </Checkbox>
                            </Form.Item>
                            <Button type="link" className={styles.forgotPassword}>
                                ¿Olvidaste tu contraseña?
                            </Button>
                        </div>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing || loading}
                            className={styles.submitButton}
                        >
                            {processing || loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </Form.Item>
                </Form>

                <Divider className={styles.divider}>
                    <Text type="secondary" className={styles.dividerText}>
                        ¿No tienes una cuenta?
                    </Text>
                </Divider>

                <div className={styles.footer}>
                    <Text type="secondary" className={styles.footerText}>
                        Contacta al administrador para obtener acceso
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default Login;