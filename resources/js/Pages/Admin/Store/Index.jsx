import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Layout,
    Menu,
    Card,
    Button,
    Badge,
    Input,
    Tag,
    Row,
    Col,
    Tabs,
    Typography,
    Space,
    Avatar,
    Divider,
    Rate
} from 'antd';
import {
    ShoppingCartOutlined,
    HeartOutlined,
    HeartFilled,
    ShoppingOutlined,
    SearchOutlined,
    CrownOutlined,
    CalendarOutlined,
    ShopOutlined,
    FilterOutlined,
    StarOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';
import ResponsiveNavMenu from '../../../Components/ResponsiveNavMenu';
import ProductCard from '../../../Components/ProductCard';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx'; // Importar hook de sede
import ShoppingCart from './ShoppingCart.jsx';


const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Meta } = Card;

export default function Index(props) {
    const { selectedBranch } = useBranch(); // Hook para obtener sede seleccionada
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [mediosPago, setMediosPago] = useState([]);
    const { showSuccess, showError } = useNotifications();
    const [activeCategory, setActiveCategory] = useState('productos');
    const [favorites, setFavorites] = useState(new Set());
    // El carrito ahora es solo un número entero (cantidad de items)
    const [cart, setCart] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('Todos');
    const [clienteIdentificacion, setClienteIdentificacion] = useState('');
    const [clienteInfo, setClienteInfo] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const page = usePage();
    const identificacionFijada = props?.identificacion || page?.props?.identificacion || null;


    useEffect(() => {

        if (
            identificacionFijada &&
            selectedBranch?.id &&
            !clienteInfo // Solo si aún no se ha consultado
        ) {
            console.log('-----> ', identificacionFijada, selectedBranch?.id, clienteInfo);

            setClienteIdentificacion(identificacionFijada); // Actualiza el input
            handleClienteIdentificacionFinalizada(identificacionFijada); // Llama tu método existente
        }
    }, [identificacionFijada, selectedBranch?.id]);

    // Consultar medios de pago al montar la vista
    const fetchMediosPago = async () => {
        try {
            const response = await fetch('/admin/tienda/mediosPago', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMediosPago(data.medios_pago || []);
            } else {
                setMediosPago([]);
            }
        } catch (e) {
            setMediosPago([]);
        }
    };
    // Cargar catálogo al montar la vista o cuando cambie la sede
    const fetchCatalog = async () => {
        setLoadingCatalog(true);
        try {
            const branchId = selectedBranch?.id;
            const response = await fetch(`/admin/tienda/getCatalog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ branch_id: branchId })
            });
            if (response.ok) {
                const data = await response.json();
                setProductos(data.productos || []);
                setSuscripciones(data.suscripciones || []);
                setEventos(data.eventos || []);
            } else {
                setProductos([]);
                setSuscripciones([]);
                setEventos([]);
            }
        } catch (e) {
            setProductos([]);
            setSuscripciones([]);
            setEventos([]);
        }
        setLoadingCatalog(false);
    };
    useEffect(() => {
        fetchCatalog();
    }, [selectedBranch?.id]);

    // Consultar medios de pago solo una vez al montar
    useEffect(() => {
        fetchMediosPago();
    }, []);


    // Volver a consultar catálogo al cerrar el carrito
    useEffect(() => {
        if (!isCartOpen) {
            fetchCatalog();
            // Actualizar el contador del carrito
            const fetchCartCount = async () => {
                if (!clienteInfo?.id || !selectedBranch?.id) return;
                try {
                    const response = await fetch('/admin/tienda/getCartCount', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({
                            person_id: clienteInfo.id,
                            branch_id: selectedBranch.id
                        })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setCart(data.cart_count || 0);
                    }
                } catch (e) {
                    // No actualizar si hay error
                }
            };
            fetchCartCount();
        }
    }, [isCartOpen]);


    // Resetear cliente y carrito al cambiar de sede
    useEffect(() => {
        setClienteInfo(null);
        setClienteIdentificacion('');
        setCart(0);
    }, [selectedBranch?.id]);
    // Callback para cuando la identificación está finalizada
    const handleClienteIdentificacionFinalizada = async (identificacionParam) => {
        let identificacion = identificacionParam;

        // Si la función fue llamada por un evento, ignorar el evento y usar el valor del input
        if (identificacionParam && identificacionParam.target) {
            identificacion = clienteIdentificacion;
        }

        console.log('Identificación :', identificacion);

        if (!identificacion) return;
        try {
            if (!selectedBranch?.id) {
                showError('Por favor, seleccione una sede antes de buscar un cliente.');
                return;
            }
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/admin/tienda/searchPerson', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identificacion: identificacion,
                    branch_id: selectedBranch.id
                })
            });
            if (response.ok) {
                const data = await response.json();
                setClienteInfo(data);
                setCart(data.cart_count || 0); // Actualizar el carrito con la cantidad del cliente
                setClienteIdentificacion(''); // Limpiar input si encuentra cliente
            } else {
                const error = await response.json();
                showError(error.message);
                setClienteInfo(null);
                setClienteIdentificacion(''); // Limpiar input si no encuentra cliente
            }
        } catch (err) {
            console.error('Error al buscar cliente:', err);
        }
    };

    const addToCart = async (item) => {
        // Validar que clienteInfo esté correctamente llena
        try {
            if (!clienteInfo || !clienteInfo.id || !clienteInfo.identification) {
                showError('Debe seleccionar un cliente válido antes de agregar al carrito.');
                throw new Error('Debe seleccionar un cliente válido antes de agregar al carrito.');
            }
            if (!selectedBranch?.id) {
                throw new Error('No se ha seleccionado una sede. Por favor, seleccione una sede para continuar.');
            }
            const body = {
                branch_id: selectedBranch.id,
                person_id: clienteInfo.id,
                type: item.type,
                id: item.id
            };

            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/admin/tienda/addToCart', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data = await response.json();
                showSuccess(data.message);
                setCart(data.cart_count || 0); // Actualizar el carrito con la cantidad del cliente
            } else {
                const error = await response.json();
                showError(error.message);
            }
        } catch (err) {
            console.error('Error al agregar al carrito:', err);
        }
    };


    // Generar categorías únicas dinámicamente a partir de los productos
    const categoriasUnicas = Array.from(
        new Set(productos.map(p => p.categoryName).filter(Boolean))
    );
    const categorias = [
        { key: 'Todos', label: 'Todos' },
        ...categoriasUnicas.map(cat => ({ key: cat, label: cat }))
    ];

    const renderProducts = () => {
        // Filtrar productos según la categoría seleccionada
        let productosFiltrados = selectedFilter === 'Todos'
            ? productos
            : productos.filter(p => p.categoryName === selectedFilter);

        // Normalizar texto para búsqueda tolerante a mayúsculas y acentos
        const normalizar = (texto) =>
            (texto || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

        if (busqueda.trim() !== '') {
            const busqNorm = normalizar(busqueda);
            productosFiltrados = productosFiltrados.filter(p =>
                normalizar(p.name).includes(busqNorm)
            );
        }

        if (loadingCatalog) {
            return <div style={{ padding: 32, textAlign: 'center' }}>Cargando catálogo...</div>;
        }

        return (
            <div>
                <div>
                    <Space size="middle" >
                        <Input
                            placeholder="Buscar producto..."
                            style={{ width: 180 }}
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            allowClear
                        />
                        <ResponsiveNavMenu
                            items={categorias}
                            activeKey={selectedFilter}
                            onItemClick={setSelectedFilter}
                        />
                    </Space>
                </div>
                <div className={styles.productsFlexGrid}>
                    {productosFiltrados.map(producto => (
                        <div className={styles.productFlexItem} key={producto.id}>
                            <ProductCard
                                id={producto.id}
                                product={{
                                    id: producto.id,
                                    name: producto.name || '',
                                    price: producto.price || '',
                                    description: producto.description || '',
                                    image: (producto.images && producto.images[0]) || '',
                                    gallery: producto.images || [],
                                    sizes: ['Única'],
                                    colors: [],
                                    stock_quantity: producto.stock_quantity ?? null,
                                }}
                                onAddToCart={addToCart}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMemberships = () => (
        <div className={styles.membershipsGrid}>
            {suscripciones.map(membresia => (
                <div className={styles.membershipCardWrapper} key={membresia.id}>
                    {/* Identificador visual para la más popular */}
                    {membresia.es_popular && (
                        <div className={styles.popularBadge}>
                            Más Popular
                        </div>
                    )}
                    <div className={styles.membershipBadge}>
                        <Card hoverable className={styles.membershipCard}>
                            <div className={styles.membershipHeader}>
                                <Avatar size={64} icon={<CrownOutlined />} className={styles.membershipAvatar} />
                                <Title level={2} className={styles.membershipTitle}>
                                    {membresia.name}
                                </Title>
                                <Paragraph className={styles.membershipDescription}>
                                    {membresia.description}
                                </Paragraph>
                            </div>
                            <div className={styles.membershipPriceRow}>
                                <Title level={1} className={styles.membershipPrice}>
                                    {membresia.price}<span> / {membresia.duration_months} Mes</span>
                                </Title>
                            </div>
                            {/* Lista de accesos a sedes */}
                            {membresia.branches_access && (
                                <div className={styles.membershipBranchesAccess}>
                                    <Text strong>Accesos a:</Text>
                                    <ul className={styles.membershipBranchesList}>
                                        {membresia.branches_access.split(',').map((sede, idx) => (
                                            <li key={idx} className={styles.membershipBranchItem}>{sede.trim()}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => addToCart({
                            id: membresia.id,
                            type: 'Suscripción'
                        })}
                        className={styles.membershipButton}
                    >
                        Agregar al carrito
                    </Button>
                </div>
            ))}
        </div>
    );
    const renderEvents = () => (
        <div className={styles.eventsGrid}>
            {eventos.map(evento => {
                const cuposDisponibles = evento.max_participants - evento.current_participants;
                const disabled = cuposDisponibles <= 0;
                return (
                    <div className={styles.eventCardWrapper} key={evento.id}>
                        <Card hoverable className={styles.eventCard} bodyStyle={{ display: 'flex', flexDirection: 'column', height: '420px', justifyContent: 'space-between', padding: 0 }}>
                            <div className={styles.dataContainer} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 16 }}>
                                <div className={styles.eventHeader}>
                                    <Tag className={styles.eventCategoryTag}>Evento</Tag>
                                    <Text className={styles.eventAvailability}>
                                        {cuposDisponibles} cupos disponibles
                                    </Text>
                                </div>
                                <Title level={3} className={styles.eventTitle}>
                                    {evento.name}
                                </Title>
                                <Paragraph className={styles.eventDescription}>
                                    {evento.description}
                                </Paragraph>
                                {evento.event_date && (
                                    <div className={styles.eventDateContainer}>
                                        <ClockCircleOutlined className={styles.eventDateIcon} />
                                        <Text strong className={styles.eventDateLabel}>Fecha: </Text>
                                        <Text className={styles.eventDateValue}>{evento.event_date}</Text>
                                    </div>
                                )}
                                <div className={styles.eventFooter}>
                                    <Title level={2} className={styles.eventPrice}>
                                        {evento.price}
                                    </Title>
                                </div>
                            </div>
                            <div className={styles.eventButtonContainer}>
                                <Button
                                    type="primary"
                                    size="large"
                                    className={styles.eventButton}
                                    disabled={disabled}
                                    style={disabled ? { cursor: 'not-allowed' } : {}}
                                    onClick={() => addToCart({
                                        id: evento.id,
                                        type: 'Evento',
                                    })}
                                >
                                    Reservar Lugar
                                </Button>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );

    return (
        <AdminLayout>
            <div className={styles.StorePage}>

                <div className={styles.headerSection}>
                    <div className={styles.tituloContainer}>
                        <Title level={2} style={{ margin: 0 }}>
                            <ShoppingOutlined /> Tienda
                        </Title>
                        <Text type="secondary">
                            Administra los empleados del sistema
                        </Text>
                    </div>
                    <div className={styles.clienteInputWrapper}>

                        {!identificacionFijada && (
                            <div className={styles.clienteInputContainer}>
                                <Input
                                    placeholder="Identificación del cliente"
                                    className={styles.clienteInput}
                                    value={clienteIdentificacion}
                                    onChange={e => {
                                        const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                                        setClienteIdentificacion(soloNumeros);
                                    }}
                                    onBlur={handleClienteIdentificacionFinalizada}
                                    onPressEnter={handleClienteIdentificacionFinalizada}
                                />
                            </div>
                        )}

                        {/* Contenedor para mostrar nombre e identificación del cliente solo si hay datos */}
                        {clienteInfo && clienteInfo.id && clienteInfo.identification && (
                            <div className={styles.clienteInfoContainer}>
                                <div className={styles.clienteInfoMainRow} >
                                    <div>
                                        <Text strong>Nombre:</Text> <span>{clienteInfo.name}</span>
                                    </div>
                                    <div>
                                        <Text strong>Identificación:</Text> <span>{clienteInfo.identification}</span>
                                    </div>
                                </div>
                                <div className={styles.cartIconContainer} style={{ marginLeft: 8 }}>
                                    <Badge count={cart} size="small" offset={[0, 4]}>
                                        <ShoppingCartOutlined
                                            className={styles.cartIcon}
                                            onClick={() => setIsCartOpen(true)}
                                        />
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Tabs
                    activeKey={activeCategory}
                    onChange={setActiveCategory}
                    className={styles.tabs}
                    size="large"
                >
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
                                Membresías
                            </span>
                        }
                        key="membresias"
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

                <Content className={styles.content}>
                    {activeCategory === 'productos' && renderProducts()}
                    {activeCategory === 'membresias' && renderMemberships()}
                    {activeCategory === 'eventos' && renderEvents()}
                </Content>
            </div>
            <ShoppingCart
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                clienteInfo={clienteInfo}
                onUpdateCart={setCart}
                branch_id={selectedBranch?.id}
                mediosPago={mediosPago}
            />
        </AdminLayout>

    );
};