import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { Button, Space, Typography, Table, Tag, Empty, Input, Select, DatePicker, Tooltip, Popconfirm, message, Pagination } from 'antd';
import { 
    PlusOutlined, 
    UserOutlined, 
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
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

export default function Index({ modelos = [], debug_info }) {
    const { showSuccess, showError } = useNotifications();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    
    // Estado para los modelos base (fuente de verdad)
    const [baseModelos, setBaseModelos] = useState(Array.isArray(modelos) ? modelos : []);
    const [filteredData, setFilteredData] = useState(Array.isArray(modelos) ? modelos : []);
    
    const [filters, setFilters] = useState({
        search: '',
        fechaDesde: null,
        fechaHasta: null
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 15,
        total: 0
    });
    const [sorting, setSorting] = useState({
        field: null,
        order: null
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);

    // Actualizar baseModelos cuando cambia la prop modelos
    useEffect(() => {
        const validModelos = Array.isArray(modelos) ? modelos.filter(model => 
            model && 
            typeof model === 'object' && 
            (model.id !== undefined && model.id !== null && model.id !== '')
        ) : [];
        setBaseModelos(validModelos);
    }, [modelos]);

    // Actualizar datos filtrados cuando cambian los baseModelos
    useEffect(() => {
        // Validación robusta de datos
        const validModelos = Array.isArray(baseModelos) ? baseModelos.filter(model => 
            model && 
            typeof model === 'object' && 
            (model.id !== undefined && model.id !== null && model.id !== '')
        ) : [];
        
        setFilteredData(validModelos);
        setPagination(prev => ({
            ...prev,
            total: validModelos.length,
            current: Math.max(1, prev.current) // Asegurar que current nunca sea menor a 1
        }));
    }, [baseModelos]);

    // Función para aplicar ordenamiento global
    const applySorting = (data) => {
        if (!sorting.field || !sorting.order) {
            return data;
        }

        return [...data].sort((a, b) => {
            let aValue = a?.[sorting.field] || '';
            let bValue = b?.[sorting.field] || '';

            // Manejar diferentes tipos de datos
            switch (sorting.field) {
                case 'fecha_creacion':
                    aValue = a?.fecha_creacion ? new Date(a.fecha_creacion) : new Date(0);
                    bValue = b?.fecha_creacion ? new Date(b.fecha_creacion) : new Date(0);
                    break;
                case 'nombre':
                case 'version':
                case 'descripcion':
                case 'estado':
                    aValue = aValue.toString().toLowerCase();
                    bValue = bValue.toString().toLowerCase();
                    break;
                default:
                    aValue = aValue.toString();
                    bValue = bValue.toString();
            }

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sorting.order === 'descend' ? comparison * -1 : comparison;
        });
    };

    // Función para aplicar filtros con ordenamiento global
    const applyFilters = () => {
        // Validación inicial de datos - usar baseModelos en lugar de modelos
        const validModelos = Array.isArray(baseModelos) ? baseModelos.filter(model => 
            model && 
            typeof model === 'object' && 
            (model.id !== undefined && model.id !== null && model.id !== '')
        ) : [];
        
        let filtered = [...validModelos];

        // Filtro de búsqueda
        if (filters.search) {
            filtered = filtered.filter(item =>
                (item.nombre || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.descripcion || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.version || '').toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Filtro de fechas
        if (filters.fechaDesde || filters.fechaHasta) {
            filtered = filtered.filter(item => {
                const fecha = item.fecha_creacion ? new Date(item.fecha_creacion) : null;
                const desde = filters.fechaDesde ? new Date(filters.fechaDesde) : null;
                const hasta = filters.fechaHasta ? new Date(filters.fechaHasta) : null;

                if (!fecha) return false; // Si no hay fecha, excluir

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

        // Aplicar ordenamiento global DESPUÉS de filtrar
        const sortedData = applySorting(filtered);

        setFilteredData(sortedData);
        setPagination(prev => ({
            ...prev,
            total: sortedData.length,
            current: 1 // Reset a la primera página cuando cambian los filtros
        }));
    };

    // Aplicar filtros cuando cambian los filtros o el ordenamiento
    useEffect(() => {
        applyFilters();
    }, [filters, baseModelos, sorting]);
    
    // Calcular datos paginados con validación
    const startIndex = Math.max(0, (Math.max(1, pagination.current) - 1) * Math.max(1, pagination.pageSize));
    const endIndex = startIndex + Math.max(1, pagination.pageSize);
    const validFilteredData = Array.isArray(filteredData) ? filteredData.filter(item => 
        item && 
        typeof item === 'object' && 
        (item.id !== undefined && item.id !== null && item.id !== '')
    ) : [];
    const paginatedData = validFilteredData.slice(startIndex, endIndex);
    
    const handleAddModel = () => {
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const handleModalSubmit = async (values) => {
        setLoading(true);
        
        try {
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
                if (key !== 'model_images' && values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            // Agregar las imágenes como archivos
            if (values.model_images && Array.isArray(values.model_images)) {
                const imagesMeta = values.model_images.map(img => ({
                    temp_id: img.temp_id,
                    url: img.url,
                    name: img.name,
                    size: img.size,
                    original_name: img.original_name || img.name
                }));
                formData.append('model_images_meta', JSON.stringify(imagesMeta));
                
                values.model_images.forEach((image, index) => {
                    if (image.originFileObj) {
                        formData.append(`model_images${index}`, image.originFileObj);
                    }
                });
            }

            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
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
            
            // Solo si llegamos aquí significa que fue exitoso
            showSuccess('Modelo creado exitosamente!');
            setIsModalVisible(false); // Solo cerrar modal si es exitoso
            await refreshData();
        } catch (error) {
            console.error('Error al crear modelo:', error);
            showError(error.message || 'Error al crear el modelo. Inténtalo de nuevo.');
            // Importante: NO cerrar el modal aquí - el usuario conserva sus datos
            // setIsModalVisible(false); // <-- NO hacer esto
            throw error; // Relanzar el error para que lo maneje el modal
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

    const clearFilters = () => {
        setFilters({
            search: '',
            fechaDesde: null,
            fechaHasta: null
        });
        // También resetear el ordenamiento
        setSorting({
            field: null,
            order: null
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
            console.log('Datos recibidos del servidor:', data); // Debug
            
            // Validar los datos recibidos - acceder directamente a data.modelos
            const receivedModelos = data.modelos || [];
            const validData = Array.isArray(receivedModelos) ? receivedModelos.filter(model => 
                model && 
                typeof model === 'object' && 
                (model.id !== undefined && model.id !== null && model.id !== '')
            ) : [];
            
            console.log('Modelos válidos procesados:', validData); // Debug
            
            // Actualizar baseModelos - esto disparará los useEffect para actualizar filteredData
            setBaseModelos(validData);
            
            // Resetear ordenamiento al recargar datos
            setSorting({
                field: null,
                order: null
            });
            setIsUpdated(true);
            setTimeout(() => setIsUpdated(false), 1000);
        } catch (error) {
            console.error('Error al recargar datos:', error);
            showError('Error al recargar los datos. Inténtalo de nuevo.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Función para manejar cambios de paginación únicamente
    const handleTableChange = (paginationInfo, filters, sorter) => {
        // Validación robusta de paginationInfo
        const validPagination = paginationInfo || {};
        const current = Number(validPagination.current) || 1;
        const pageSize = Number(validPagination.pageSize) || 15;
        
        // Asegurar que los valores sean números válidos
        const safeCurrent = Math.max(1, isNaN(current) ? 1 : current);
        const safePageSize = Math.max(1, isNaN(pageSize) ? 15 : pageSize);
        
        // Solo manejar cambios de paginación (el ordenamiento se maneja por separado)
        setPagination(prev => ({
            ...prev,
            current: safeCurrent,
            pageSize: safePageSize
        }));
    };

    // Función personalizada para manejar clics en columnas ordenables
    const handleColumnSort = (field) => {
        let newOrder;
        
        // Si es la misma columna, hacer ciclo: null -> ascend -> descend -> ascend -> descend...
        if (sorting.field === field) {
            if (sorting.order === null || sorting.order === undefined) {
                newOrder = 'ascend';
            } else if (sorting.order === 'ascend') {
                newOrder = 'descend';
            } else { // descend
                newOrder = 'ascend';
            }
        } else {
            // Nueva columna, empezar con ascendente
            newOrder = 'ascend';
        }
        
        setSorting({
            field: field,
            order: newOrder
        });

        // Reset a primera página cuando cambia el ordenamiento
        setPagination(prev => ({
            ...prev,
            current: 1
        }));
    };


    // Configuración de la tabla
    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'nombre',
            key: 'nombre',
            width: 200,
            render: (text) => <Text strong>{text || 'N/A'}</Text>,
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'nombre' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('nombre')
            }),
            filterable: true,
        },
        {
            title: 'Descripción',
            dataIndex: 'descripcion',
            key: 'descripcion',
            width: 250,
            ellipsis: true,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'descripcion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('descripcion')
            }),
        },
        {
            title: 'Versión',
            dataIndex: 'version',
            key: 'version',
            width: 100,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'version' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('version')
            }),
        },
        {
            title: 'Fecha último registro',
            dataIndex: 'fecha_creacion',
            key: 'fecha_creacion',
            width: 140,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'fecha_creacion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('fecha_creacion')
            }),
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
                const estadoText = estado || 'N/A';
                return (
                    <Tag color={colorMap[estado] || 'default'}>
                        {estadoText.toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Activo', value: 'Activo' },
                { text: 'Próximo', value: 'Proximo' },
                { text: 'Vencido', value: 'Vencido' },
            ],
            onFilter: (value, record) => record?.estado === value,
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'estado' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('estado')
            }),
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
                                // Navegar a la vista completa del modelo
                                window.location.href = `/admin/modelos/${record.id}`;
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
                        <Text type="secondary">Gestiona todos los modelos registrados en el sistema • {Array.isArray(baseModelos) ? baseModelos.length : 0} total(es)</Text>
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
                                icon={<ClearOutlined />}
                                onClick={clearFilters}
                            >
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
                                rowKey={(record) => record?.id || `fallback-${Math.random()}`}
                                onChange={handleTableChange}
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: setSelectedRowKeys,
                                    selections: [
                                        {
                                            key: 'all',
                                            text: 'Seleccionar todo',
                                            onSelect: () => setSelectedRowKeys(validFilteredData.map(item => item?.id).filter(id => id !== undefined && id !== null))
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
                                showSorterTooltip={false}
                                sortDirections={['ascend', 'descend']}
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
                                current={Math.max(1, pagination.current)}
                                pageSize={Math.max(1, pagination.pageSize)}
                                total={Math.max(0, pagination.total)}
                                showSizeChanger={true}
                                showQuickJumper={true}
                                showTotal={(total, range) => {
                                    const safeRange = Array.isArray(range) && range.length >= 2 ? range : [0, 0];
                                    const safeTotal = Number(total) || 0;
                                    return `${safeRange[0]}-${safeRange[1]} de ${safeTotal} modelos`;
                                }}
                                pageSizeOptions={['10', '15', '20', '50']}
                                size="default"
                                responsive={true}
                                onChange={(page, pageSize) => {
                                    const safePage = Math.max(1, Number(page) || 1);
                                    const safePageSize = Math.max(1, Number(pageSize) || 15);
                                    setPagination(prev => ({
                                        ...prev,
                                        current: safePage,
                                        pageSize: safePageSize
                                    }));
                                }}
                                onShowSizeChange={(current, size) => {
                                    const safeCurrent = Math.max(1, Number(current) || 1);
                                    const safeSize = Math.max(1, Number(size) || 15);
                                    setPagination(prev => ({
                                        ...prev,
                                        current: 1, // Reset to first page when changing page size
                                        pageSize: safeSize
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