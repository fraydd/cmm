import React, { useState, useEffect } from 'react';
import styles from './Index.module.scss';
import dayjs from 'dayjs';
import {
    Layout,
    Tabs,
    Card,
    Button,
    Space,
    Typography,
    Input,
    Select,
    Row,
    Col,
    Badge,
    Tag,
    Modal,
    Form,
    InputNumber,
    DatePicker,
    Upload,
    Switch,
    Divider,
    Empty,
    message
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ShopOutlined,
    CrownOutlined,
    CalendarOutlined,
    UploadOutlined,
    SearchOutlined,
    FilterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import AdminLayout from '../../../../Layouts/AdminLayout';
import { useBranch } from '../../../../hooks/useBranch';
import { useNotifications } from '../../../../hooks/useNotifications';
import { usePermissions } from '../../../../hooks/usePermissions';
import ProductModal from './ProductModal';
import SubscriptionModal from './SubscriptionModal';
import EventModal from './EventModal';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export default function StoreSurtir({ auth, branch }) {
    const { can } = usePermissions();
    const { selectedBranch } = useBranch();
    const { showSuccess, showError } = useNotifications();
    
    // Estados generales
    const [activeTab, setActiveTab] = useState('productos');
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('todos');
    
    // Estados para modales específicos
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [productModalMode, setProductModalMode] = useState('create');
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
    const [subscriptionModalMode, setSubscriptionModalMode] = useState('create');
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    
    const [eventModalVisible, setEventModalVisible] = useState(false);
    const [eventModalMode, setEventModalMode] = useState('create');
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // Estados para datos
    const [productos, setProductos] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    
    // Estados para datos filtrados
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [suscripcionesFiltradas, setSuscripcionesFiltradas] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    
    // Form reference - comentado temporalmente
    // const [form] = Form.useForm();

    // Cargar productos cuando cambie la sede
    const fetchProducts = async () => {
        if (!selectedBranch?.id) {
            return;
        }

        setLoading(true);
        try {
            
            const response = await fetch('/admin/tienda/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ branch_id: selectedBranch.id })
            });

            if (response.ok) {
                const data = await response.json();
                setProductos(data.products || []);
                setCategorias(data.categories || []);
            } else {
                setProductos([]);
                setCategorias([]);
                showError('Error al cargar productos');
            }
        } catch (error) {
            setProductos([]);
            setCategorias([]);
            showError('Error al cargar productos');
        }
        setLoading(false);
    };

    // Cargar suscripciones cuando cambie la sede
    const fetchSubscriptions = async () => {
        if (!selectedBranch?.id) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/admin/tienda/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ branch_id: selectedBranch.id })
            });

            if (response.ok) {
                const data = await response.json();
                setSuscripciones(data.subscriptions || []);
            } else {
                setSuscripciones([]);
                showError('Error al cargar suscripciones');
            }
        } catch (error) {
            setSuscripciones([]);
            showError('Error al cargar suscripciones');
        }
        setLoading(false);
    };

    // Cargar categorías independientemente
    const fetchCategories = async () => {
        try {
            const response = await fetch('/admin/tienda/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.categories) {
                    setCategorias(data.categories);
                }
            }
        } catch (error) {
            // Fallar silenciosamente, las categorías se cargan desde getProducts también
        }
    };

    // Cargar eventos cuando cambie la sede
    const fetchEvents = async () => {
        if (!selectedBranch?.id) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/admin/tienda/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ branch_id: selectedBranch.id })
            });

            if (response.ok) {
                const data = await response.json();
                setEventos(data.events || []);
            } else {
                setEventos([]);
                showError('Error al cargar eventos');
            }
        } catch (error) {
            setEventos([]);
            showError('Error al cargar eventos');
        }
        setLoading(false);
    };

    // Función para filtrar productos
    const filtrarProductos = () => {
        let productosFiltrados = productos;

        // Filtro por búsqueda de nombre
        if (searchText.trim()) {
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.name.toLowerCase().includes(searchText.toLowerCase().trim())
            );
        }

        // Filtro por categoría
        if (filterCategory && filterCategory !== 'todos') {
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.category_name === filterCategory
            );
        }

        setProductosFiltrados(productosFiltrados);
    };

    // Función para filtrar suscripciones
    const filtrarSuscripciones = () => {
        let suscripcionesFiltradas = suscripciones;

        // Filtro por búsqueda de nombre
        if (searchText.trim()) {
            suscripcionesFiltradas = suscripcionesFiltradas.filter(suscripcion =>
                suscripcion.name.toLowerCase().includes(searchText.toLowerCase().trim())
            );
        }

        setSuscripcionesFiltradas(suscripcionesFiltradas);
    };

    // Función para filtrar eventos
    const filtrarEventos = () => {
        let eventosFiltrados = eventos;

        // Filtro por búsqueda de nombre
        if (searchText.trim()) {
            eventosFiltrados = eventosFiltrados.filter(evento =>
                evento.name.toLowerCase().includes(searchText.toLowerCase().trim())
            );
        }

        setEventosFiltrados(eventosFiltrados);
    };

    // Aplicar filtros cuando cambien los datos o filtros
    useEffect(() => {
        filtrarProductos();
        filtrarSuscripciones();
        filtrarEventos();
    }, [productos, suscripciones, eventos, searchText, filterCategory]);

    // Cargar sedes disponibles al montar el componente
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch('/admin/asistencias/branches/access');
                if (!response.ok) throw new Error('Error al cargar sedes');
                const data = await response.json();
                setBranchOptions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error al cargar sedes:', error);
                showError('No se pudieron cargar las sedes');
            }
        };
        fetchBranches();
    }, []);

    // Limpiar filtros cuando cambie de pestaña
    useEffect(() => {
        setSearchText('');
        setFilterCategory('todos');
    }, [activeTab]);

    // Ejecutar cuando cambie la sede
    useEffect(() => {
        fetchProducts();
        fetchSubscriptions();
        fetchEvents();
        fetchCategories(); // Cargar categorías independientemente
    }, [selectedBranch?.id]);


    // Manejador para abrir modales según la pestaña activa
    const showModal = (mode, item = null) => {
        console.log('🔧 Modal solicitado:', {
            mode: mode,
            activeTab: activeTab,
            item: item,
            timestamp: new Date().toLocaleString()
        });
        
        // Si es un producto, abrir el modal específico
        if (activeTab === 'productos') {
            setProductModalMode(mode);
            setSelectedProduct(item);
            setProductModalVisible(true);
            console.log(`✨ Abriendo ProductModal en modo: ${mode}`);
        } else if (activeTab === 'suscripciones') {
            setSubscriptionModalMode(mode);
            setSelectedSubscription(item);
            setSubscriptionModalVisible(true);
            console.log(`✨ Abriendo SubscriptionModal en modo: ${mode}`);
        } else if (activeTab === 'eventos') {
            // Si es un evento, abrir el modal específico
            setEventModalMode(mode);
            setSelectedEvent(item);
            setEventModalVisible(true);
            console.log(`✨ Abriendo EventModal en modo: ${mode}`);
        }
    };

    // Manejadores específicos para ProductModal
    const handleProductModalCancel = () => {
        setProductModalVisible(false);
        setSelectedProduct(null);
        console.log('❌ ProductModal cancelado');
    };

    // Manejadores específicos para SubscriptionModal
    const handleSubscriptionModalCancel = () => {
        setSubscriptionModalVisible(false);
        setSelectedSubscription(null);
        console.log('❌ SubscriptionModal cancelado');
    };

    const handleProductModalSubmit = async (structuredData) => {

        try {
            const response = await fetch('/admin/store/products/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(structuredData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                
                showSuccess(result.message || 'Producto procesado exitosamente');
                
                // Cerrar modal y recargar datos
                setProductModalVisible(false);
                setSelectedProduct(null);
                fetchProducts();
            } else {
                showError(result.message || 'Error al procesar el producto');
            }
        } catch (error) {
            showError('Error de conexión con el servidor');
        }
    };

    const handleSubscriptionModalSubmit = async (subscriptionPayload) => {
        console.log('========== ENVIANDO DATOS DE SUSCRIPCIÓN AL BACKEND ==========');
        console.log('📤 Payload de suscripción completo:', subscriptionPayload);
        
        // 🔥 LOG CRÍTICO: Mostrar estructura exacta para el backend
        console.log('🚀 ESTRUCTURA PARA BACKEND:', JSON.stringify(subscriptionPayload, null, 2));
        console.log('📊 RESUMEN DEL ENVÍO:', {
            modo: subscriptionPayload.mode,
            nombre_plan: subscriptionPayload.subscription?.name,
            duracion_meses: subscriptionPayload.subscription?.duration_months,
            precio_base: subscriptionPayload.subscription?.price,
            descripcion: subscriptionPayload.subscription?.description,
            total_sedes_asignadas: subscriptionPayload.branches?.length || 0,
            detalle_sedes: subscriptionPayload.branches?.map(b => `Sede ${b.branch_id}: $${b.price}`) || [],
            timestamp: new Date().toLocaleString()
        });
        
        try {
            // Hacer la petición al backend
            const response = await fetch('/admin/store/subscriptions/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(subscriptionPayload)
            });
            
            const result = await response.json();
            console.log('✅ RESPUESTA DEL BACKEND:', result);
            
            if (!response.ok) {
                throw new Error(result.message || 'Error en el servidor');
            }
            
            showSuccess(result.message || `Plan de suscripción ${subscriptionPayload.mode === 'create' ? 'creado' : 'actualizado'} exitosamente`);
            
            // Cerrar modal
            setSubscriptionModalVisible(false);
            setSelectedSubscription(null);
            
            // Recargar suscripciones
            fetchSubscriptions();
            
        } catch (error) {
            console.error('❌ ERROR AL PROCESAR SUSCRIPCIÓN:', error);
            showError('Error al procesar el plan de suscripción');
        }
    };

    // Manejadores específicos para EventModal
    const handleEventModalCancel = () => {
        setEventModalVisible(false);
        setSelectedEvent(null);
        setEventModalMode('create');
    };

    const handleEventModalSubmit = async (eventPayload) => {
        console.log('========== ENVIANDO DATOS DE EVENTO AL BACKEND ==========');
        console.log('📤 Payload de evento completo:', eventPayload);
        
        // 🔥 LOG CRÍTICO: Mostrar estructura exacta para el backend
        console.log('🚀 ESTRUCTURA PARA BACKEND:', JSON.stringify(eventPayload, null, 2));
        console.log('📊 RESUMEN DEL ENVÍO:', {
            modo: eventPayload.mode,
            nombre_evento: eventPayload.event?.name,
            fecha_evento: eventPayload.event?.event_date,
            fecha_limite_registro: eventPayload.event?.registration_deadline,
            precio_base: eventPayload.event?.price,
            max_participantes: eventPayload.event?.max_participants,
            descripcion: eventPayload.event?.description,
            total_sedes_asignadas: eventPayload.branches?.length || 0,
            detalle_sedes: eventPayload.branches?.map(b => `Sede ${b.branch_id}: $${b.custom_price} (${b.max_participants} participantes)`) || [],
            timestamp: new Date().toLocaleString()
        });
        
        try {
            // Hacer la petición al backend
            const response = await fetch('/admin/store/events/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(eventPayload)
            });
            
            const result = await response.json();
            console.log('✅ RESPUESTA DEL BACKEND:', result);
            
            if (!response.ok) {
                throw new Error(result.message || 'Error en el servidor');
            }
            
            showSuccess(result.message || `Evento ${eventPayload.mode === 'create' ? 'creado' : 'actualizado'} exitosamente`);
            
            // Cerrar modal
            setEventModalVisible(false);
            setSelectedEvent(null);
            
            // Recargar eventos
            fetchEvents();
            
        } catch (error) {
            console.error('❌ ERROR AL PROCESAR EVENTO:', error);
            showError('Error al procesar el evento');
        }
    };

    const handleDelete = (item) => {
        // Verificar si es un evento vencido antes de mostrar el modal
        if (activeTab === 'eventos') {
            const isEventExpired = item.event_status === 'vencido' || 
                                  (item.event_date && dayjs(item.event_date).isBefore(dayjs(), 'day'));
            
            if (isEventExpired) {
                Modal.warning({
                    title: 'No se puede eliminar',
                    content: 'No se puede eliminar un evento vencido.',
                    okText: 'Entendido',
                    centered: true,
                });
                return;
            }
        }

        Modal.confirm({
            title: '¿Está seguro de eliminar este elemento?',
            content: `Se eliminará "${item.name}" permanentemente.`,
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    let endpoint, bodyData, reloadFunction;
                    
                    if (activeTab === 'eventos') {
                        endpoint = '/admin/store/events/delete';
                        bodyData = { event_id: item.id };
                        reloadFunction = fetchEvents;
                    } else if (activeTab === 'productos') {
                        endpoint = '/admin/store/products/delete';
                        bodyData = { product_id: item.id };
                        reloadFunction = fetchProducts;
                    } else if (activeTab === 'suscripciones') {
                        endpoint = '/admin/store/subscriptions/delete';
                        bodyData = { subscription_id: item.id };
                        reloadFunction = fetchSubscriptions;
                    }

                    const response = await fetch(endpoint, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify(bodyData)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Error al eliminar el elemento');
                    }

                    showSuccess(result.message);
                    reloadFunction();
                } catch (error) {
                    console.error('Error al eliminar:', error);
                    showError(error.message || 'Error al eliminar el elemento');
                }
            }
        });
    };


    const suscripcionesEjemplo = [
        {
            id: 1,
            name: 'Plan Básico',
            description: 'Acceso básico a servicios de modelaje',
            price: 50000,
            customPrice: 45000,
            duration: 1,
            isActive: true,
            branches: ['Sede Principal', 'Sede Norte']
        },
        {
            id: 2,
            name: 'Plan Premium',
            description: 'Acceso completo con beneficios exclusivos',
            price: 120000,
            customPrice: null,
            duration: 3,
            isActive: true,
            branches: ['Sede Principal', 'Sede Norte', 'Sede Sur']
        }
    ];

    const eventosEjemplo = [
        {
            id: 1,
            name: 'Casting Nacional 2024',
            description: 'Gran casting para seleccionar nuevos talentos',
            eventDate: '2024-12-15',
            registrationDeadline: '2024-12-10',
            price: 25000,
            customPrice: 20000,
            maxParticipants: 50,
            currentParticipants: 23,
            isActive: true
        },
        {
            id: 2,
            name: 'Workshop de Fotografía',
            description: 'Taller especializado en técnicas de fotografía de moda',
            eventDate: '2024-11-20',
            registrationDeadline: '2024-11-15',
            price: 75000,
            customPrice: null,
            maxParticipants: 20,
            currentParticipants: 12,
            isActive: true
        }
    ];

    // Componente de tarjeta para productos
    const ProductCard = ({ product }) => (
        <Card
            hoverable
            className={styles.productCard}
        >
            {/* Botones de acción en la esquina superior derecha */}
            <div className={styles.actionButtons}>
                <Button 
                    type="text" 
                    size="small"
                    icon={<EditOutlined />} 
                    onClick={() => showModal('edit', product)}
                    className={styles.actionButton}
                    disabled={!can('editar_admin_tienda')}
                    title={!can('editar_admin_tienda') ? 'No tienes permiso para editar' : 'Editar'}
                />
                <Button 
                    type="text" 
                    size="small"
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(product)}
                    className={`${styles.actionButton} ${styles.danger}`}
                    disabled={!can('editar_admin_tienda')}
                    title={!can('editar_admin_tienda') ? 'No tienes permiso para eliminar' : 'Eliminar'}
                />
            </div>

            <div className={styles.productContent}>
                <Row gutter={16} className={styles.productRow}>
                    <Col span={6} className={styles.imageContainer}>
                        {product.images && product.images.length > 0 ? (
                            <img 
                                src={product.images[0].url} 
                                alt={product.name}
                                className={styles.productImage}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className={styles.productImagePlaceholder}
                            style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}
                        >
                            Sin imagen
                        </div>
                    </Col>
                    <Col span={18} className={styles.contentContainer}>
                        <div className={styles.productInfo}>
                            <div className={styles.productMainInfo}>
                                <Title level={5} className={styles.productTitle}>{product.name}</Title>
                                <Tag color="blue" className={styles.productCategory}>{product.category_name}</Tag>
                                <Text type="secondary" className={styles.productDescription}>
                                    {product.description}
                                </Text>
                            </div>
                            <div className={styles.productPriceInfo}>
                                <Title level={4} className={styles.productPrice}>
                                    ${parseFloat(product.final_price || 0).toLocaleString()}
                                </Title>
                                {product.branch_price && product.branch_price !== product.base_price && (
                                    <Text type="secondary" className={styles.customPriceText}>
                                        Precio personalizado (Base: ${parseFloat(product.base_price || 0).toLocaleString()})
                                    </Text>
                                )}
                                <Badge 
                                    count={product.stock_quantity} 
                                    style={{ backgroundColor: product.stock_quantity > 10 ? '#52c41a' : '#faad14' }}
                                    showZero
                                    className={styles.stockBadge}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
    );

    // Componente de tarjeta para suscripciones
    const SubscriptionCard = ({ subscription }) => (
        <Card
            hoverable
            className={styles.subscriptionCard}
        >
            {/* Botones de acción en la esquina superior derecha */}
            <div className={styles.actionButtons}>
                <Button 
                    type="text" 
                    size="small"
                    icon={<EditOutlined />} 
                    onClick={() => showModal('edit', subscription)}
                    className={styles.actionButton}
                    disabled={!can('editar_admin_tienda')}
                    title={!can('editar_admin_tienda') ? 'No tienes permiso para editar' : 'Editar'}
                />
                <Button 
                    type="text" 
                    size="small"
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(subscription)}
                    className={`${styles.actionButton} ${styles.danger}`}
                    disabled={!can('editar_admin_tienda')}
                    title={!can('editar_admin_tienda') ? 'No tienes permiso para eliminar' : 'Eliminar'}
                />
            </div>

            <div className={styles.subscriptionContent}>
                <Row gutter={16} className={styles.subscriptionRow}>
                    <Col span={4} className={styles.iconContainer}>
                        <div className={styles.subscriptionIcon}>
                            <CrownOutlined />
                        </div>
                    </Col>
                    <Col span={20} className={styles.contentContainer}>
                        <div className={styles.subscriptionInfo}>
                            <div className={styles.subscriptionMainInfo}>
                                <Title level={5} className={styles.subscriptionTitle}>{subscription.name}</Title>
                                <Text type="secondary" className={styles.subscriptionDescription}>
                                    {subscription.description}
                                </Text>
                                <Tag color="purple" className={styles.subscriptionDuration}>
                                    {subscription.duration_months} {subscription.duration_months === 1 ? 'mes' : 'meses'}
                                </Tag>
                            </div>
                            <div className={styles.subscriptionPriceInfo}>
                                <Title level={4} className={styles.subscriptionPrice}>
                                    ${parseFloat(subscription.final_price || 0).toLocaleString()}
                                </Title>
                                {subscription.branch_price && subscription.branch_price !== subscription.base_price && (
                                    <Text delete className={styles.originalPrice}>
                                        ${parseFloat(subscription.base_price || 0).toLocaleString()}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
    );

    // Componente de tarjeta para eventos
    const EventCard = ({ event }) => {
        // Verificar si el evento está vencido (más preciso con dayjs)
        const isEventExpired = event.event_status === 'vencido' || 
                              (event.event_date && dayjs(event.event_date).isBefore(dayjs(), 'day'));
        const disabledActions = !can('editar_admin_tienda') || isEventExpired;
        return (
            <Card
                hoverable={!isEventExpired}
                className={`${styles.eventCard} ${isEventExpired ? styles.expiredEventCard : ''}`}
                style={{
                    backgroundColor: isEventExpired ? '#f5f5f5' : undefined,
                    borderColor: isEventExpired ? '#d9d9d9' : undefined,
                    opacity: isEventExpired ? 0.8 : 1
                }}
            >
                {/* Botones de acción en la esquina inferior derecha */}
                <div className={styles.actionButtons}>
                    <Button 
                        type="text" 
                        size="small"
                        icon={<EditOutlined />} 
                        onClick={() => !disabledActions && showModal('edit', event)}
                        className={`${styles.actionButton} ${isEventExpired ? styles.disabledButton : ''}`}
                        disabled={disabledActions}
                        title={disabledActions ? 'No tienes permiso para editar o el evento está vencido' : 'Editar evento'}
                        style={{
                            opacity: disabledActions ? 0.4 : 1,
                            cursor: disabledActions ? 'not-allowed' : 'pointer'
                        }}
                    />
                    <Button 
                        type="text" 
                        size="small"
                        danger={!isEventExpired}
                        icon={<DeleteOutlined />} 
                        onClick={() => !disabledActions && handleDelete(event)}
                        className={`${styles.actionButton} ${!isEventExpired ? styles.danger : ''} ${isEventExpired ? styles.disabledButton : ''}`}
                        disabled={disabledActions}
                        title={disabledActions ? 'No tienes permiso para eliminar o el evento está vencido' : 'Eliminar evento'}
                        style={{
                            opacity: disabledActions ? 0.4 : 1,
                            cursor: disabledActions ? 'not-allowed' : 'pointer',
                            color: disabledActions ? '#999' : undefined
                        }}
                    />
                </div>

            <div className={styles.eventContent}>
                <Row gutter={16} className={styles.eventRow}>
                    <Col span={4} className={styles.iconContainer}>
                        <div className={styles.eventIcon}>
                            <CalendarOutlined />
                        </div>
                    </Col>
                    <Col span={20} className={styles.contentContainer}>
                        <div className={styles.eventInfo}>
                            <div className={styles.eventMainInfo}>
                                <Title level={5} className={styles.eventTitle}>{event.name}</Title>
                                <Text type="secondary" className={styles.eventDescription}>
                                    {event.description}
                                </Text>
                                <Space className={styles.eventDates}>
                                    <Tag color="green">Fecha: {event.event_date}</Tag>
                                    <Tag color="orange">Registro hasta: {event.registration_deadline}</Tag>
                                </Space>
                                <div className={styles.eventParticipants}>
                                    <Text>
                                        Participantes: {event.current_participants}/{event.max_participants}
                                    </Text>
                                </div>
                            </div>
                            <div className={styles.eventPriceInfo}>
                                <Title level={4} className={styles.eventPrice}>
                                    ${parseFloat(event.final_price || 0).toLocaleString()}
                                </Title>
                                {event.branch_price && event.branch_price !== event.base_price && (
                                    <Text delete className={styles.originalPrice}>
                                        ${parseFloat(event.base_price || 0).toLocaleString()}
                                    </Text>
                                )}
                                {/* Tag de estado del evento */}
                                <div style={{ marginTop: '8px' }}>
                                    {isEventExpired ? (
                                        <Tag color="red" icon={<CloseCircleOutlined />}>
                                            Vencido {event.event_status === 'vencido' ? '(Por fecha)' : ''}
                                        </Tag>
                                    ) : (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>
                                            Disponible
                                        </Tag>
                                    )}
                                    {isEventExpired && (
                                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            <strong>Nota:</strong> No se puede editar o eliminar
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
        );
    };

    // Renderizado del contenido según la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'productos':
                return (
                    <div>
                        {productosFiltrados && productosFiltrados.length > 0 ? (
                            productosFiltrados.map(producto => (
                                <ProductCard key={producto.id} product={producto} />
                            ))
                        ) : productos && productos.length > 0 ? (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<SearchOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No se encontraron productos
                                            </Title>
                                            <Text type="secondary">
                                                No hay productos que coincidan con los filtros aplicados.
                                                <br />
                                                Intenta modificar los términos de búsqueda o filtros.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        onClick={() => {
                                            setSearchText('');
                                            setFilterCategory('todos');
                                        }}
                                        size="large"
                                    >
                                        Limpiar Filtros
                                    </Button>
                                </Empty>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<ShopOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No hay productos disponibles
                                            </Title>
                                            <Text type="secondary">
                                                No se encontraron productos para esta sede. 
                                                <br />
                                                Agrega productos o verifica los filtros aplicados.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showModal('create')}
                                        size="large"
                                        disabled={!can('editar_admin_tienda')}
                                        title={!can('editar_admin_tienda') ? 'No tienes permiso para agregar' : 'Agregar Producto'}
                                    >
                                        Agregar Producto
                                    </Button>
                                </Empty>
                            </div>
                        )}
                    </div>
                );
            case 'suscripciones':
                return (
                    <div>
                        {suscripcionesFiltradas && suscripcionesFiltradas.length > 0 ? (
                            suscripcionesFiltradas.map(suscripcion => (
                                <SubscriptionCard key={suscripcion.id} subscription={suscripcion} />
                            ))
                        ) : suscripciones && suscripciones.length > 0 ? (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<SearchOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No se encontraron planes de suscripción
                                            </Title>
                                            <Text type="secondary">
                                                No hay planes que coincidan con los filtros aplicados.
                                                <br />
                                                Intenta modificar los términos de búsqueda.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        onClick={() => setSearchText('')}
                                        size="large"
                                    >
                                        Limpiar Búsqueda
                                    </Button>
                                </Empty>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<CrownOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No hay planes de suscripción disponibles
                                            </Title>
                                            <Text type="secondary">
                                                No se encontraron planes de suscripción para esta sede. 
                                                <br />
                                                Agrega planes o verifica los filtros aplicados.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showModal('create')}
                                        size="large"
                                        disabled={!can('editar_admin_tienda')}
                                        title={!can('editar_admin_tienda') ? 'No tienes permiso para agregar' : 'Agregar Plan'}
                                    >
                                        Agregar Plan
                                    </Button>
                                </Empty>
                            </div>
                        )}
                    </div>
                );
            case 'eventos':
                return (
                    <div>
                        {eventosFiltrados && eventosFiltrados.length > 0 ? (
                            eventosFiltrados.map(evento => (
                                <EventCard key={evento.id} event={evento} />
                            ))
                        ) : eventos && eventos.length > 0 ? (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<SearchOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No se encontraron eventos
                                            </Title>
                                            <Text type="secondary">
                                                No hay eventos que coincidan con los filtros aplicados.
                                                <br />
                                                Intenta modificar los términos de búsqueda.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        onClick={() => setSearchText('')}
                                        size="large"
                                    >
                                        Limpiar Búsqueda
                                    </Button>
                                </Empty>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <Empty
                                    image={<CalendarOutlined style={{ fontSize: '80px', color: '#d9d9d9' }} />}
                                    description={
                                        <div>
                                            <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                                                No hay eventos disponibles
                                            </Title>
                                            <Text type="secondary">
                                                No se encontraron eventos para esta sede. 
                                                <br />
                                                Agrega eventos o verifica los filtros aplicados.
                                            </Text>
                                        </div>
                                    }
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showModal('create')}
                                        size="large"
                                        disabled={!can('editar_admin_tienda')}
                                        title={!can('editar_admin_tienda') ? 'No tienes permiso para agregar' : 'Agregar Evento'}
                                    >
                                        Agregar Evento
                                    </Button>
                                </Empty>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    // Formulario dinámico según el tipo de elemento


    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                        <ShopOutlined style={{ marginRight: 12 }} />
                        Administrar Tienda
                    </Title>
                    <Text type="secondary">
                        Gestione productos, planes de suscripción y eventos para la sede: {selectedBranch?.name || 'No seleccionada'}
                        {activeTab === 'productos' && (
                            <span style={{ marginLeft: 16, fontWeight: 500 }}>
                                ({productosFiltrados.length} de {productos.length} productos)
                            </span>
                        )}
                        {activeTab === 'suscripciones' && (
                            <span style={{ marginLeft: 16, fontWeight: 500 }}>
                                ({suscripcionesFiltradas.length} de {suscripciones.length} planes)
                            </span>
                        )}
                        {activeTab === 'eventos' && (
                            <span style={{ marginLeft: 16, fontWeight: 500 }}>
                                ({eventosFiltrados.length} de {eventos.length} eventos)
                            </span>
                        )}
                    </Text>
                </div>

                {/* Filtros y búsqueda */}
                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Space size="middle">
                                <Input
                                    placeholder={
                                        activeTab === 'productos' ? 'Buscar productos...' :
                                        activeTab === 'suscripciones' ? 'Buscar planes...' :
                                        'Buscar eventos...'
                                    }
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: 250 }}
                                    allowClear
                                />
                                {activeTab === 'productos' && (
                                    <Select
                                        placeholder="Filtrar por categoría"
                                        value={filterCategory}
                                        onChange={setFilterCategory}
                                        style={{ 
                                            width: 200,
                                            borderColor: filterCategory && filterCategory !== 'todos' ? '#1890ff' : undefined
                                        }}
                                        suffixIcon={<FilterOutlined />}
                                        allowClear
                                        onClear={() => setFilterCategory('todos')}
                                    >
                                        <Option value="todos">Todas las categorías</Option>
                                        {categorias.map(cat => (
                                            <Option key={cat.id} value={cat.name}>
                                                {cat.name} ({cat.product_count})
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </Space>
                        </Col>
                        <Col>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                onClick={() => showModal('create')}
                                size="large"
                                disabled={!can('editar_admin_tienda')}
                                title={!can('editar_admin_tienda') ? 'No tienes permiso para agregar' : `Nuevo ${activeTab === 'productos' ? 'Producto' : activeTab === 'suscripciones' ? 'Plan' : 'Evento'}`}
                            >
                                Nuevo {activeTab === 'productos' ? 'Producto' : activeTab === 'suscripciones' ? 'Plan' : 'Evento'}
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Tabs */}
                <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                    <TabPane
                        tab={
                            <span>
                                <ShopOutlined />
                                Productos
                            </span>
                        }
                        key="productos"
                    />
                    <TabPane
                        tab={
                            <span>
                                <CrownOutlined />
                                Planes de Suscripción
                            </span>
                        }
                        key="suscripciones"
                    />
                    <TabPane
                        tab={
                            <span>
                                <CalendarOutlined />
                                Eventos
                            </span>
                        }
                        key="eventos"
                    />
                </Tabs>

                {/* Contenido */}
                <Content style={{ marginTop: 16 }}>
                    {renderContent()}
                </Content>

                {/* ProductModal */}
                <ProductModal
                    visible={productModalVisible}
                    mode={productModalMode}
                    productData={selectedProduct}
                    categories={categorias}
                    branches={branchOptions}
                    onCancel={handleProductModalCancel}
                    onSubmit={handleProductModalSubmit}
                />

                {/* SubscriptionModal */}
                <SubscriptionModal
                    visible={subscriptionModalVisible}
                    mode={subscriptionModalMode}
                    subscriptionData={selectedSubscription}
                    branches={branchOptions}
                    onCancel={handleSubscriptionModalCancel}
                    onSubmit={handleSubscriptionModalSubmit}
                />

                {/* EventModal */}
                <EventModal
                    visible={eventModalVisible}
                    mode={eventModalMode}
                    eventData={selectedEvent}
                    branches={branchOptions}
                    onCancel={handleEventModalCancel}
                    onSubmit={handleEventModalSubmit}
                />
            </div>
        </AdminLayout>
    );
}
