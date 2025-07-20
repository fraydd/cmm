import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { Card, Button, Space, Typography, Table, Tag, Empty, Divider, Alert, Row, Col, Input, Select, DatePicker, Tooltip, Popconfirm, message, Pagination } from 'antd';
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
    ReloadOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications.jsx';
import ModeloModal from '../../Components/ModeloModal.jsx';
import AdminLayout from '../../Layouts/AdminLayout';
import styles from './Index.module.scss';

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
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 15,
        total: 0
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);

    // Debug cuando el componente se monta
    useEffect(() => {}, []);

    // Actualizar datos filtrados cuando cambian los modelos
    useEffect(() => {
        setFilteredData(modelos);
        setPagination(prev => ({
            ...prev,
            total: modelos.length
        }));
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
        setPagination(prev => ({
            ...prev,
            total: filtered.length,
            current: 1 // Reset a la primera página cuando cambian los filtros
        }));
    };

    // Aplicar filtros cuando cambian
    useEffect(() => {
        applyFilters();
    }, [filters, modelos]);

    // Debug en cada render
    console.log('Renderizando componente Modelos/Index');
    
    // Calcular datos paginados
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    const handleAddModel = () => {
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const handleModalSubmit = async (values) => {
        // Convertir fechas a string si existen
        if (values.fecha_nacimiento && typeof values.fecha_nacimiento === 'object' && values.fecha_nacimiento.format) {
            values.fecha_nacimiento = values.fecha_nacimiento.format('YYYY-MM-DD');
        }
        if (values.fecha_vigencia && typeof values.fecha_vigencia === 'object' && values.fecha_vigencia.format) {
            values.fecha_vigencia = values.fecha_vigencia.format('YYYY-MM-DD');
        }
        // Limpiar campos opcionales: convertir undefined a string vacío
        Object.keys(values).forEach(key => {
            if (values[key] === undefined) {
                values[key] = '';
            }
        });
        // Crear FormData para enviar archivos
        const formData = new FormData();
        // Agregar todos los campos de texto al FormData
        Object.keys(values).forEach(key => {
            if (key !== 'model_images') {
                if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            }
        });
        // Agregar las imágenes como archivos
        if (values.model_images && Array.isArray(values.model_images)) {
            // Metadatos de las imágenes
            const imagesMeta = values.model_images.map(img => ({
                temp_id: img.temp_id,
                url: img.url,
                name: img.name,
                size: img.size,
                original_name: img.original_name || img.name
            }));
            formData.append('model_images_meta', JSON.stringify(imagesMeta));
            // Archivos físicos
            values.model_images.forEach((image, index) => {
                if (image.originFileObj) {
                    formData.append(`model_images${index}`, image.originFileObj);
                }
            });
        }
        // Obtener el token CSRF del meta tag
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        setLoading(true);
        try {
            // Petición real al backend usando fetch con CSRF
            const response = await fetch('/admin/modelos', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': token
                }
            });
            if (!response.ok) {
                let errorMsg = 'Error en la respuesta del servidor';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
            }
            const result = await response.json();
            showSuccess('Modelo creado exitosamente!');
            setIsModalVisible(false);
            // Recargar datos después de crear
            await refreshData();
        } catch (error) {
            console.error('Error al crear modelo:', error);
            showError(error.message || 'Error al crear el modelo. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Función para eliminar un modelo individual
    const handleDeleteModel = async (modelId) => {
        try {
            // Obtener el token CSRF del meta tag
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            // Llamada al backend para eliminar un modelo
            const response = await fetch(`/admin/modelos/${modelId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el modelo');
            }

            const result = await response.json();
            message.success(result.message);
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar modelo:', error);
            showError(error.message || 'Error al eliminar el modelo');
        }
    };

    // Funciones para acciones masivas
    const handleBulkDelete = async () => {
        try {
            // Obtener el token CSRF del meta tag
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            // Llamada al backend para eliminar múltiples modelos
            const response = await fetch(`/admin/modelos/${selectedRowKeys[0]}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ids: selectedRowKeys
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar los modelos');
            }

            const result = await response.json();
            message.success(result.message);
            setSelectedRowKeys([]);
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar modelos:', error);
            showError(error.message || 'Error al eliminar los modelos seleccionados');
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

    // Función para recargar datos dinámicamente
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/admin/modelos', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const data = await response.json();
            setFilteredData(data.modelos);
            setPagination(prev => ({
                ...prev,
                total: data.modelos.length,
                current: 1 // Reset a la primera página
            }));
            // showSuccess('Datos actualizados correctamente'); // Quitar notificación
            setIsUpdated(true);
            setTimeout(() => setIsUpdated(false), 1000);
        } catch (error) {
            console.error('Error al recargar datos:', error);
            showError('Error al recargar los datos. Inténtalo de nuevo.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Función para manejar cambios de paginación
    const handleTableChange = (paginationInfo) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
        }));
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
            title: 'Fecha último registro',
            dataIndex: 'fecha_creacion',
            key: 'fecha_creacion',
            width: 140,
            sorter: (a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            width: 120,
            render: (estado) => {
                const colorMap = {
                    'Activo': 'success',
                    'Proximo': 'warning',
                    'Vencido': 'error'
                };
                return (
                    <Tag color={colorMap[estado] || 'default'}>
                        {estado?.toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Activo', value: 'Activo' },
                { text: 'Próximo', value: 'Proximo' },
                { text: 'Vencido', value: 'Vencido' },
            ],
            onFilter: (value, record) => record.estado === value,
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
                            onConfirm={() => handleDeleteModel(record.id)}
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
            <div className={styles.modelosPage}>
                {/* Header de la página */}
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Lista de Modelos
                        </Title>
                        <Text type="secondary">Gestiona todos los modelos registrados en el sistema</Text>
                    </div>
                </div>

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    {/* CONTENEDOR 1 - Filtros */}
                    <div className={styles.filtersSection}>
                        <Input
                            placeholder="Buscar por nombre, descripción o versión..."
                            prefix={<SearchOutlined />}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            allowClear
                        />
                        <Select
                            placeholder="Estado"
                            value={filters.estado}
                            onChange={(value) => setFilters({ ...filters, estado: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="Activo">Activo</Select.Option>
                            <Select.Option value="Proximo">Próximo</Select.Option>
                            <Select.Option value="Vencido">Vencido</Select.Option>
                        </Select>
                        <DatePicker
                            placeholder="Desde"
                            value={filters.fechaDesde}
                            onChange={(date) => setFilters({ ...filters, fechaDesde: date })}
                            style={{ width: '100%' }}
                        />
                        <DatePicker
                            placeholder="Hasta"
                            value={filters.fechaHasta}
                            onChange={(date) => setFilters({ ...filters, fechaHasta: date })}
                            style={{ width: '100%' }}
                        />
                        <Space>
                            <Button 
                                icon={<FilterOutlined />}
                                onClick={clearFilters}
                            >
                                Limpiar Filtros
                            </Button>
                            {selectedRowKeys.length > 0 && (
                                <span className={styles.selectedCount}>
                                    {selectedRowKeys.length} seleccionado(s)
                                </span>
                            )}
                        </Space>
                    </div>

                    {/* CONTENEDOR 2 - Acciones masivas */}
                    <div className={styles.bulkActionsSection}>
                        <div className={styles.bulkActionsLeft}>
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
                                    className={selectedRowKeys.length > 0 ? styles.visibleButton : styles.hiddenButton}
                                >
                                    Eliminar ({selectedRowKeys.length})
                                </Button>
                            </Popconfirm>
                        </div>
                        <div className={styles.bulkActionsRight}>
                            <Button 
                                icon={
                                    isRefreshing ? <ReloadOutlined spin /> : isUpdated ? <CheckOutlined style={{ color: 'green' }} /> : <ReloadOutlined />
                                }
                                loading={isRefreshing}
                                onClick={refreshData}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? 'Actualizando...' : isUpdated ? 'Actualizado' : 'Recargar'}
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                onClick={handleAddModel}
                            >
                                Agregar Nuevo Modelo
                            </Button>
                        </div>
                    </div>

                    {/* CONTENEDOR 3 - Tabla */}
                    <div className={styles.tableContainer}>
                        {filteredData.length > 0 ? (
                            <Table 
                                columns={columns} 
                                dataSource={paginatedData}
                                rowKey="id"
                                onChange={handleTableChange}
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
                                pagination={false}
                                scroll={{ x: 900, y: 'calc(100vh - 400px)' }}
                                sticky={{ offsetHeader: 0 }}
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

                    {/* CONTENEDOR 4 - Paginación */}
                    <div className={styles.paginationContainer}>
                        {filteredData.length > 0 && (
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                showSizeChanger={true}
                                showQuickJumper={true}
                                showTotal={(total, range) => 
                                    `${range[0]}-${range[1]} de ${total} modelos`}
                                pageSizeOptions={['10', '15', '20', '50']}
                                size="default"
                                responsive={true}
                                onChange={(page, pageSize) => {
                                    setPagination(prev => ({
                                        ...prev,
                                        current: page,
                                        pageSize: pageSize
                                    }));
                                }}
                                onShowSizeChange={(current, size) => {
                                    setPagination(prev => ({
                                        ...prev,
                                        current: 1,
                                        pageSize: size
                                    }));
                                }}
                            />
                        )}
                    </div>
                </div>

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