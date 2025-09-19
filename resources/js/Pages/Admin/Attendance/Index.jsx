import EditAttendanceModal from './EditAttendanceModal';
import { usePermissions } from '../../../hooks/usePermissions.jsx';
import React, { useEffect, useState, useRef } from 'react';
import { App } from 'antd';
import { Button, Space, Typography, Table, Tag, Empty, Input, Select, Tooltip, Popconfirm, message, Pagination, Radio } from 'antd';
import CustomDateRangePicker from '../../../Components/CustomDateRangePicker.jsx';
import {
    ClockCircleOutlined,
    SearchOutlined,
    EyeOutlined,
    DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';

const { Title, Text } = Typography;

import dayjs from 'dayjs';

export default function AttendanceIndex() {
    const { can } = usePermissions();
    const { showSuccess, showError } = useNotifications();
    const { selectedBranch } = useBranch();
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [containerHeight, setContainerHeight] = useState(0);

    // Estado para los registros de asistencia (fuente de verdad)
    const [baseAttendances, setBaseAttendances] = useState([]);
    const [filteredData, setFilteredData] = useState([]);

    // Estado para el rango de fechas
    const [dateRange, setDateRange] = useState([
        dayjs().startOf('month'),
        dayjs().endOf('month')
    ]);
    const dateRangePickerRef = useRef();
    // Al montar, setear el rango al mes actual usando el método del componente
    useEffect(() => {
        if (dateRangePickerRef.current && dateRangePickerRef.current.setRange) {
            const start = dayjs().startOf('month');
            const end = dayjs().endOf('month');
            dateRangePickerRef.current.setRange([start, end]);
            setDateRange([start, end]);
        }
    }, []);
    // Estado para las sedes seleccionadas en el filtro (array de IDs)
    const [selectedBranchFilter, setSelectedBranchFilter] = useState([]);
    // Estado para las sedes disponibles
    const [branchOptions, setBranchOptions] = useState([]);
    // Consultar las sedes accesibles al cargar la vista
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch('/admin/asistencias/branches/access');
                if (!response.ok) throw new Error('Error al cargar sedes');
                const data = await response.json();
                console.log("Sedes cargadas:", data);
                setBranchOptions(Array.isArray(data) ? data : []);
            } catch (error) {
                showError('No se pudieron cargar las sedes');
            }
        };
        fetchBranches();
    }, []);
    // Estado para tipo de consulta (modelos o empleados)
    const [attendanceType, setAttendanceType] = useState('models');
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

    // Estado para modal de edición
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState(null);

    // Función para cerrar el modal y refrescar la tabla si se guardó
    const handleCloseEditModal = (shouldRefresh = false) => {

        setEditModalOpen(false);
        setEditRecord(null);
        console.log("cerrando modal",shouldRefresh);

        if (shouldRefresh) {
            refreshData();
        }
    };

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


    useEffect(() => {
        if (
            Array.isArray(selectedBranchFilter) && selectedBranchFilter.length > 0 &&
            Array.isArray(dateRange) && dateRange[0] && dateRange[1] &&
            attendanceType
        ) {
            refreshData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendanceType]);

    const refreshData = async () => {
        // Si faltan filtros requeridos, no hacer nada (ni mostrar error)
        if (!selectedBranchFilter || selectedBranchFilter.length === 0 || !dateRange || !Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            return;
        }

        setIsRefreshing(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const url = `/admin/asistencias/records`;
            // Obtener fechas del rango seleccionado
            const [start, end] = dateRange;
            // Asegurar que el inicio sea a las 00:00:00 y el fin a las 23:59:59
            const startDate = start ? start.startOf('day').format('YYYY-MM-DD HH:mm:ss') : null;
            const endDate = end ? end.endOf('day').format('YYYY-MM-DD HH:mm:ss') : null;
            // Obtener la zona horaria del cliente
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({
                    "start_date": startDate,
                    "end_date": endDate,
                    "branch_ids": selectedBranchFilter,
                    "type": attendanceType,
                    "time_zone": timeZone
                })
            });

            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const data = await response.json();

            // Validar los datos recibidos - acceder directamente a data.modelos
            const receivedData = data.data || [];
            const validData = Array.isArray(receivedData) ? receivedData.filter(ingreso =>
                ingreso &&
                typeof ingreso === 'object' &&
                (ingreso.id !== undefined && ingreso.id !== null && ingreso.id !== '')
            ) : [];

            // Actualizar baseAttendances - esto disparará los useEffect para actualizar filteredData
            setBaseAttendances(validData);

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

// Actualizar datos filtrados cuando cambian los baseAttendances
useEffect(() => {
    // Validación robusta de datos
    const validAttendances = Array.isArray(baseAttendances) ? baseAttendances.filter(attendance =>
        attendance &&
        typeof attendance === 'object' &&
        (attendance.id !== undefined && attendance.id !== null && attendance.id !== '')
    ) : [];

    setFilteredData(validAttendances);
    setPagination(prev => ({
        ...prev,
        total: validAttendances.length,
        current: Math.max(1, prev.current) // Asegurar que current nunca sea menor a 1
    }));
}, [baseAttendances]);

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
            case 'ingreso':
            case 'salida':
                aValue = a?.[sorting.field] ? new Date(a[sorting.field]) : new Date(0);
                bValue = b?.[sorting.field] ? new Date(b[sorting.field]) : new Date(0);
                break;
            case 'nombres':
            case 'identificacion':
            case 'sede':
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

// Calcular datos paginados con validación
const startIndex = Math.max(0, (Math.max(1, pagination.current) - 1) * Math.max(1, pagination.pageSize));
const endIndex = startIndex + Math.max(1, pagination.pageSize);
const validFilteredData = Array.isArray(filteredData) ? filteredData.filter(item =>
    item &&
    typeof item === 'object' &&
    (item.id !== undefined && item.id !== null && item.id !== '')
) : [];
const paginatedData = validFilteredData.slice(startIndex, endIndex);


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

// Configuración de las columnas para asistencias
const columns = [
    {
        title: 'Nombre Completo',
        dataIndex: 'nombres',
        key: 'nombres',
        width: windowWidth <= 576 ? 140 : windowWidth <= 768 ? 180 : 220,
        fixed: 'left',
        render: (text) => <Text strong>{text || 'N/A'}</Text>,
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'nombres' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('nombres') }),
        filterable: true,
    },
    {
        title: 'Identificación',
        dataIndex: 'identificacion',
        key: 'identificacion',
        width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 140,
        render: (text) => text || 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'identificacion' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('identificacion') }),
    },
    {
        title: 'Sede',
        dataIndex: 'sede',
        key: 'sede',
        width: windowWidth <= 576 ? 100 : windowWidth <= 768 ? 130 : 150,
        render: (text) => text || 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'sede' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('sede') }),
    },
    {
        title: 'Ingreso',
        dataIndex: 'ingreso',
        key: 'ingreso',
        width: windowWidth <= 576 ? 160 : windowWidth <= 768 ? 180 : 200,
        render: (text) => {
            if (!text) return 'N/A';
            try {
                const date = new Date(text);
                return date.toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } catch (error) {
                return text;
            }
        },
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'ingreso' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('ingreso') }),
    },
    // Columna de salida solo si es empleados
    ...(attendanceType === 'employees' ? [
        {
            title: 'Salida',
            dataIndex: 'salida',
            key: 'salida',
            width: windowWidth <= 576 ? 160 : windowWidth <= 768 ? 180 : 200,
            render: (text) => {
                if (!text) return 'N/A';
                try {
                    const date = new Date(text);
                    return date.toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } catch (error) {
                    return text;
                }
            },
            sorter: { compare: (a, b) => 0, multiple: false },
            sortOrder: sorting.field === 'salida' ? sorting.order : null,
            onHeaderCell: () => ({ onClick: () => handleColumnSort('salida') }),
        },
    ] : []),
    {
        title: 'Acciones',
        key: 'actions',
        width: windowWidth <= 576 ? 80 : windowWidth <= 768 ? 100 : 120,
        render: (_, record) => (
            <Space size={windowWidth <= 576 ? "small" : "middle"}>
                <Tooltip title="Editar asistencia">
                    <Button
                        type="text"
                        size={windowWidth <= 768 ? "small" : "middle"}
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditRecord(record);
                            setEditModalOpen(true);
                        }}
                        disabled={!can('editar_asistencias')}
                    />
                </Tooltip>
                <Tooltip title="Eliminar asistencia">
                    <Popconfirm
                        title="¿Estás seguro de eliminar este registro de asistencia?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={async () => {
                            try {
                                const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                const response = await fetch(`/admin/asistencias/${record.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': token,
                                        'X-Requested-With': 'XMLHttpRequest'
                                    }
                                });
                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.message || 'Error al eliminar la asistencia');
                                }
                                const result = await response.json();
                                message.success('Asistencia eliminada correctamente');
                                // Recargar datos después de eliminar
                                refreshData();
                            } catch (error) {
                                console.error('Error al eliminar asistencia:', error);
                                message.error(error.message || 'Error al eliminar la asistencia');
                            }
                        }}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                    >
                        <Button
                            type="text"
                            size={windowWidth <= 768 ? "small" : "middle"}
                            danger
                            icon={<DeleteOutlined />}
                            disabled={!can('editar_asistencias')}
                        />
                    </Popconfirm>
                </Tooltip>
            </Space>
        ),
    },
];

    return (
        <>
        <EditAttendanceModal
            open={editModalOpen}
            onClose={handleCloseEditModal}
            record={editRecord}
            type={attendanceType}
        />
        <AdminLayout title="Registros de Asistencia">
        <div className={styles.modelosPage}>
            {/* Header de la página */}
            <div className={styles.headerSection}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <ClockCircleOutlined style={{ marginRight: '8px' }} />
                        Registros de Asistencia
                    </Title>
                    <Text type="secondary">
                        Consulta los registros de entrada y salida
                        <span> • {Array.isArray(baseAttendances) ? baseAttendances.length : 0} registro(s)</span>
                    </Text>
                </div>
            </div>

            {/* CONTENEDOR B - Grid anidado */}
            <div className={styles.cardContainer}>
                {/* CONTENEDOR 1 - Filtros */}

                <div className={styles.filtersSection}>
                    <CustomDateRangePicker
                        ref={dateRangePickerRef}
                        format="YYYY-MM-DD"
                        value={dateRange}
                        onChange={setDateRange}
                        style={{ marginRight: 8 }}
                    />
                    <Select
                        mode="multiple"
                        placeholder="Sedes"
                        value={selectedBranchFilter}
                        onChange={setSelectedBranchFilter}
                        allowClear
                        loading={branchOptions.length === 0}
                    >
                        {branchOptions.map(branch => (
                            <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
                        ))}
                    </Select>
                    <Radio.Group
                        value={attendanceType}
                        onChange={e => setAttendanceType(e.target.value)}
                        buttonStyle="solid"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                        <Radio.Button value="models" style={{ flex: 1, textAlign: 'center' }}>Modelos</Radio.Button>
                        <Radio.Button value="employees" style={{ flex: 1, textAlign: 'center' }}>Empleados</Radio.Button>
                    </Radio.Group>
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={refreshData}
                        loading={isRefreshing}
                    >
                    </Button>
                </div>

                {/* CONTENEDOR 3 - Tabla */}
                <div className={styles.tableContainer}>
                    {filteredData.length > 0 ? (
                        <Table
                            columns={columns}
                            dataSource={paginatedData}
                            rowKey={(record) => record?.id || `fallback-${Math.random()}`}
                            onChange={handleTableChange}
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
                            description="No hay registros de asistencia disponibles. Configure los filtros para consultar los datos."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Text type="secondary">
                                Los datos se cargarán cuando configure los filtros de fecha, sede y tipo de personal.
                            </Text>
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
                                return `${safeRange[0]}-${safeRange[1]} de ${safeTotal} registros`;
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
        </div>
    </AdminLayout>
    </>
);
}