import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { Card, Button, Space, Typography, Table, Tag, Empty, Divider, Alert, Row, Col, Input, Select, DatePicker, Tooltip, Popconfirm, message } from 'antd';
import { 
    PlusOutlined, 
    UserOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    InfoCircleOutlined,
    SearchOutlined,
    FilterOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications.jsx';
import ModeloModal from '../../Components/ModeloModal.jsx';
import AdminLayout from '../../Layouts/AdminLayout';

const { Title, Text } = Typography;

export default function Index({ modelos, debug_info }) {
    const { notification } = App.useApp();
    const { showSuccess, showError, showInfo, showWarning } = useNotifications();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [filteredData, setFilteredData] = useState(modelos);
    const [filters, setFilters] = useState({
        search: '',
        estado: '',
        fechaDesde: null,
        fechaHasta: null
    });

    // Debug cuando el componente se monta
    useEffect(() => {}, []);

    // Actualizar datos filtrados cuando cambian los modelos
    useEffect(() => {
        setFilteredData(modelos);
    }, [modelos]);

    // Función para aplicar filtros
    const applyFilters = () => {
        let filtered = [...modelos];

        // Filtro de búsqueda
        if (filters.search) {
            filtered = filtered.filter(item =>
                item.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.descripcion?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.version?.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Filtro de estado
        if (filters.estado) {
            filtered = filtered.filter(item => item.estado === filters.estado);
        }

        // Filtro de fechas
        if (filters.fechaDesde || filters.fechaHasta) {
            filtered = filtered.filter(item => {
                const fecha = new Date(item.fecha_creacion);
                const desde = filters.fechaDesde ? new Date(filters.fechaDesde) : null;
                const hasta = filters.fechaHasta ? new Date(filters.fechaHasta) : null;

                if (desde && hasta) {
                    return fecha >= desde && fecha <= hasta;
                } else if (desde) {
                    return fecha >= desde;
                } else if (hasta) {
                    return fecha <= hasta;
                }
                return true;
            });
        }

        setFilteredData(filtered);
    };

    // Aplicar filtros cuando cambian
    useEffect(() => {
        applyFilters();
    }, [filters, modelos]);

    // Debug en cada render
    console.log('Renderizando componente Modelos/Index');
    
    const handleAddModel = () => {
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const handleModalSubmit = async (values) => {
        setLoading(true);
        try {
            
            // Aquí iría la llamada al backend
            // await router.post('/modelos', values);
            
            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showSuccess('Modelo creado exitosamente!');
            setIsModalVisible(false);
            
            // Aquí podrías recargar los datos o actualizar el estado
            // router.reload();
            
        } catch (error) {
            console.error('Error al crear modelo:', error);
            showError('Error al crear el modelo. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Funciones para acciones masivas
    const handleBulkDelete = async () => {
        try {
            // Aquí iría la llamada al backend para eliminar múltiples modelos
            // await router.delete('/modelos/bulk', { data: { ids: selectedRowKeys } });
            
            message.success(`Se eliminaron ${selectedRowKeys.length} modelos exitosamente`);
            setSelectedRowKeys([]);
            // router.reload();
        } catch (error) {
            showError('Error al eliminar los modelos seleccionados');
        }
    };

    const handleBulkAction = (action) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Selecciona al menos un modelo para realizar esta acción');
            return;
        }

        switch (action) {
            case 'delete':
                // La confirmación se maneja en el Popconfirm
                break;
            case 'activate':
                message.info(`Activando ${selectedRowKeys.length} modelos...`);
                break;
            case 'deactivate':
                message.info(`Desactivando ${selectedRowKeys.length} modelos...`);
                break;
            default:
                break;
        }
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            estado: '',
            fechaDesde: null,
            fechaHasta: null
        });
    };



    // Configuración de la tabla
    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'nombre',
            key: 'nombre',
            width: 200,
            render: (text) => <Text strong>{text}</Text>,
            sorter: (a, b) => a.nombre.localeCompare(b.nombre),
            filterable: true,
        },
        {
            title: 'Descripción',
            dataIndex: 'descripcion',
            key: 'descripcion',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Versión',
            dataIndex: 'version',
            key: 'version',
            width: 100,
            sorter: (a, b) => a.version.localeCompare(b.version),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            width: 120,
            render: (estado) => {
                const colorMap = {
                    'activo': 'green',
                    'en_desarrollo': 'blue',
                    'inactivo': 'red',
                    'archivado': 'gray'
                };
                return (
                    <Tag color={colorMap[estado] || 'default'}>
                        {estado?.replace('_', ' ').toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Activo', value: 'activo' },
                { text: 'En Desarrollo', value: 'en_desarrollo' },
                { text: 'Inactivo', value: 'inactivo' },
                { text: 'Archivado', value: 'archivado' },
            ],
            onFilter: (value, record) => record.estado === value,
        },
        {
            title: 'Fecha Creación',
            dataIndex: 'fecha_creacion',
            key: 'fecha_creacion',
            width: 140,
            sorter: (a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion),
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Ver detalles del modelo">
                        <Button 
                            type="text" 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => {
                                message.info('Ver detalles del modelo');
                                // Aquí iría la navegación a la vista de detalles
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Editar modelo">
                        <Button 
                            type="text" 
                            size="small" 
                            icon={<EditOutlined />}
                            onClick={() => {
                                message.info('Editar modelo');
                                // Aquí iría la apertura del modal de edición
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Eliminar modelo">
                        <Popconfirm
                            title="¿Estás seguro de eliminar este modelo?"
                            description="Esta acción no se puede deshacer"
                            onConfirm={() => {
                                message.success('Modelo eliminado exitosamente');
                                // Aquí iría la llamada al backend
                            }}
                            okText="Sí, eliminar"
                            cancelText="Cancelar"
                        >
                            <Button 
                                type="text" 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];
    
    return (
        <AdminLayout title="Gestión de Modelos">
            <div>
                {/* Header de la página */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Lista de Modelos
                        </Title>
                        <Text type="secondary">Gestiona todos los modelos registrados en el sistema</Text>
                    </div>
                    <Space>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={() => window.location.reload()}
                        >
                            Recargar
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={handleAddModel}
                        >
                            Agregar Nuevo Modelo
                        </Button>
                    </Space>
                </div>

                {/* Contenido principal */}
                <Card>
                    {/* Filtros */}
                    <div style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={6}>
                                <Input
                                    placeholder="Buscar por nombre, descripción o versión..."
                                    prefix={<SearchOutlined />}
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    allowClear
                                />
                            </Col>
                            <Col span={4}>
                                <Select
                                    placeholder="Estado"
                                    value={filters.estado}
                                    onChange={(value) => setFilters({ ...filters, estado: value })}
                                    allowClear
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="activo">Activo</Select.Option>
                                    <Select.Option value="en_desarrollo">En Desarrollo</Select.Option>
                                    <Select.Option value="inactivo">Inactivo</Select.Option>
                                    <Select.Option value="archivado">Archivado</Select.Option>
                                </Select>
                            </Col>
                            <Col span={4}>
                                <DatePicker
                                    placeholder="Desde"
                                    value={filters.fechaDesde}
                                    onChange={(date) => setFilters({ ...filters, fechaDesde: date })}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                            <Col span={4}>
                                <DatePicker
                                    placeholder="Hasta"
                                    value={filters.fechaHasta}
                                    onChange={(date) => setFilters({ ...filters, fechaHasta: date })}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Space>
                                    <Button 
                                        icon={<FilterOutlined />}
                                        onClick={clearFilters}
                                    >
                                        Limpiar Filtros
                                    </Button>
                                    {selectedRowKeys.length > 0 && (
                                        <span style={{ color: '#1890ff' }}>
                                            {selectedRowKeys.length} seleccionado(s)
                                        </span>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </div>

                    {/* Acciones masivas */}
                    {selectedRowKeys.length > 0 && (
                        <div style={{ padding: '12px 0', background: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}>
                            <Space>
                                <Text strong>Acciones masivas:</Text>
                                <Button 
                                    size="small"
                                    onClick={() => handleBulkAction('activate')}
                                >
                                    Activar
                                </Button>
                                <Button 
                                    size="small"
                                    onClick={() => handleBulkAction('deactivate')}
                                >
                                    Desactivar
                                </Button>
                                <Popconfirm
                                    title={`¿Estás seguro de eliminar ${selectedRowKeys.length} modelo(s)?`}
                                    onConfirm={handleBulkDelete}
                                    okText="Sí"
                                    cancelText="No"
                                >
                                    <Button 
                                        size="small" 
                                        danger 
                                        icon={<DeleteOutlined />}
                                    >
                                        Eliminar
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>
                    )}

                    {/* Tabla */}
                    <div style={{ marginTop: 16 }}>
                        {filteredData.length > 0 ? (
                            <Table 
                                columns={columns} 
                                dataSource={filteredData}
                                rowKey="id"
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: setSelectedRowKeys,
                                    selections: [
                                        {
                                            key: 'all',
                                            text: 'Seleccionar todo',
                                            onSelect: () => setSelectedRowKeys(filteredData.map(item => item.id))
                                        },
                                        {
                                            key: 'none',
                                            text: 'Deseleccionar todo',
                                            onSelect: () => setSelectedRowKeys([])
                                        }
                                    ]
                                }}
                                pagination={{
                                    pageSize: 15,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => 
                                        `${range[0]}-${range[1]} de ${total} modelos`,
                                    position: ['bottomCenter'],
                                    pageSizeOptions: ['10', '15', '20', '50']
                                }}
                                scroll={{ x: 900 }}
                            />
                        ) : (
                            <Empty
                                description="No hay modelos que coincidan con los filtros"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button type="primary" onClick={handleAddModel}>
                                    Agregar Primer Modelo
                                </Button>
                            </Empty>
                        )}
                    </div>
                </Card>

                {/* Modal para crear/editar modelo */}
                <ModeloModal
                    visible={isModalVisible}
                    onCancel={handleModalCancel}
                    onSubmit={handleModalSubmit}
                    loading={loading}
                    title="Nuevo Modelo"
                />
            </div>
        </AdminLayout>
    );
} 