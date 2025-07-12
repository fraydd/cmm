import React from 'react';
import { App } from 'antd';
import AdminLayout from '../../Layouts/AdminLayout';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { 
    UserOutlined, 
    DollarOutlined, 
    TeamOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Dashboard({ stats }) {
    const { notification } = App.useApp();

    // Datos de ejemplo para estadísticas
    const defaultStats = {
        totalModelos: 150,
        modelosActivos: 120,
        ingresosMensuales: 2500000,
        asistenciasHoy: 45,
        totalAsistencias: 320,
        cajaActual: 850000
    };

    const currentStats = stats || defaultStats;

    return (
        <AdminLayout title="Dashboard">
            <div>
                <Title level={2}>Bienvenido al Panel de Administración</Title>
                <Text type="secondary">Resumen general del sistema CMM</Text>
                
                <div style={{ marginTop: 24 }}>
                    <Row gutter={[16, 16]}>
                        {/* Estadísticas de Modelos */}
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Modelos"
                                    value={currentStats.totalModelos}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Modelos Activos"
                                    value={currentStats.modelosActivos}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Ingresos Mensuales"
                                    value={currentStats.ingresosMensuales}
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: '#faad14' }}
                                    formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                />
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Caja Actual"
                                    value={currentStats.cajaActual}
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: '#722ed1' }}
                                    formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                />
                            </Card>
                        </Col>
                    </Row>
                    
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        {/* Estadísticas de Academia */}
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Asistencias Hoy"
                                    value={currentStats.asistenciasHoy}
                                    prefix={<TeamOutlined />}
                                    valueStyle={{ color: '#13c2c2' }}
                                />
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Asistencias"
                                    value={currentStats.totalAsistencias}
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ color: '#eb2f96' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
                
                {/* Sección de Acciones Rápidas */}
                <div style={{ marginTop: 32 }}>
                    <Title level={3}>Acciones Rápidas</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Card 
                                hoverable
                                onClick={() => router.visit('/admin/modelos/create')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                    <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                    <Title level={4} style={{ margin: 0 }}>Nuevo Modelo</Title>
                                    <Text type="secondary">Registrar un nuevo modelo</Text>
                                </Space>
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} md={8}>
                            <Card 
                                hoverable
                                onClick={() => router.visit('/admin/caja')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                    <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                    <Title level={4} style={{ margin: 0 }}>Gestionar Caja</Title>
                                    <Text type="secondary">Ver flujo de caja</Text>
                                </Space>
                            </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} md={8}>
                            <Card 
                                hoverable
                                onClick={() => router.visit('/admin/academia')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                    <TeamOutlined style={{ fontSize: 32, color: '#faad14' }} />
                                    <Title level={4} style={{ margin: 0 }}>Academia</Title>
                                    <Text type="secondary">Gestionar asistencias</Text>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </AdminLayout>
    );
} 