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
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import RoleModal from '../../../Components/RoleModal.jsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';
import ColumnGroup from 'antd/es/table/ColumnGroup.js';

const { Title, Text } = Typography;

export default function Index({ permisos = [], roles = [], debug_info }) {
    const { showSuccess, showError } = useNotifications();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [containerHeight, setContainerHeight] = useState(0);
    
    // Estado para los permisos base (fuente de verdad)
    const [baseModelos, setBaseModelos] = useState(Array.isArray(permisos) ? permisos : []);
    const [filteredData, setFilteredData] = useState(Array.isArray(permisos) ? permisos : []);
    const [editingModeloId, setEditingModeloId] = useState(null);
    
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

    // Hook para manejar el redimensionamiento de ventana y contenedor
    useEffect(() => {
        const calculateContainerHeight = () => {
            const cardContainer = document.querySelector('[class*="cardContainer"]');
            const filtersSection = document.querySelector('[class*="filtersSection"]');
            const bulkActionsSection = document.querySelector('[class*="bulkActionsSection"]');
            const paginationContainer = document.querySelector('[class*="paginationContainer"]');
            
            if (cardContainer && filtersSection && bulkActionsSection && paginationContainer) {
                const cardContainerRect = cardContainer.getBoundingClientRect();
                const filtersHeight = filtersSection.getBoundingClientRect().height;
                const bulkActionsHeight = bulkActionsSection.getBoundingClientRect().height;
                const paginationHeight = paginationContainer.getBoundingClientRect().height;
                
                // Calcular altura disponible para la tabla
                // Restar las alturas de otros elementos + márgenes/padding (aprox 40px)
                const availableHeight = cardContainerRect.height - filtersHeight - bulkActionsHeight - paginationHeight - 40;
                
                setContainerHeight(Math.max(200, availableHeight)); // Mínimo 200px
            }
        };

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            // Usar setTimeout para permitir que el DOM se actualice antes de medir
            setTimeout(calculateContainerHeight, 100);
        };

        // Calcular altura inicial
        setTimeout(calculateContainerHeight, 100);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Función para calcular la altura de la tabla basándose en el contenedor real
    const getTableHeight = () => {
        if (containerHeight > 0) {
            // Usar altura calculada dinámicamente con buffer adicional para scroll horizontal
            const bufferForHorizontalScroll = windowWidth <= 768 ? 50 : 35;
            return Math.max(200, containerHeight - bufferForHorizontalScroll);
        }
        
        // Fallback si no se ha calculado aún el contenedor
        if (windowWidth <= 576) {
            return 'calc(48vh - 60px)';
        } else if (windowWidth <= 768) {
            return 'calc(50vh - 80px)';
        } else if (windowWidth <= 992) {
            return 'calc(65vh - 180px)';
        } else {
            return 'calc(65vh - 200px)';
        }
    };

    // Actualizar baseModelos cuando cambia la prop permisos
    useEffect(() => {
        const validModelos = Array.isArray(permisos) ? permisos.filter(model => 
            model && 
            typeof model === 'object' && 
            (model.id !== undefined && model.id !== null && model.id !== '')
        ) : [];
        setBaseModelos(validModelos);
    }, [permisos]);

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
                (item.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.guard_name || '').toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Filtro de fechas
        if (filters.fechaDesde || filters.fechaHasta) {
            filtered = filtered.filter(item => {
                const fecha = item.fecha_ultima_suscripcion ? new Date(item.fecha_ultima_suscripcion) : null;
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

    // Recalcular altura del contenedor cuando cambian los datos o filtros
    useEffect(() => {
        const recalculateHeight = () => {
            const cardContainer = document.querySelector('[class*="cardContainer"]');
            const filtersSection = document.querySelector('[class*="filtersSection"]');
            const bulkActionsSection = document.querySelector('[class*="bulkActionsSection"]');
            const paginationContainer = document.querySelector('[class*="paginationContainer"]');
            
            if (cardContainer && filtersSection && bulkActionsSection && paginationContainer) {
                const cardContainerRect = cardContainer.getBoundingClientRect();
                const filtersHeight = filtersSection.getBoundingClientRect().height;
                const bulkActionsHeight = bulkActionsSection.getBoundingClientRect().height;
                const paginationHeight = paginationContainer.getBoundingClientRect().height;
                
                const availableHeight = cardContainerRect.height - filtersHeight - bulkActionsHeight - paginationHeight - 40;
                setContainerHeight(Math.max(200, availableHeight));
            }
        };

        // Usar setTimeout para permitir que el DOM se actualice
        setTimeout(recalculateHeight, 50);
    }, [filteredData, pagination]);
    
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
        setEditingModeloId(null); // Modo crear
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingModeloId(null);
    };

    const handleModalSubmit = async (values) => {
        setLoading(true);
        
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            let response, result;

            console.log('Enviando petición para crear/editar rol:', values);

            if (editingModeloId) {
                // Modo edición: PUT
                response = await fetch(`/admin/roles/${editingModeloId}`, {
                    method: 'PUT',
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
            } else {
                // Modo crear: POST
                response = await fetch('/admin/roles', {
                    method: 'POST',
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
            }

            console.log('Respuesta del servidor:', response.status, response.statusText);

            if (!response.ok) {
                let errorMsg = 'Error en la respuesta del servidor';
                try {
                    const errorData = await response.json();
                    console.log('Error data:', errorData);
                    
                    // Manejar errores de validación específicos (422)
                    if (response.status === 422 && errorData.errors) {
                        // Si hay errores específicos de campos
                        const fieldErrors = Object.entries(errorData.errors);
                        if (fieldErrors.length > 0) {
                            const [field, messages] = fieldErrors[0];
                            errorMsg = Array.isArray(messages) ? messages[0] : messages;
                        } else {
                            errorMsg = errorData.message || 'Error de validación';
                        }
                    } else {
                        errorMsg = errorData.message || errorData.error || errorMsg;
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    const textResponse = await response.text();
                    console.log('Raw response:', textResponse);
                }
                throw new Error(errorMsg);
            }

            result = await response.json();
            console.log('Resultado exitoso:', result);
            
            // Solo si llegamos aquí significa que fue exitoso
            showSuccess(editingModeloId ? 'Rol actualizado exitosamente!' : 'Rol creado exitosamente!');
            setIsModalVisible(false);
            setEditingModeloId(null);
            await refreshData();
        } catch (error) {
            console.error('Error al guardar rol:', error);
            showError(error.message || 'Error al guardar el rol. Inténtalo de nuevo.');
            // Importante: NO cerrar el modal aquí - el usuario conserva sus datos
            throw error; // Relanzar el error para que lo maneje el modal
        } finally {
            setLoading(false);
        }
    };

    // Función para eliminar un rol individual
    const handleDeleteModel = async (roleId) => {
        try {
            // Obtener el token CSRF del meta tag
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            // Llamada al backend para eliminar un rol
            const response = await fetch(`/admin/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el rol');
            }

            const result = await response.json();
            message.success(result.message);
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar rol:', error);
            showError(error.message || 'Error al eliminar el rol');
        }
    };

    // Funciones para acciones masivas
    const handleBulkDelete = async () => {
        try {
            // Obtener el token CSRF del meta tag
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            // Llamada al backend para eliminar múltiples roles
            const response = await fetch(`/admin/roles/${selectedRowKeys[0]}`, {
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
                throw new Error(errorData.message || 'Error al eliminar los roles');
            }

            const result = await response.json();
            message.success(result.message);
            setSelectedRowKeys([]);
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar roles:', error);
            showError(error.message || 'Error al eliminar los roles seleccionados');
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
            const url = `/admin/permisos`;
            const response = await fetch(url, {
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
            
            // Validar los datos recibidos - acceder directamente a data.permisos
            const receivedPermisos = data.permisos || [];
            const validData = Array.isArray(receivedPermisos) ? receivedPermisos.filter(permiso => 
                permiso && 
                typeof permiso === 'object' && 
                (permiso.id !== undefined && permiso.id !== null && permiso.id !== '')
            ) : [];
            
            
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


    // Configuración de la tabla de permisos
    const columns = [
        {
            title: 'Nombre del Permiso',
            dataIndex: 'name',
            key: 'name',
            width: windowWidth <= 576 ? 140 : windowWidth <= 768 ? 180 : 220,
            fixed: 'left', // Columna fija a la izquierda
            render: (text) => <Text strong>{text || 'N/A'}</Text>,
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'name' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('name')
            }),
            filterable: true,
        },
        {
            title: 'Guard',
            dataIndex: 'guard_name',
            key: 'guard_name',
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 180,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'guard_name' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('guard_name')
            }),
        },
        {
            title: 'Roles Asociados',
            dataIndex: 'roles',
            key: 'roles',
            width: windowWidth <= 576 ? 200 : windowWidth <= 768 ? 250 : 300,
            render: (roles) => {
                if (!roles || !Array.isArray(roles) || roles.length === 0) {
                    return <Text type="secondary">Sin roles</Text>;
                }
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {roles.map((rol, index) => (
                            <Tag key={index} color="blue" style={{ margin: '2px' }}>
                                {rol}
                            </Tag>
                        ))}
                    </div>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: windowWidth <= 576 ? 80 : windowWidth <= 768 ? 100 : 120,
            render: (_, record) => (
                <Space size={windowWidth <= 576 ? "small" : "middle"}>
                    <Tooltip title="Editar permiso">
                        <Button 
                            type="text" 
                            size={windowWidth <= 768 ? "small" : "middle"} 
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingModeloId(record.id);
                                setIsModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Eliminar permiso">
                        <Popconfirm
                            title="¿Estás seguro de eliminar este permiso?"
                            description="Esta acción no se puede deshacer"
                            onConfirm={() => handleDeleteModel(record.id)}
                            okText="Sí, eliminar"
                            cancelText="Cancelar"
                        >
                            <Button 
                                type="text" 
                                size={windowWidth <= 768 ? "small" : "middle"} 
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
        <AdminLayout title="Gestión de Permisos">
            <div className={styles.modelosPage}>
                {/* Header de la página */}
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Lista de Permisos
                        </Title>
                        <Text type="secondary">
                            Gestiona todos los permisos registrados en el sistema
                            <span> • {Array.isArray(baseModelos) ? baseModelos.length : 0} total(es)</span>
                        </Text>
                    </div>
                </div>

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    {/* CONTENEDOR 1 - Filtros */}
                    <div className={styles.filtersSection}>
                        <Input
                            placeholder="Buscar por nombre de permiso o guard..."
                            prefix={<SearchOutlined />}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            allowClear
                        />
                        <Space>
                            <Button 
                                icon={<ClearOutlined />}
                                onClick={clearFilters}
                            >
                            </Button>
                            {selectedRowKeys.length > 0 && (
                                <span className={styles.selectedCount}>
                                    {selectedRowKeys.length} seleccionado(s)</span>
                            )}
                        </Space>
                    </div>                    {/* CONTENEDOR 2 - Acciones masivas */}
                    <div className={styles.bulkActionsSection}>
                        <div className={styles.bulkActionsLeft}>
                            <Popconfirm
                                title={`¿Estás seguro de eliminar ${selectedRowKeys.length} elemento(s)?`}
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
                                Nuevo Rol
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
                                scroll={{ 
                                    x: 'max-content', // Scroll horizontal automático
                                    y: getTableHeight() // Altura dinámica según el tamaño de pantalla
                                }}
                                sticky={{
                                    offsetHeader: 0, // Header fijo en la parte superior
                                }}
                                showSorterTooltip={false}
                                sortDirections={['ascend', 'descend']}
                                size={windowWidth <= 768 ? "small" : "middle"}
                            />
                        ) : (
                            <Empty
                                description="No hay permisos registrados que coincidan con los filtros"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button type="primary" onClick={handleAddModel}>
                                    Agregar Primer Rol
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
                                    return `${safeRange[0]}-${safeRange[1]} de ${safeTotal} elementos`;
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

                {/* Modal para crear/editar rol */}
                <RoleModal
                    visible={isModalVisible}
                    onCancel={handleModalCancel}
                    onSubmit={handleModalSubmit}
                    loading={loading}
                    title="Nuevo Rol"
                    roleId={editingModeloId}
                />
            </div>
        </AdminLayout>
    );
}