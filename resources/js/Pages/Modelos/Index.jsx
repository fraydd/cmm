import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { Button, Space, Typography, Table, Tag, Empty, Input, Select, Tooltip, Popconfirm, message, Pagination } from 'antd';
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
    CheckOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications.jsx';
import { useBranch } from '../../hooks/useBranch.jsx'; // Importar hook de sede
import ModeloModal from '../../Components/ModeloModal.jsx';
import { Modal } from 'antd';
import AdminLayout from '../../Layouts/AdminLayout';
import styles from './Index.module.scss';

const { Title, Text } = Typography;

export default function Index({ modelos = [], debug_info }) {
    const { showSuccess, showError } = useNotifications();
    const { selectedBranch } = useBranch(); // Hook para obtener sede seleccionada
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadingCashRegister, setLoadingCashRegister] = useState(false);
    const [cashRegisterActive, setCashRegisterActive] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [containerHeight, setContainerHeight] = useState(0);
    
    // Estado para los modelos base (fuente de verdad)
    const [baseModelos, setBaseModelos] = useState(Array.isArray(modelos) ? modelos : []);
    const [filteredData, setFilteredData] = useState(Array.isArray(modelos) ? modelos : []);
    const [editingModeloId, setEditingModeloId] = useState(null);
    
    const [filters, setFilters] = useState({
        search: ''
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

    // Función para recargar datos cuando cambie la sede
    const reloadDataWithBranch = async () => {
        if (!selectedBranch?.id) return;
        
        setIsRefreshing(true);
        try {
            const url = `/admin/modelos?branch_id=${selectedBranch.id}`;
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setBaseModelos(data.modelos || []);
                setFilteredData(data.modelos || []);
                setIsUpdated(true);
                
                setTimeout(() => setIsUpdated(false), 2000);
            }
        } catch (error) {
            console.error('Error recargando datos:', error);
            showError('Error al recargar los datos');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Efecto para recargar datos cuando cambie la sede seleccionada
    useEffect(() => {
        if (selectedBranch?.id) {
            reloadDataWithBranch();
        }
    }, [selectedBranch?.id]);

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
                (item.nombre_completo || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.numero_identificacion || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.medidas_corporales || '').toLowerCase().includes(filters.search.toLowerCase())
            );
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
    

    // Valida si hay caja activa antes de mostrar el modal
    const handleAddModel = async () => {
        if (!selectedBranch?.id) {
            showError('Debe seleccionar una sede antes de registrar un modelo.');
            return;
        }
        setLoadingCashRegister(true);
        try {
            const response = await fetch(`/admin/cash-register/getActive/${selectedBranch.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (!response.ok) {
                setCashRegisterActive(null);
                Modal.error({
                    title: 'Caja no abierta',
                    content: 'No hay una caja abierta en esta sede. Solicite la apertura de caja para continuar.',
                    okText: 'Cerrar',
                    maskClosable: false,
                    closable: false,
                });
                return;
            }
            const data = await response.json();
            setCashRegisterActive(data.caja || null);
            setEditingModeloId(null); // Modo crear
            setIsModalVisible(true);
        } catch (error) {
            setCashRegisterActive(null);
            Modal.error({
                title: 'Caja no abierta',
                content: 'No hay una caja abierta en esta sede. Solicite la apertura de caja para continuar.',
                okText: 'Cerrar',
                maskClosable: false,
                closable: false,
            });
        } finally {
            setLoadingCashRegister(false);
        }
    };
   const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingModeloId(null);
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
                    original_name: img.original_name || img.name,
                    // Campos necesarios para el modo edición
                    isExisting: img.isExisting || false,
                    isNew: img.isNew || false,
                    id: img.existingId || img.id // El backend busca por 'id', no 'existingId'
                }));
                formData.append('model_images_meta', JSON.stringify(imagesMeta));
                
                values.model_images.forEach((image, index) => {
                    if (image.originFileObj) {
                        formData.append(`model_images${index}`, image.originFileObj);
                    }
                });
            }

            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            let response, result;

            if (editingModeloId) {
                // Modo edición: PUT
                // Si se está editando, agregar _method para Laravel
                formData.append('_method', 'PUT');
                response = await fetch(`/admin/modelos/${editingModeloId}`, {
                    method: 'POST', // Laravel espera POST con _method=PUT para FormData
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': token
                    }
                });
            } else {
                // Modo crear: POST
                response = await fetch('/admin/modelos', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': token
                    }
                });
            }

            if (!response.ok) {
                let errorMsg = 'Error en la respuesta del servidor';
                try {
                    const errorData = await response.json();
                    
                    // Manejar errores de validación específicos (422)
                    if (response.status === 422 && errorData.errors) {
                        // Mostrar el primer error de validación
                        const firstError = Object.values(errorData.errors)[0];
                        errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else {
                        errorMsg = errorData.message || errorMsg;
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                }
                throw new Error(errorMsg);
            }

            result = await response.json();
            
            // Solo si llegamos aquí significa que fue exitoso
            showSuccess(editingModeloId ? 'Modelo actualizado exitosamente!' : 'Modelo creado exitosamente!');
            setIsModalVisible(false);
            setEditingModeloId(null);
            await refreshData();
        } catch (error) {
            console.error('Error al guardar modelo:', error);
            showError(error.message || 'Error al guardar el modelo. Inténtalo de nuevo.');
            // Importante: NO cerrar el modal aquí - el usuario conserva sus datos
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
            search: ''
        });
        // También resetear el ordenamiento
        setSorting({
            field: null,
            order: null
        });
    };

    // Función para recargar datos dinámicamente
    const refreshData = async () => {
        if (!selectedBranch?.id) {
            console.warn('No hay sede seleccionada para cargar datos');
            return;
        }
        
        setIsRefreshing(true);
        try {
            const url = `/admin/modelos?branch_id=${selectedBranch.id}`;
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
            
            // Validar los datos recibidos - acceder directamente a data.modelos
            const receivedModelos = data.modelos || [];
            const validData = Array.isArray(receivedModelos) ? receivedModelos.filter(model => 
                model && 
                typeof model === 'object' && 
                (model.id !== undefined && model.id !== null && model.id !== '')
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


    // Configuración de la tabla
    const columns = [
        {
            title: 'Nombre Completo',
            dataIndex: 'nombre_completo',
            key: 'nombre_completo',
            width: windowWidth <= 576 ? 140 : windowWidth <= 768 ? 180 : 220,
            fixed: 'left', // Columna fija a la izquierda
            render: (text) => <Text strong>{text || 'N/A'}</Text>,
            sorter: {
                compare: (a, b) => 0, // Función dummy, el sorting real se hace en applySorting
                multiple: false
            },
            sortOrder: sorting.field === 'nombre_completo' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('nombre_completo')
            }),
            filterable: true,
        },
        {
            title: 'Número de Identificación',
            dataIndex: 'numero_identificacion',
            key: 'numero_identificacion',
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 180,
            render: (text) => text || 'N/A',
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'numero_identificacion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('numero_identificacion')
            }),
        },
        {
            title: 'Medidas Corporales',
            dataIndex: 'medidas_corporales',
            key: 'medidas_corporales',
            width: windowWidth <= 576 ? 130 : windowWidth <= 768 ? 160 : 180,
            render: (text) => {
                if (text === 'No registradas') {
                    return <Text type="secondary">{text}</Text>;
                }
                return <Text>{text}</Text>;
            },
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'medidas_corporales' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('medidas_corporales')
            }),
        },
        {
            title: 'Estado',
            dataIndex: 'estado_suscripcion',
            key: 'estado_suscripcion',
            width: windowWidth <= 576 ? 100 : windowWidth <= 768 ? 130 : 100,
            render: (estado) => {
                const colorMap = {
                    'Activo': 'success',
                    'Vencido': 'error',
                    'Pronto': 'warning',
                    'Sin suscripción': 'default'
                };
                const estadoText = estado || 'N/A';
                return (
                    <Tag 
                        color={colorMap[estado] || 'default'}
                        style={{
                            fontSize: windowWidth <= 576 ? '10px' : '12px',
                            padding: windowWidth <= 576 ? '2px 4px' : '4px 8px'
                        }}
                    >
                        {estadoText.toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Activo', value: 'Activo' },
                { text: 'Vencido', value: 'Vencido' },
                { text: 'Pronto', value: 'Pronto' },
                { text: 'Sin suscripción', value: 'Sin suscripción' },
            ],
            onFilter: (value, record) => record?.estado_suscripcion === value,
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'estado_suscripcion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('estado_suscripcion')
            }),
        },
        {
            title: 'Desde',
            dataIndex: 'fecha_inicio_suscripcion',
            key: 'fecha_inicio_suscripcion',
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 110,
            render: (text) => text === 'N/A' ? <Text type="secondary">{text}</Text> : text,
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'fecha_inicio_suscripcion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('fecha_inicio_suscripcion')
            }),
        },
        {
            title: 'Hasta',
            dataIndex: 'fecha_fin_suscripcion',
            key: 'fecha_fin_suscripcion',
            width: windowWidth <= 576 ? 120 : windowWidth <= 768 ? 150 : 110,
            render: (text) => text === 'N/A' ? <Text type="secondary">{text}</Text> : text,
            sorter: {
                compare: (a, b) => 0,
                multiple: false
            },
            sortOrder: sorting.field === 'fecha_fin_suscripcion' ? sorting.order : null,
            onHeaderCell: () => ({
                onClick: () => handleColumnSort('fecha_fin_suscripcion')
            }),
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: windowWidth <= 576 ? 80 : windowWidth <= 768 ? 100 : 120,
            render: (_, record) => (
                <Space size={windowWidth <= 576 ? "small" : "middle"}>
                    <Tooltip title="Ver detalles del modelo">
                        <Button 
                            type="text" 
                            size={windowWidth <= 768 ? "small" : "middle"} 
                            icon={<EyeOutlined />}
                            onClick={() => {
                                window.location.href = `/admin/modelos/${record.id}`;
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Editar modelo">
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
                                size={windowWidth <= 768 ? "small" : "middle"} 
                                danger 
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title="Tienda">
                        <Button
                            type="text"
                            size={windowWidth <= 768 ? "small" : "middle"}
                            icon={<ShoppingCartOutlined />}
                            onClick={() => {
                                if (record.numero_identificacion) {
                                    window.location.href = `/admin/tienda?identificacion=${encodeURIComponent(record.numero_identificacion)}`;
                                } else {
                                    console.log('El modelo no tiene número de identificación');
                                }
                            }}
                        />
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
                        <Text type="secondary">
                            Gestiona todos los modelos registrados en el sistema
                            {selectedBranch?.id && (
                                <span> • <strong>{selectedBranch.name}</strong></span>
                            )}
                            <span> • {Array.isArray(baseModelos) ? baseModelos.length : 0} total(es)</span>
                        </Text>
                    </div>
                </div>

                {/* CONTENEDOR B - Grid anidado */}
                <div className={styles.cardContainer}>
                    {/* CONTENEDOR 1 - Filtros */}
                    <div className={styles.filtersSection}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                            <Input
                                placeholder="Buscar por nombre completo o número de identificación..."
                                prefix={<SearchOutlined />}
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                allowClear
                                style={{ flex: 1 }}
                            />
                            <Button 
                                icon={<ClearOutlined />}
                                onClick={clearFilters}
                                style={{ flexShrink: 0 }}
                            />
                        </div>
                        <Space>
                            {selectedRowKeys.length > 0 && (
                                <span className={styles.selectedCount}>
                                    {selectedRowKeys.length} seleccionado(s)</span>
                            )}
                        </Space>
                    </div>                    {/* CONTENEDOR 2 - Acciones masivas */}
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
                                description={
                                    selectedBranch?.id 
                                        ? `No hay modelos con suscripciones en la sede "${selectedBranch.name}" que coincidan con los filtros`
                                        : "No hay modelos registrados o debe seleccionar una sede"
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                {selectedBranch?.id ? (
                                    <Button type="primary" onClick={handleAddModel}>
                                        Agregar Primer Modelo
                                    </Button>
                                ) : (
                                    <div>
                                        <p>Seleccione una sede para ver los modelos con suscripciones activas</p>
                                    </div>
                                )}
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
                    modeloId={editingModeloId}
                />
            </div>
        </AdminLayout>
    );
}