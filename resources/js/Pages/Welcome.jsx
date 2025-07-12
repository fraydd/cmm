import React from 'react';
import { 
    Layout, 
    Typography, 
    Button, 
    Row, 
    Col, 
    Card, 
    Space,
    Divider,
    Statistic,
    Avatar,
    List,
    Tag
} from 'antd';
import { 
    RocketOutlined, 
    SafetyCertificateOutlined, 
    TeamOutlined,
    CheckCircleOutlined,
    ArrowRightOutlined,
    StarOutlined,
    UserOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { router } from '@inertiajs/react';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Welcome = () => {
    const features = [
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: '2rem', color: '#52c41a' }} />,
            title: 'Gestión Segura',
            description: 'Sistema de autenticación robusto con roles y permisos avanzados'
        },
        {
            icon: <TeamOutlined style={{ fontSize: '2rem', color: '#1890ff' }} />,
            title: 'Colaboración en Equipo',
            description: 'Trabaja en equipo con roles específicos y permisos granulares'
        },
        {
            icon: <SettingOutlined style={{ fontSize: '2rem', color: '#722ed1' }} />,
            title: 'Panel de Administración',
            description: 'Interfaz intuitiva para gestionar usuarios, modelos y configuraciones'
        }
    ];

    const stats = [
        { title: 'Usuarios Activos', value: 150, suffix: '+' },
        { title: 'Modelos Creados', value: 500, suffix: '+' },
        { title: 'Tiempo de Respuesta', value: '< 100ms', suffix: '' },
        { title: 'Disponibilidad', value: 99.9, suffix: '%' }
    ];

    const testimonials = [
        {
            name: 'María González',
            role: 'Administradora',
            content: 'El sistema ha mejorado significativamente nuestra eficiencia operativa.',
            avatar: <Avatar icon={<UserOutlined />} />
        },
        {
            name: 'Carlos Rodríguez',
            role: 'Analista',
            content: 'La interfaz es intuitiva y las funcionalidades son exactamente lo que necesitábamos.',
            avatar: <Avatar icon={<UserOutlined />} />
        }
    ];

    const handleGetStarted = () => {
        router.visit('/login');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Header */}
            <Header style={{ 
                background: 'transparent', 
                borderBottom: '1px solid #f0f0f0',
                position: 'fixed',
                width: '100%',
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}>
                <Row justify="space-between" align="middle" style={{ height: '100%' }}>
                    <Col>
                        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                            <RocketOutlined /> CMM System
                        </Title>
                    </Col>
                    <Col>
                        <Space>
                            <Button type="text">Inicio</Button>
                            <Button type="text">Características</Button>
                            <Button type="text">Contacto</Button>
                            <Button type="primary" onClick={handleGetStarted}>
                                Acceder <ArrowRightOutlined />
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Header>

            {/* Hero Section */}
            <Content style={{ paddingTop: 80 }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '80px 0',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <Row justify="center">
                        <Col xs={24} md={16} lg={12}>
                            <Title level={1} style={{ color: 'white', marginBottom: 24 }}>
                                Sistema de Gestión CMM
                            </Title>
                            <Paragraph style={{ 
                                fontSize: '1.2rem', 
                                color: 'rgba(255, 255, 255, 0.9)',
                                marginBottom: 40
                            }}>
                                Plataforma moderna para la gestión integral de modelos, usuarios y procesos empresariales
                            </Paragraph>
                            <Space size="large">
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    onClick={handleGetStarted}
                                    style={{ 
                                        background: 'white', 
                                        color: '#1890ff',
                                        border: 'none',
                                        height: 48,
                                        padding: '0 32px'
                                    }}
                                >
                                    Comenzar Ahora <ArrowRightOutlined />
                                </Button>
                                <Button 
                                    size="large" 
                                    style={{ 
                                        background: 'transparent', 
                                        color: 'white',
                                        border: '2px solid white',
                                        height: 48,
                                        padding: '0 32px'
                                    }}
                                >
                                    Ver Demo
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* Features Section */}
                <div style={{ padding: '80px 0', background: '#fafafa' }}>
                    <Row justify="center" style={{ marginBottom: 60 }}>
                        <Col xs={24} md={16}>
                            <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>
                                Características Principales
                            </Title>
                            <Paragraph style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                                Descubre las herramientas que harán tu gestión más eficiente
                            </Paragraph>
                        </Col>
                    </Row>
                    <Row gutter={[32, 32]} justify="center">
                        {features.map((feature, index) => (
                            <Col xs={24} md={8} key={index}>
                                <Card 
                                    style={{ 
                                        textAlign: 'center', 
                                        height: '100%',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ marginBottom: 24 }}>
                                        {feature.icon}
                                    </div>
                                    <Title level={4} style={{ marginBottom: 16 }}>
                                        {feature.title}
                                    </Title>
                                    <Paragraph style={{ color: '#666' }}>
                                        {feature.description}
                                    </Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* Stats Section */}
                <div style={{ padding: '60px 0' }}>
                    <Row gutter={[32, 32]} justify="center">
                        {stats.map((stat, index) => (
                            <Col xs={12} md={6} key={index}>
                                <Card style={{ textAlign: 'center', border: 'none' }}>
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        valueStyle={{ color: '#1890ff', fontSize: '2rem' }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                <Divider />

                {/* Testimonials */}
                <div style={{ padding: '60px 0' }}>
                    <Row justify="center" style={{ marginBottom: 40 }}>
                        <Col xs={24} md={16}>
                            <Title level={2} style={{ textAlign: 'center' }}>
                                Lo que dicen nuestros usuarios
                            </Title>
                        </Col>
                    </Row>
                    <Row gutter={[32, 32]} justify="center">
                        {testimonials.map((testimonial, index) => (
                            <Col xs={24} md={12} key={index}>
                                <Card style={{ border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                        {testimonial.avatar}
                                        <div style={{ marginLeft: 12 }}>
                                            <Text strong>{testimonial.name}</Text>
                                            <br />
                                            <Text type="secondary">{testimonial.role}</Text>
                                        </div>
                                        <div style={{ marginLeft: 'auto' }}>
                                            <Space>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarOutlined key={star} style={{ color: '#faad14' }} />
                                                ))}
                                            </Space>
                                        </div>
                                    </div>
                                    <Paragraph style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                                        "{testimonial.content}"
                                    </Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* CTA Section */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                    padding: '60px 0',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <Row justify="center">
                        <Col xs={24} md={16}>
                            <Title level={2} style={{ color: 'white', marginBottom: 24 }}>
                                ¿Listo para comenzar?
                            </Title>
                            <Paragraph style={{ 
                                fontSize: '1.1rem', 
                                color: 'rgba(255, 255, 255, 0.9)',
                                marginBottom: 40
                            }}>
                                Únete a cientos de usuarios que ya están optimizando sus procesos
                            </Paragraph>
                            <Button 
                                type="primary" 
                                size="large" 
                                onClick={handleGetStarted}
                                style={{ 
                                    background: 'white', 
                                    color: '#1890ff',
                                    border: 'none',
                                    height: 48,
                                    padding: '0 32px'
                                }}
                            >
                                Acceder al Sistema <ArrowRightOutlined />
                            </Button>
                        </Col>
                    </Row>
                </div>
            </Content>

            {/* Footer */}
            <Footer style={{ 
                background: '#001529', 
                color: 'white',
                textAlign: 'center'
            }}>
                <Row justify="center">
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size="large">
                            <div>
                                <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
                                    <RocketOutlined /> CMM System
                                </Title>
                                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Sistema de gestión integral para empresas modernas
                                </Paragraph>
                            </div>
                            <div>
                                <Space size="large">
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        © 2024 CMM System. Todos los derechos reservados.
                                    </Text>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Términos y Condiciones
                                    </Text>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Política de Privacidad
                                    </Text>
                                </Space>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Footer>
        </Layout>
    );
};

export default Welcome; 