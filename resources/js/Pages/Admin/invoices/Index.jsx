import EditCashMovementModal from './EditCashMovementModal.jsx';
import RegistrarEgresoModal from './RegistrarEgresoModal.jsx';
import React, { useEffect, useState } from 'react';
import { Button, Space, Typography, Table, Tag, Empty, Input, Select, Tooltip, Popconfirm, message, Pagination, DatePicker, Popover } from 'antd';
import {
    DollarOutlined,
    SearchOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx';
import AdminLayout from '../../../Layouts/AdminLayout.jsx';
import styles from './Index.module.scss';
import { router, usePage } from '@inertiajs/react';


const { Title, Text } = Typography;

import dayjs from 'dayjs';

export default function Index() {
    const { showSuccess, showError } = useNotifications();
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [containerHeight, setContainerHeight] = useState(0);
    const [baseData, setBaseData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [dateRange, setDateRange] = useState([
        dayjs().startOf('month'),
        dayjs()
    ]);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
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

    // Estado para modal de creación y egreso
    const [createModalOpen, setcreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createRecord, setCreateRecord] = useState(null);
    const [editRecord, setEditRecord] = useState(null);
    const [egresoModalOpen, setEgresoModalOpen] = useState(false);
    const [egresoInitialData, setEgresoInitialData] = useState(null);
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

    // Botón para nueva apertura de caja
    const handleOpenNewCashRegister = () => {
        setEgresoInitialData(null);
        setEgresoModalOpen(true);
    };

    const handleOpenEdit = (record) => {
        router.visit(`/admin/invoices/edit/${record.id}`);
    };

    // Función para cerrar el modal y refrescar la tabla si se guardó
    const handleClosecreateModal = (shouldRefresh = false) => {
        setcreateModalOpen(false);
        setCreateRecord(null);
        if (shouldRefresh) {
            refreshData();
        }
    };

    const handleCloseEgresoModal = (shouldRefresh = false) => {
        setEgresoModalOpen(false);
        setEgresoInitialData(null);
        if (shouldRefresh) {
            refreshData();
        }
    };
    const handleCloseEditModal = (shouldRefresh = false) => {

        setEditModalOpen(false);
        setEditRecord(null);
        console.log("cerrando modal", shouldRefresh);

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


    const refreshData = async () => {
        // Si faltan filtros requeridos, no hacer nada (ni mostrar error)
        if (!selectedBranchFilter || selectedBranchFilter.length === 0 || !dateRange || !Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
            return;
        }

        setIsRefreshing(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const url = `/admin/invoices/list`;
            // Obtener fechas del rango seleccionado
            const [start, end] = dateRange;
            // Obtener la zona horaria del cliente
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Convertir fechas locales a UTC manualmente (sin .tz)
            const startDate = start ? new Date(start.startOf('day').format('YYYY-MM-DD HH:mm:ss') + ' UTC').toISOString().replace('T', ' ').substring(0, 19) : null;
            const endDate = end ? new Date(end.endOf('day').format('YYYY-MM-DD HH:mm:ss') + ' UTC').toISOString().replace('T', ' ').substring(0, 19) : null;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({
                    branch_ids: selectedBranchFilter,
                    start_date: startDate,
                    end_date: endDate,
                    time_zone: timeZone
                })
            });

            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const data = await response.json();
            const receivedData = data.invoices || [];
            const validData = Array.isArray(receivedData) ? receivedData.filter(row =>
                row &&
                typeof row === 'object' &&
                (row.id !== undefined && row.id !== null && row.id !== '')
            ) : [];

            setBaseData(validData);
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
        return 'calc(52vh - 60px)';
    } else if (windowWidth <= 768) {
        return 'calc(55vh - 80px)';
    } else if (windowWidth <= 992) {
        return 'calc(65vh - 180px)';
    } else {
        return 'calc(75vh - 200px)';
    }
};

// Actualizar datos filtrados cuando cambian los baseData
useEffect(() => {
    // Validación robusta de datos
    const validAttendances = Array.isArray(baseData) ? baseData.filter(attendance =>
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
}, [baseData]);

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
const sortedData = applySorting(validFilteredData);
const paginatedData = sortedData.slice(startIndex, endIndex);

const handleDelete = (id) => {
    // Lógica para eliminar la factura
    console.log(`Eliminar factura con ID: ${id}`);
};

const handleView = async (id) => {
    // Lógica para ver los detalles de la factura
    console.log(`Ver factura con ID: ${id}`);
    try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const url = `/admin/invoices/${id}/pdf`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                }
            });

            if (!response.ok) {
                throw new Error('Error al generar pdf');
            }

            response.blob().then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            });
        } catch (error) {
            showError('Error al generar pdf.');
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

// Configuración de las columnas para cash register
const columns = [
        // La columna ID se oculta, pero el dato sigue disponible en los registros para acciones futuras
    {
        title: 'Sede',
        dataIndex: 'sede',
        key: 'sede',
        width: 150,
        render: (text) => text || 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'sede' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('sede') }),
    },
    {
        title: 'Responsable',
        dataIndex: 'responsable',
        key: 'responsable',
        width: 180,
        render: (text) => text || 'N/A',        
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'responsable' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('responsable') }),
    },
    {
        title: 'Persona',
        dataIndex: 'nombre',
        key: 'nombre',
        width: 180,
        render: (text) => text || 'N/A',        
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'nombre' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('nombre') }),
    },
    {
        title: 'Monto',
        dataIndex: 'total_amount',
        key: 'total_amount',
        width: 120,
        render: (text) => text ? `$${parseFloat(text).toLocaleString('es-CO')}` : 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'total_amount' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('total_amount') }),
    },
    {
        title: 'Pagado',
        dataIndex: 'paid_amount',
        key: 'paid_amount',
        width: 120,
        render: (text) => text ? `$${parseFloat(text).toLocaleString('es-CO')}` : 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'paid_amount' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('paid_amount') }),
    },
    {
        title: 'Tipo',
        dataIndex: 'invoice_type',
        key: 'invoice_type',
        width: 120,
        render: (text) => {
            if (text === 'Ingreso') return <Tag className={styles.tagsp} color='green'>Ingreso</Tag>;
            if (text === 'Egreso') return <Tag className={styles.tagsp} color='red'>Egreso</Tag>;
            return text || 'N/A';
        },
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'invoice_type' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('invoice_type') }),
    },
    {
        title: 'Estado',
        dataIndex: 'invoice_status',
        key: 'invoice_status',
        width: 120,
        render: (text) => {
            if (text === 'Pendiente') return <Tag className={styles.tagsp}g color="orange">Pendiente</Tag>;
            if (text === 'Pagada') return <Tag className={styles.tagsp} color="green">Pagada</Tag>;
            if (text === 'Parcialmente Pagada') return <Tag className={styles.tagsp} color="yellow">Parcialmente</Tag>;
            if (text === 'Anulada') return <Tag className={styles.tagsp} color="red">Anulada</Tag>;
            if (text === 'Vencida') return <Tag className={styles.tagsp} color="gray">Vencida</Tag>;
            return text || 'N/A';
        },
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'invoice_status' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('invoice_status') }),
    },
    {
        title: 'Observaciones',
        dataIndex: 'observations',
        key: 'observations',
        width: 180,
        render: (text) => text ? (
            <Popover content={<span style={{ whiteSpace: 'pre-line', maxWidth: 350, display: 'block', wordBreak: 'break-word' }}>{text}</span>} title="Observaciones" placement="top">
                <span
                    style={{
                        display: 'inline-block',
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                        cursor: 'pointer',
                    }}
                >
                    {text}
                </span>
            </Popover>
        ) : <span style={{ color: '#aaa' }}>—</span>,
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'observations' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('observations') }),
    },
    {
        title: 'Fecha',
        dataIndex: 'invoice_date',
        key: 'invoice_date',
        width: 180,
        render: (text) => text ? dayjs.utc(text).local().format('YYYY-MM-DD hh:mm A') : 'N/A',
        sorter: { compare: (a, b) => 0, multiple: false },
        sortOrder: sorting.field === 'invoice_date' ? sorting.order : null,
        onHeaderCell: () => ({ onClick: () => handleColumnSort('invoice_date') }),
    },
    {
        title: 'Acciones',
        key: 'actions',
        fixed: 'right',
        width: 80,
        render: (_, record) => (
            record.status !== 'closed' ? (
                <Space size={windowWidth <= 576 ? "small" : "middle"}>
                    <Tooltip title="Ver detalles de la factura">
                        <Button 
                            type="text" 
                            size={windowWidth <= 768 ? "small" : "middle"} 
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Eliminar factura">
                        <Popconfirm
                            title="¿Estás seguro de eliminar esta factura?"
                            description="Esta acción no se puede deshacer"
                            onConfirm={() => handleDelete(record.id)}
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
                    <Tooltip title="Editar registro">
                        <Button
                            type="text"
                            size={windowWidth <= 768 ? "small" : "middle"} 
                            icon={<EditOutlined style={{ color: '#48a41aff'}} />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    </Tooltip>
                </Space>
            ) : null
        ),
    },
];

    return (
        <>
        <AdminLayout title="Facturas">
        <div className={styles.CashRegisterPage}>
            {/* Header de la página */}
            <div className={styles.headerSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <DollarOutlined style={{ marginRight: '8px' }} />
                            Facturas
                        </Title>
                        <Text type="secondary">
                            Consulta los Facturas de las sedes seleccionadas
                            <span> • {Array.isArray(baseData) ? baseData.length : 0} registro(s)</span>
                        </Text>
                    </div>
                    <Button type="primary" onClick={handleOpenNewCashRegister}>
                        Registrar egreso
                    </Button>
                </div>
            </div>

            {/* CONTENEDOR B - Grid anidado */}
            <div className={styles.cardContainer}>
                {/* CONTENEDOR 1 - Filtros */}

                <div className={styles.filtersSection}>
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="YYYY-MM-DD"
                        allowClear={false}
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
            <EditCashMovementModal
                open={editModalOpen}
                onClose={handleCloseEditModal}
                record={editRecord}
                branchOptions={branchOptions}
            />
            <RegistrarEgresoModal
                open={egresoModalOpen}
                onClose={handleCloseEgresoModal}
                initialData={egresoInitialData}
            />
        </div>
        </AdminLayout>
        </>
    );
}