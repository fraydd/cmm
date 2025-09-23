import { usePermissions } from '../../../hooks/usePermissions.jsx';
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
    ClearOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    ReloadOutlined,
    CheckOutlined,
    TeamOutlined,
    UserDeleteOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import EmployeeModal from './EmployeeModal.jsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';

const { Title, Text } = Typography;

export default function Index({ empleados = [] }) {
    const { can } = usePermissions();
    const { notification } = App.useApp();
    const { showSuccess, showError, showInfo, showWarning } = useNotifications();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [containerHeight, setContainerHeight] = useState(0);
    const [data, setData] = useState(Array.isArray(empleados) ? empleados : []); // Datos originales
    const [filteredData, setFilteredData] = useState(Array.isArray(empleados) ? empleados : []);
    const [filters, setFilters] = useState({
        search: '',
        estado: '',
        cargo: '',
        fechaDesde: null,
        fechaHasta: null
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 15,
        total: Array.isArray(empleados) ? empleados.length : 0
    });
    const [sorting, setSorting] = useState({
        field: null,
        order: null
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);

    // Actualizar datos filtrados cuando cambian los empleados
    useEffect(() => {
        // Validar y limpiar datos antes de establecerlos
        const validEmployees = Array.isArray(empleados) ? empleados.filter(emp => emp && emp.id) : [];
        
        setData(validEmployees); // Actualizar datos originales
        setFilteredData(validEmployees);
        setPagination(prev => ({
            ...prev,
            total: validEmployees.length
        }));
    }, [empleados]);

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
                case 'fecha_contratacion':
                    aValue = a?.fecha_contratacion ? new Date(a.fecha_contratacion) : new Date(0);
                    bValue = b?.fecha_contratacion ? new Date(b.fecha_contratacion) : new Date(0);
                    break;
                case 'nombre':
                case 'cargo':
                case 'identificacion':
                case 'telefono':
                case 'email':
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

    // Función para aplicar filtros
    const applyFilters = () => {
        let filtered = [...data];

        // Filtro de búsqueda
        if (filters.search) {
            filtered = filtered.filter(item =>
                item.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.cargo?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.identificacion?.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.email?.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Filtro de estado
        if (filters.estado) {
            filtered = filtered.filter(item => item.estado === filters.estado);
        }

        // Filtro de cargo
        if (filters.cargo) {
            filtered = filtered.filter(item => 
                item.cargo?.toLowerCase().includes(filters.cargo.toLowerCase())
            );
        }

        // Filtro de fechas
        if (filters.fechaDesde || filters.fechaHasta) {
            filtered = filtered.filter(item => {
                const fecha = new Date(item.fecha_contratacion);
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
    }, [filters, data, sorting]);

    // Función para limpiar todos los filtros
    const clearFilters = () => {
        setFilters({
            search: '',
            estado: '',
            cargo: '',
            fechaDesde: null,
            fechaHasta: null
        });
        // También resetear el ordenamiento
        setSorting({
            field: null,
            order: null
        });
    };

    // Calcular datos paginados con validaciones seguras
    const safeCurrentPage = Math.max(1, parseInt(pagination.current) || 1);
    const safePageSize = Math.max(1, parseInt(pagination.pageSize) || 15);
    const startIndex = (safeCurrentPage - 1) * safePageSize;
    const endIndex = startIndex + safePageSize;
    const paginatedData = Array.isArray(filteredData) ? filteredData.slice(startIndex, endIndex) : [];
    
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);

    const handleAddEmployee = () => {
        setEditingEmployeeId(null); // Modo crear
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingEmployeeId(null);
    };

    const handleModalSubmit = async (values) => {
        // Convertir fechas a string si existen
        if (values.birth_date && typeof values.birth_date === 'object' && values.birth_date.format) {
            values.birth_date = values.birth_date.format('YYYY-MM-DD');
        }
        if (values.hire_date && typeof values.hire_date === 'object' && values.hire_date.format) {
            values.hire_date = values.hire_date.format('YYYY-MM-DD');
        }
        if (values.end_date && typeof values.end_date === 'object' && values.end_date.format) {
            values.end_date = values.end_date.format('YYYY-MM-DD');
        }

        // Limpiar campos opcionales: convertir undefined a string vacío
        Object.keys(values).forEach(key => {
            if (values[key] === undefined) {
                values[key] = '';
            }
        });

        // Obtener el token CSRF del meta tag
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        setLoading(true);
        try {
            let response, result;
            if (editingEmployeeId) {
                // Modo edición: PUT/PATCH
                response = await fetch(`/admin/empleados/${editingEmployeeId}`, {
                    method: 'PUT',
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    }
                });
            } else {
                // Modo crear: POST
                response = await fetch('/admin/empleados', {
                    method: 'POST',
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token
                    }
                });
            }

            if (!response.ok) {
                let errorMsg = 'Error en la respuesta del servidor';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                throw new Error(errorMsg);
            }

            result = await response.json();
            showSuccess(editingEmployeeId ? 'Empleado actualizado exitosamente!' : 'Empleado creado exitosamente!');
            setIsModalVisible(false);
            setEditingEmployeeId(null);
            // Recargar datos después de crear/editar
            await refreshData();
        } catch (error) {
            console.error('Error al guardar empleado:', error);
            showError(error.message || 'Error al guardar el empleado. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Función para eliminar un empleado individual
    const handleDeleteEmployee = async (empleadoId) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            const response = await fetch(`/admin/empleados/${empleadoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el empleado');
            }

            const result = await response.json();
            showSuccess(result.message || 'Empleado eliminado correctamente');
            
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar empleado:', error);
            showError(error.message || 'Error al eliminar el empleado. Inténtalo de nuevo.');
        }
    };

    // Función para eliminar acceso al dashboard de un empleado
    const handleRemoveAccess = async (empleadoId) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!token) {
                throw new Error('Token CSRF no encontrado');
            }
            
            const response = await fetch(`/admin/empleados/remove-access`, {
                method: 'DELETE',
                body: JSON.stringify({ ids: [empleadoId] }), // Enviarlo como array
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || 'Error al eliminar el acceso');
            }

            const result = await response.json();
            showSuccess(result.message || 'Acceso eliminado correctamente');
            
            // Recargar datos después de eliminar acceso
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar acceso:', error);
            showError(error.message || 'Error al eliminar el acceso. Inténtalo de nuevo.');
        }
    };

    // Función para eliminar acceso al dashboard en masa
    const handleBulkRemoveAccess = async () => {
        if (selectedRowKeys.length === 0) return;

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!token) {
                throw new Error('Token CSRF no encontrado');
            }
            
            const response = await fetch(`/admin/empleados/remove-access`, {
                method: 'DELETE',
                body: JSON.stringify({ ids: selectedRowKeys }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || 'Error al eliminar el acceso');
            }

            const result = await response.json();
            showSuccess(result.message || 'Acceso eliminado correctamente');
            setSelectedRowKeys([]);
            
            // Recargar datos después de eliminar acceso
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar acceso:', error);
            showError(error.message || 'Error al eliminar el acceso. Inténtalo de nuevo.');
        }
    };

    // Función para eliminar empleados en masa
    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;

        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            const response = await fetch(`/admin/empleados/${selectedRowKeys[0]}`, {
                method: 'DELETE',
                body: JSON.stringify({ ids: selectedRowKeys }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar los empleados');
            }

            const result = await response.json();
            showSuccess(result.message || 'Empleados eliminados correctamente');
            setSelectedRowKeys([]);
            
            // Recargar datos después de eliminar
            await refreshData();
        } catch (error) {
            console.error('Error al eliminar empleados:', error);
            showError(error.message || 'Error al eliminar los empleados. Inténtalo de nuevo.');
        }
    };

    // Función para recargar datos
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/admin/empleados', {
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
            setData(data.empleados); // Actualizar datos originales
            setFilteredData(data.empleados); // Actualizar datos filtrados
            setPagination(prev => ({
                ...prev,
                total: data.empleados.length,
                current: 1 // Reset a la primera página
            }));
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
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 200,
            fixed: 'left', // Columna fija a la izquierda
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
            title: 'Cargo',
            dataIndex: 'cargo',
            key: 'cargo',
            width: 180,
            ellipsis: true,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'cargo' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('cargo')
            }),
        },
        {
            title: 'Identificación',
            dataIndex: 'identificacion',
            key: 'identificacion',
            width: 140,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'identificacion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('identificacion')
            }),
        },
        {
            title: 'Teléfono',
            dataIndex: 'telefono',
            key: 'telefono',
            width: 140,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'telefono' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('telefono')
            }),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            ellipsis: true,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'email' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('email')
            }),
        },
        {
            title: 'Fecha Contratación',
            dataIndex: 'fecha_contratacion',
            key: 'fecha_contratacion',
            width: 140,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'fecha_contratacion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('fecha_contratacion')
            }),
        },
        {
            title: 'Usuario Sistema',
            dataIndex: 'tiene_usuario',
            key: 'tiene_usuario',
            width: 130,
            render: (tieneUsuario) => (
                <Tag color={tieneUsuario ? 'blue' : 'default'}>
                    {tieneUsuario ? 'SÍ' : 'NO'}
                </Tag>
            ),
            filters: [
                { text: 'Con Usuario', value: true },
                { text: 'Sin Usuario', value: false },
            ],
            onFilter: (value, record) => record.tiene_usuario === value,
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 160,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Ver detalles">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => window.location.href = `/admin/empleados/${record.id}`}
                        />
                    </Tooltip>
                    <Tooltip title="Editar">
                        <Button
                            disabled={!can('editar_empleados')}
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => {
                                setEditingEmployeeId(record.id);
                                setIsModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    {record.tiene_usuario && (
                        <Tooltip title="Eliminar acceso al dashboard">
                            <Popconfirm
                                title="¿Estás seguro de eliminar el acceso al dashboard?"
                                description="El usuario no podrá acceder al sistema pero el empleado permanecerá registrado"
                                onConfirm={() => handleRemoveAccess(record.id)}
                                okText="Sí, eliminar acceso"
                                cancelText="Cancelar"
                            >
                                <Button
                                    disabled={!can('editar_empleados')}
                                    type="text"
                                    icon={<UserDeleteOutlined />}
                                    size="small"
                                    style={{ color: '#faad14' }}
                                />
                            </Popconfirm>
                        </Tooltip>
                    )}
                    <Tooltip title="Eliminar empleado">
                        <Popconfirm
                            title="¿Estás seguro de eliminar este empleado?"
                            description="El empleado será eliminado y no podrá acceder al sistema"
                            onConfirm={() => handleDeleteEmployee(record.id)}
                            okText="Sí, eliminar"
                            cancelText="Cancelar"
                        >
                            <Button
                                disabled={!can('editar_empleados')}
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <div className={styles.empleadosPage}>
                {/* CONTENEDOR A - Header principal */}
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <TeamOutlined /> Gestión de Empleados
                        </Title>
                        <Text type="secondary">
                            Administra los empleados del sistema • {empleados.length} total(es)
                        </Text>
                    </div>
                </div>

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    {/* CONTENEDOR 1 - Filtros */}
                    <div className={styles.filtersSection}>
                        <Input
                            placeholder="Buscar por nombre, cargo, identificación..."
                            prefix={<SearchOutlined />}
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            allowClear
                        />
                        <Input
                            placeholder="Filtrar por cargo"
                            value={filters.cargo}
                            onChange={(e) => setFilters({...filters, cargo: e.target.value})}
                            allowClear
                        />
                        <div className={styles.dateFilters}>
                            <DatePicker
                                placeholder="Fecha desde"
                                value={filters.fechaDesde}
                                onChange={(date) => setFilters({...filters, fechaDesde: date})}
                                style={{ width: '100%' }}
                            />
                            <DatePicker
                                placeholder="Fecha hasta"
                                value={filters.fechaHasta}
                                onChange={(date) => setFilters({...filters, fechaHasta: date})}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <Space>
                            <Tooltip title="Limpiar Filtros">
                                <Button 
                                    icon={<ClearOutlined />}
                                    onClick={clearFilters}
                                />
                            </Tooltip>
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
                            {selectedRowKeys.length > 0 && (
                                <Space>
                                    <Popconfirm
                                        title={`¿Estás seguro de eliminar el acceso al dashboard de ${selectedRowKeys.length} empleado(s)?`}
                                        description="Los usuarios no podrán acceder al sistema pero los empleados permanecerán registrados"
                                        onConfirm={handleBulkRemoveAccess}
                                        okText="Sí, eliminar acceso"
                                        cancelText="Cancelar"
                                    >
                                        <Button 
                                            size="small" 
                                            icon={<UserDeleteOutlined />}
                                            style={{ color: '#faad14', borderColor: '#faad14' }}
                                            disabled={!can('editar_empleados')}
                                        >
                                            Eliminar Acceso ({selectedRowKeys.length})
                                        </Button>
                                    </Popconfirm>
                                    <Popconfirm
                                        title={`¿Estás seguro de eliminar ${selectedRowKeys.length} empleado(s)?`}
                                        description="Los empleados serán eliminados y no podrán acceder al sistema"
                                        onConfirm={handleBulkDelete}
                                        okText="Sí, eliminar"
                                        cancelText="Cancelar"
                                    >
                                        <Button 
                                            size="small" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            disabled={!can('editar_empleados')}
                                        >
                                            Eliminar ({selectedRowKeys.length})
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            )}
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
                                onClick={handleAddEmployee}
                                disabled={!can('editar_empleados')}
                            >
                                Agregar Nuevo Empleado
                            </Button>
                        </div>
                    </div>

                    {/* CONTENEDOR 3 - Tabla */}
                    <div className={styles.tableContainer}>
                        {Array.isArray(filteredData) && filteredData.length > 0 ? (
                            <Table 
                                columns={columns} 
                                dataSource={paginatedData}
                                rowKey={(record) => record?.id || Math.random()}
                                onChange={handleTableChange}
                                pagination={false}
                                loading={loading}
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: setSelectedRowKeys,
                                    selections: [
                                        {
                                            key: 'all',
                                            text: 'Seleccionar todo',
                                            onSelect: () => setSelectedRowKeys(filteredData.map(item => item?.id).filter(Boolean))
                                        },
                                        {
                                            key: 'none',
                                            text: 'Deseleccionar todo',
                                            onSelect: () => setSelectedRowKeys([])
                                        }
                                    ]
                                }}
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
                                description="No hay empleados que coincidan con los filtros"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button type="primary" onClick={handleAddEmployee}>
                                    Agregar Primer Empleado
                                </Button>
                            </Empty>
                        )}
                    </div>

                    {/* CONTENEDOR 4 - Paginación */}
                    <div className={styles.paginationContainer}>
                        {Array.isArray(filteredData) && filteredData.length > 0 && (
                            <Pagination
                                current={Math.max(1, parseInt(pagination.current) || 1)}
                                pageSize={Math.max(1, parseInt(pagination.pageSize) || 15)}
                                total={Math.max(0, parseInt(pagination.total) || 0)}
                                showSizeChanger={true}
                                showQuickJumper={true}
                                showTotal={(total, range) => {
                                    const safeTotal = parseInt(total) || 0;
                                    const safeRange = Array.isArray(range) ? range : [0, 0];
                                    return `${safeRange[0]}-${safeRange[1]} de ${safeTotal} empleados`;
                                }}
                                pageSizeOptions={['10', '15', '20', '50']}
                                size="default"
                                responsive={true}
                                onChange={(page, pageSize) => {
                                    const safePage = Math.max(1, parseInt(page) || 1);
                                    const safePageSize = Math.max(1, parseInt(pageSize) || 15);
                                    setPagination(prev => ({
                                        ...prev,
                                        current: safePage,
                                        pageSize: safePageSize
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

                {/* Modal para crear/editar empleado */}
                <EmployeeModal
                    visible={isModalVisible}
                    onCancel={handleModalCancel}
                    onSubmit={handleModalSubmit}
                    loading={loading}
                    title="Nuevo Empleado"
                    employeeId={editingEmployeeId}
                />
            </div>
        </AdminLayout>
    );
}
