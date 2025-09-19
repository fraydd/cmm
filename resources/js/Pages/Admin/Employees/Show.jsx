import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Typography, Row, Col, Table, Empty, Divider, Avatar, Timeline, Alert } from 'antd';
import { 
    ArrowLeftOutlined, 
    EditOutlined, 
    UserOutlined, 
    MailOutlined, 
    PhoneOutlined, 
    IdcardOutlined, 
    CalendarOutlined, 
    BankOutlined, 
    TeamOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    EnvironmentOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Show.module.scss';
import { usePermissions } from '../../../hooks/usePermissions.jsx';

const { Title, Text } = Typography;

export default function Show({ empleado, sedes = [], contactos_emergencia = [], asistencias = [] }) {
    const { can } = usePermissions();
    // Formatear fecha para mostrar
    const formatDate = (date) => {
        if (!date) return 'No disponible';
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Formatear hora para mostrar
    const formatDateTime = (datetime) => {
        if (!datetime) return 'No disponible';
        return new Date(datetime).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calcular edad
    const calculateAge = (birthDate) => {
        if (!birthDate) return 'No disponible';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} años`;
    };

    // Columnas para la tabla de asistencias
    const attendanceColumns = [
        {
            title: 'Fecha',
            dataIndex: 'check_in',
            key: 'date',
            render: (checkIn) => {
                const date = new Date(checkIn);
                return date.toLocaleDateString('es-CO');
            }
        },
        {
            title: 'Entrada',
            dataIndex: 'check_in',
            key: 'check_in',
            render: (checkIn) => {
                const time = new Date(checkIn);
                return time.toLocaleTimeString('es-CO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        },
        {
            title: 'Salida',
            dataIndex: 'check_out',
            key: 'check_out',
            render: (checkOut) => {
                if (!checkOut) return <Tag color="processing">En curso</Tag>;
                const time = new Date(checkOut);
                return time.toLocaleTimeString('es-CO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        },
        {
            title: 'Horas trabajadas',
            key: 'hours_worked',
            render: (_, record) => {
                if (!record.check_out) return <Text type="secondary">En curso</Text>;
                
                const checkIn = new Date(record.check_in);
                const checkOut = new Date(record.check_out);
                const diffMs = checkOut - checkIn;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                return `${diffHours}h ${diffMinutes}m`;
            }
        }
    ];

    return (
        <AdminLayout>
            <div className={styles.employeeShowPage}>
                {/* Header con navegación */}
                <div className={styles.headerSection}>
                    <Space align="center">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => window.history.back()}
                            size="large"
                        >
                            Volver
                        </Button>
                        <Divider type="vertical" />
                        <div className={styles.headerContent}>
                            <Title level={2} style={{ margin: 0 }}>
                                <UserOutlined /> {empleado?.first_name} {empleado?.last_name}
                            </Title>
                            <Text type="secondary">
                                {empleado?.position || 'Sin cargo asignado'} • ID: {empleado?.id}
                            </Text>
                        </div>
                    </Space>
                </div>

                <Row gutter={[24, 24]}>
                    {/* Información Personal */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <IdcardOutlined />
                                    <span>Información Personal</span>
                                </Space>
                            }
                            className={styles.infoCard}
                        >
                            <div className={styles.avatarSection}>
                                <Avatar 
                                    size={80} 
                                    icon={<UserOutlined />} 
                                    className={styles.employeeAvatar}
                                />
                                <div className={styles.basicInfo}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        {empleado?.first_name} {empleado?.last_name}
                                    </Title>
                                    <Text type="secondary">{empleado?.tipo_identificacion}: {empleado?.identification}</Text>
                                </div>
                            </div>

                            <Descriptions column={1} bordered size="small" className={styles.descriptions}>
                                <Descriptions.Item label="Nombres">
                                    {empleado?.first_name || 'No disponible'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Apellidos">
                                    {empleado?.last_name || 'No disponible'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Documento">
                                    {empleado?.tipo_identificacion}: {empleado?.identification || 'No disponible'}
                                </Descriptions.Item>
                                {empleado?.identification_place && (
                                    <Descriptions.Item label="Lugar de Expedición">
                                        {empleado.identification_place}
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Género">
                                    {empleado?.genero || 'No especificado'}
                                </Descriptions.Item>
                                {empleado?.tipo_sangre && (
                                    <Descriptions.Item label="Tipo de Sangre">
                                        <Tag color="red">{empleado.tipo_sangre}</Tag>
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Fecha de Nacimiento">
                                    {formatDate(empleado?.birth_date)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Edad">
                                    {calculateAge(empleado?.birth_date)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Teléfono">
                                    <Space>
                                        <PhoneOutlined />
                                        {empleado?.phone || 'No disponible'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Email Personal">
                                    <Space>
                                        <MailOutlined />
                                        {empleado?.email || 'No disponible'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Dirección">
                                    {empleado?.address || 'No disponible'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* Información Laboral */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <BankOutlined />
                                    <span>Información Laboral</span>
                                </Space>
                            }
                            className={styles.infoCard}
                        >
                            <Descriptions column={1} bordered size="small" className={styles.descriptions}>
                                <Descriptions.Item label="Cargo">
                                    <Tag color="blue">{empleado?.position || 'Sin cargo'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Fecha de Contratación">
                                    <Space>
                                        <CalendarOutlined />
                                        {formatDate(empleado?.hire_date)}
                                    </Space>
                                </Descriptions.Item>
                                {empleado?.end_date && (
                                    <Descriptions.Item label="Fecha de Finalización">
                                        <Space>
                                            <CalendarOutlined />
                                            {formatDate(empleado.end_date)}
                                        </Space>
                                    </Descriptions.Item>
                                )}
                                {empleado?.salary && (
                                    <Descriptions.Item label="Salario">
                                        <Text strong>
                                            ${empleado.salary.toLocaleString('es-CO')} COP
                                        </Text>
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Estado">
                                    <Tag color={empleado?.is_active ? 'success' : 'error'}>
                                        {empleado?.is_active ? 'ACTIVO' : 'INACTIVO'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Usuario del Sistema">
                                    <Tag color={empleado?.email_usuario ? 'blue' : 'default'}>
                                        {empleado?.email_usuario ? 'SÍ' : 'NO'}
                                    </Tag>
                                </Descriptions.Item>
                                {empleado?.email_usuario && (
                                    <Descriptions.Item label="Email del Sistema">
                                        <Space>
                                            <MailOutlined />
                                            {empleado?.email_usuario || 'No disponible'}
                                        </Space>
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Contacto de Emergencia">
                                    <Tag color={empleado?.has_emergency_contact ? 'success' : 'warning'}>
                                        {empleado?.has_emergency_contact ? 'CONFIGURADO' : 'PENDIENTE'}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            {/* Descripción del trabajo si existe */}
                            {empleado?.job_description && (
                                <div className={styles.jobDescriptionSection}>
                                    <Title level={5}>Descripción del Cargo</Title>
                                    <div className={styles.jobDescription}>
                                        {empleado.job_description}
                                    </div>
                                </div>
                            )}

                            {/* Información adicional del empleado */}
                            {empleado?.has_emergency_contact && empleado?.emergency_contact_name && (
                                <div className={styles.emergencySection}>
                                    <Title level={5}>
                                        <SafetyOutlined /> Contacto de Emergencia
                                    </Title>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Nombre Completo">
                                            {empleado.emergency_contact_name} {empleado.emergency_contact_last_name || ''}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Documento">
                                            {empleado.emergency_contact_id_type}: {empleado.emergency_contact_identification}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Teléfono">
                                            <PhoneOutlined /> {empleado.emergency_contact_phone || 'No disponible'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Email">
                                            <MailOutlined /> {empleado.emergency_contact_email || 'No disponible'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Relación">
                                            {empleado.emergency_contact_relationship || 'No especificada'}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Sedes de Acceso */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <EnvironmentOutlined />
                                    <span>Sedes de Acceso ({sedes.length})</span>
                                </Space>
                            }
                            className={styles.infoCard}
                        >
                            {sedes.length > 0 ? (
                                <div className={styles.branchesGrid}>
                                    {sedes.map((sede) => (
                                        <div key={sede.id} className={styles.branchCard}>
                                            <div className={styles.branchHeader}>
                                                <Space>
                                                    <BankOutlined />
                                                    <Text strong>{sede.name}</Text>
                                                </Space>
                                            </div>
                                            <div className={styles.branchDetails}>
                                                {sede.address && (
                                                    <div>
                                                        <EnvironmentOutlined /> {sede.address}
                                                    </div>
                                                )}
                                                {sede.phone && (
                                                    <div>
                                                        <PhoneOutlined /> {sede.phone}
                                                    </div>
                                                )}
                                                {sede.email && (
                                                    <div>
                                                        <MailOutlined /> {sede.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty 
                                    description="Sin sedes asignadas" 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Historial de Asistencias */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <ClockCircleOutlined />
                                    <span>Asistencias Recientes</span>
                                </Space>
                            }
                            className={styles.infoCard}
                        >
                            {asistencias.length > 0 ? (
                                <Table
                                    dataSource={asistencias}
                                    columns={attendanceColumns}
                                    pagination={false}
                                    size="small"
                                    rowKey="id"
                                    className={styles.attendanceTable}
                                />
                            ) : (
                                <Empty 
                                    description="Sin registros de asistencia" 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>


            </div>
        </AdminLayout>
    );
}
