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

    // Usar los datos reales recibidos del backend
    const currentStats = stats || {};

    return (
        <AdminLayout title="Dashboard">
            <div>
                <Title level={2}>Bienvenido al Panel de Administración</Title>
                <Text type="secondary">Resumen general del sistema CMM</Text>
                
                <div style={{ marginTop: 24 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            width: '100%',
                        }}
                    >
                        <Card style={{ width: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Statistic
                                title={<span style={{ fontSize: '2em', fontWeight: 600 }}>Total Modelos</span>}
                                value={currentStats.totalModelos}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1890ff', fontSize: 28 }}
                            />
                        </Card>
                        <Card style={{ width: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Statistic
                                title={<span style={{ fontSize: '2em', fontWeight: 600 }}>Modelos Activos</span>}
                                value={currentStats.modelosActivos}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a', fontSize: 28 }}
                            />
                        </Card>
                        <Card style={{ width: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Statistic
                                title={<span style={{ fontSize: '2em', fontWeight: 600 }}>Asistencias Hoy</span>}
                                value={currentStats.asistenciasHoy}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#13c2c2', fontSize: 28 }}
                            />
                        </Card>
                        <Card style={{ width: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Statistic
                                title={<span style={{ fontSize: '2em', fontWeight: 600 }}>Total Asistencias</span>}
                                value={currentStats.totalAsistencias}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#eb2f96', fontSize: 28 }}
                            />
                        </Card>
                    </div>
                    <style>{`
                        @media (max-width: 900px) {
                            .dashboard-grid {
                                grid-template-columns: 1fr !important;
                            }
                        }
                    `}</style>
                </div>
                
                {/* Sección de Acciones Rápidas */}
                {/* Se eliminó la sección de Acciones Rápidas */}
            </div>
        </AdminLayout>
    );
} 