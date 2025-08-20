
import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Card,
  Image,
  InputNumber,
  Divider,
  Empty,
  Space,
  Badge,
  Tag,
  Modal,
  Checkbox,
  Select,
  Form,
  Input,
  DatePicker
} from 'antd';
import dayjs from 'dayjs';
import {
  CloseOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  StockOutlined
} from '@ant-design/icons';
import styles from './ShoppingCart.module.scss';
import { useNotifications } from '../../../hooks/useNotifications.jsx';

const { Title, Text, Paragraph } = Typography;

export default function ShoppingCart({
  isOpen,
  onClose,
  clienteInfo,
  onUpdateCart,
  branch_id,
  mediosPago
}) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [fechaFinSuscripcion, setFechaFinSuscripcion] = useState(null);
  const [minSubscriptionDate, setMinSubscriptionDate] = useState(null);


  // Estados para el modal de pago personalizado
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [payFullAmount, setPayFullAmount] = useState(true);
  const [partialAmount, setPartialAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [form] = Form.useForm();
  const [fieldErrors, setFieldErrors] = useState({});
  const [observaciones, setObservaciones] = useState('');
    // Estado local para cantidades temporales
  const [tempQuantities, setTempQuantities] = useState({});

  // Efecto para cargar items del carrito cuando se abre el modal
  useEffect(() => {
    if (isOpen && clienteInfo?.id) {
      loadCartItems();
    }
  }, [isOpen, clienteInfo?.id]);

    // Resetear todos los estados cuando se cierra el carrito
  useEffect(() => {
    if (!isOpen) {
      setCartItems([]);
      setTempQuantities({});
      setLoading(false);
      setFechaFinSuscripcion(null);
      setMinSubscriptionDate(null);
      setIsPaymentModalVisible(false);
      setPayFullAmount(true);
      setPartialAmount(0);
      setPaymentMethod('');
      setFieldErrors({});
      setObservaciones('');
      // Si tienes más estados, agrégalos aquí
    }
  }, [isOpen]);

  // Dummy/fallback para evitar error si no está definida
  const handleProceedToPayment = async (amount, isFullPayment, paymentMethod, observaciones) => {
    // Aquí va la lógica real de pago
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch('/admin/tienda/processPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify({
          amount,
          isFullPayment,
          paymentMethod,
          person_id: clienteInfo.id,
          branch_id: branch_id,
          observaciones
        })
      });

      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message);
      } else {
        showError(data.error || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      showError('Error al procesar el pago');
    }
  };
  // Estado para fechas de suscripciones/membresías
  const [subscriptionDates, setSubscriptionDates] = useState({});

  const loadCartItems = async () => {
    setLoading(true);
    try {
      // Consulta real al backend para obtener los items del carrito
      const response = await fetch(`/admin/tienda/getCartItems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          person_id: clienteInfo.id,      // ID de la persona
          branch_id: branch_id       // ID de la sede
        })
      });
      const data = await response.json();
      console.log(data);

      // Guardar fecha de fin de suscripción si viene del backend
      if (data.fecha_fin_suscripcion && data.fecha_fin_suscripcion.end_date) {
        setFechaFinSuscripcion(data.fecha_fin_suscripcion.end_date);
      } else {
        setFechaFinSuscripcion(null);
      }

      // Unir productos, suscripciones y eventos en un solo array
      const allItems = [
        ...(data.productos || []),
        ...(data.suscripciones || []),
        ...(data.eventos || [])
      ];

      setCartItems(allItems);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setLoading(false);
    }
  };

  // Calcula la fecha mínima desbloqueada para suscripción
  const calcularFechaMinimaSuscripcion = (fechaFinSuscripcion) => {
    const hoy = dayjs().startOf('day');
    if (!fechaFinSuscripcion) return hoy;
    const fechaFin = dayjs(fechaFinSuscripcion, 'YYYY-MM-DD');
    if (!fechaFin.isValid()) return hoy;
    // Si la fecha que llega es mayor o igual a hoy, usar esa fecha +1 día
    if (fechaFin.isAfter(hoy) || fechaFin.isSame(hoy)) {
      return fechaFin.add(1, 'day').startOf('day');
    }
    // Si la fecha que llega es menor que hoy, usar hoy
    return hoy;
  };

  // Cuando cambia la fecha de fin de suscripción o el carrito, setear la fecha inicial solo si no hay una seleccionada
  useEffect(() => {
    if (!isOpen) return;
    const minDate = calcularFechaMinimaSuscripcion(fechaFinSuscripcion);
    setMinSubscriptionDate(minDate);
    setSubscriptionDates(prev => {
      const nuevos = { ...prev };
      cartItems.forEach(item => {
        if (item.type === 'Suscripción') {
          if (!nuevos[item.id]) {
            nuevos[item.id] = item.start_date ? dayjs(item.start_date) : minDate;
          }
        }
      });
      return nuevos;
    });
  }, [isOpen, fechaFinSuscripcion, cartItems]);

  const updateQuantity = async (itemId, itemType, newQuantity, date = null) => {
    if (newQuantity < 1) return;
    // El cuarto parámetro opcional es la fecha para suscripción

    console.log("actualizaa", itemId, newQuantity, date, itemType);

    try {
      // Construir el cuerpo según el tipo
      const body = {
        id: itemId,
        quantity: newQuantity,
        branch_id: branch_id,
        type: itemType
      };
      if (itemType === 'Suscripción' && date) {
        body.fecha_inicio = dayjs(date).format('YYYY-MM-DD');
      }
      const response = await fetch('/admin/tienda/updateCartItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(body)
      });

      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity, fecha_inicio: body.fecha_inicio || item.fecha_inicio }
            : item
        )
      );
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  const removeItem = async (itemId, itemType) => {
    try {
      // TODO: Eliminar item del backend
      const response = await fetch(`/admin/tienda/removeCartItem`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          id: itemId,
          type: itemType
        })
      });

      setCartItems(prev => prev.filter(item => item.id !== itemId));

      // Actualizar contador del carrito en el componente padre
      const newCount = cartItems.length - 1;
      if (onUpdateCart) {
        onUpdateCart(newCount);
      }
      showSuccess('Item eliminado del carrito');
    } catch (error) {
      console.error('Error al eliminar item:', error);
      showError('Error al eliminar el item del carrito');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Confirmación antes de proceder al pago
  const handleConfirmProceedToPayment = () => {
    resetPaymentModalFields();
    setIsPaymentModalVisible(true);
  };

  const resetPaymentModalFields = () => {
    setPayFullAmount(true);
    setPartialAmount(0);
    setPaymentMethod('');
    setObservaciones('');
    setFieldErrors({});
  };

  const handlePaymentConfirm = async () => {
    const total = calculateTotal();
    let valid = true;
    let errors = {};

    // Validar que haya items en el carrito
    if (!cartItems || cartItems.length === 0) {
      showError('El carrito está vacío. Agrega al menos un producto para pagar.');
      return;
    }

    // Validar medio de pago seleccionado
    if (!paymentMethod) {
      errors.paymentMethod = 'Selecciona un medio de pago.';
      valid = false;
    }

    // Validar monto parcial si aplica
    if (!payFullAmount) {
      if (!partialAmount || partialAmount <= 0) {
        errors.partialAmount = 'El monto debe ser mayor a 0.';
        valid = false;
      } else if (partialAmount > total) {
        errors.partialAmount = 'El monto no puede exceder el total.';
        valid = false;
      }
    }

    setFieldErrors(errors);
    if (!valid) return;

    // Cerrar modal y proceder con el pago
    setIsPaymentModalVisible(false);
    onClose && onClose(); // Cierra el carrito
    handleProceedToPayment(payFullAmount ? total : partialAmount, payFullAmount, paymentMethod, observaciones);
    resetPaymentModalFields();
  };

  const handlePaymentCancel = () => {
    setIsPaymentModalVisible(false);
    resetPaymentModalFields();
  };

  const handlePartialAmountChange = (value) => {
    const total = calculateTotal();
    if (value > total) {
      setPartialAmount(total);
    } else if (value < 0) {
      setPartialAmount(0);
    } else {
      setPartialAmount(value || 0);
    }
  };

  const renderCartItem = (item) => {
    const getItemDetails = () => {
      switch (item.type) {
        case 'Suscripción':
          return (
            <div className={styles.itemDetails}>
              <Text type="secondary">Período: {item.period}</Text>
            </div>
          );
        case 'Evento':
          return (
            <div className={styles.itemDetails}>
              <Text type="secondary">Fecha: {item.fecha}</Text>
            </div>
          );
        default:
          return null;
      }
    };

    // Valor temporal para el input
    const tempValue =
      typeof tempQuantities[item.id] !== 'undefined'
        ? tempQuantities[item.id]
        : item.quantity;

    // Handler para cambio en el input
    const handleInputChange = (value) => {
      // Permitir solo números válidos y no mayores al stock
      let newValue = value;
      if (typeof item.stock === 'number' && value > item.stock) {
        newValue = item.stock;
      }
      if (newValue < 1) newValue = 1;
      setTempQuantities((prev) => ({ ...prev, [item.id]: newValue }));
    };

    // Handler para blur o enter
    const handleInputCommit = () => {
      console.log('Input commit:', tempValue);
      let value = tempValue;
      if (typeof item.stock === 'number' && value > item.stock) {
        console.log("maximo");
        value = item.stock;
        showError('No hay stock suficiente para este producto.');
      }
      if (value < 1) value = 1;
      setTempQuantities((prev) => ({ ...prev, [item.id]: value }));
      if (value !== item.quantity) {
        // Si es suscripción, enviar también la fecha seleccionada
        if (item.type === 'Suscripción') {
          // Usar item.start_date si existe, si no null
          const fecha = item.start_date ? dayjs(item.start_date) : null;
          updateQuantity(item.id, item.type, value, fecha);
        } else {
          updateQuantity(item.id, item.type, value);
        }
      }
    };

    // Handler para cambio de fecha de suscripción/membresía
    const handleSubscriptionDateChange = (date) => {
      setSubscriptionDates(prev => ({ ...prev, [item.id]: date }));
      if (item.type === 'Suscripción') {
        updateQuantity(item.id, item.type, item.quantity, date);
      }
    };

    return (
      <Card
        key={item.id}
        className={styles.cartItem}
        size="small"
      >
        <div className={styles.itemContent}>
          <div className={styles.itemImage}>
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                width={60}
                height={60}
                preview={false}
              />
            ) : item.type === 'Suscripción' || item.type === 'Evento' ? (
              <div className={styles.subscriptionIconPlaceholder}>
                <StockOutlined style={{ fontSize: 38, color: '#b197fc' }} />
              </div>
            ) : null}
          </div>

          <div className={styles.itemInfo}>
            <div className={styles.itemHeader}>
              <Title level={5} className={styles.itemName}>
                {item.name}
              </Title>
              <Tag className={styles.cartCategoryTag} size="small">
                {item.category}
              </Tag>
            </div>

            {getItemDetails()}

            <div className={styles.itemPrice}>
              <Text strong>
                {formatPrice(item.price)}
              </Text>
            </div>
          </div>
        </div>

        <div className={styles.itemActions}>
          <div className={styles.quantityControls}>
            {item.type !== 'Evento' && (
              <>
                <Button
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => {
                    const newValue = item.quantity - 1;
                    setTempQuantities((prev) => ({ ...prev, [item.id]: newValue }));
                    if (newValue >= 1) updateQuantity(item.id, item.type, newValue);
                  }}
                  disabled={item.quantity <= 1}
                />
                <InputNumber
                  size="small"
                  min={1}
                  value={tempValue}
                  onChange={handleInputChange}
                  onBlur={handleInputCommit}
                  onPressEnter={handleInputCommit}
                  className={styles.quantityInput}
                  max={typeof item.stock === 'number' ? item.stock : undefined}
                />
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (typeof item.stock === 'number' && item.quantity >= item.stock) {
                      showError('No hay stock suficiente para este producto.');
                      return;
                    }
                    const newValue = item.quantity + 1;
                    setTempQuantities((prev) => ({ ...prev, [item.id]: newValue }));
                    updateQuantity(item.id, item.type, newValue);
                  }}
                  disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                />
                {/* Si es suscripción, mostrar DatePicker aquí */}
                {(item.type === 'Suscripción') && (
                  <DatePicker
                    size="small"
                    style={{ marginLeft: 8, marginRight: 8 }}
                    value={subscriptionDates[item.id] || null}
                    onChange={handleSubscriptionDateChange}
                    format="DD/MM/YYYY"
                    placeholder="Fecha inicio"
                    disabledDate={current => current && minSubscriptionDate && current < minSubscriptionDate}
                    allowClear={false}
                  />
                )}
              </>
            )}
          </div>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeItem(item.id, item.type)}
          />
        </div>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.cartOverlay} onClick={handleBackdropClick}>
      <div className={styles.cartSidebar}>
        <div className={styles.cartHeader}>
          <div className={styles.headerTitle}>
            <ShoppingCartOutlined className={styles.cartHeaderIcon} />
            <Title level={3} style={{ margin: 0 }}>
              Carrito de Compras
            </Title>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className={styles.closeButton}
          />
        </div>

        {clienteInfo && (
          <div className={styles.clientInfo}>
            <Text strong>Cliente: </Text>
            <Text>{clienteInfo.name}</Text>

          </div>
        )}

        <Divider />

        <div className={styles.cartContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Text>Cargando carrito...</Text>
            </div>
          ) : cartItems.length === 0 ? (
            <Empty
              description="Tu carrito está vacío"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className={styles.cartItems}>
              {cartItems.map(renderCartItem)}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <>
            <Divider />
            <div className={styles.cartFooter}>
              <div className={styles.totalSection}>
                <div className={styles.totalRow}>
                  <Text>Subtotal:</Text>
                  <Text strong>{formatPrice(calculateTotal())}</Text>
                </div>
                <div className={styles.totalRow}>
                  <Title level={4} style={{ margin: 0 }}>
                    Total: {formatPrice(calculateTotal())}
                  </Title>
                </div>
              </div>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleConfirmProceedToPayment}
                >
                  Proceder al Pago
                </Button>
                <Button
                  size="large"
                  block
                  onClick={onClose}
                >
                  Continuar Comprando
                </Button>
              </Space>
            </div>
          </>
        )}

        {/* Modal de confirmación de pago personalizado */}
        <Modal
          title="Confirmar Pago"
          open={isPaymentModalVisible}
          onOk={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
          okText="Proceder al Pago"
          cancelText="Cancelar"
          centered
          width={400}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePaymentConfirm}
            initialValues={{
              paymentMethod,
              partialAmount,
              payFullAmount
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Total a pagar: {formatPrice(calculateTotal())}</Text>
            </div>
            <Form.Item>
              <Checkbox
                checked={payFullAmount}
                onChange={(e) => {
                  setPayFullAmount(e.target.checked);
                  if (e.target.checked) {
                    setPartialAmount(0);
                  }
                  setFieldErrors({ ...fieldErrors, partialAmount: undefined });
                }}
                style={{ marginBottom: '16px' }}
              >
                Pagar el monto completo
              </Checkbox>
            </Form.Item>
            {!payFullAmount && (
              <Form.Item
                label="Monto a pagar"
                validateStatus={fieldErrors.partialAmount ? 'error' : ''}
                help={fieldErrors.partialAmount}
                style={{ marginLeft: '8px' }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  value={partialAmount}
                  onChange={v => {
                    handlePartialAmountChange(v);
                    setFieldErrors({ ...fieldErrors, partialAmount: undefined });
                  }}
                  min={0}
                  max={calculateTotal()}
                  formatter={value => {
                    if (!value) return '';
                    return `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  }}
                  parser={value => {
                    if (!value) return 0;
                    return value.replace(/\$\s?|(,*)/g, '');
                  }}
                  placeholder="Ingrese el monto"
                />
                <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                  Máximo: {formatPrice(calculateTotal())}
                </Text>
              </Form.Item>
            )}
            <Form.Item
              label="Medio de pago"
              validateStatus={fieldErrors.paymentMethod ? 'error' : ''}
              help={fieldErrors.paymentMethod}
              style={{ marginTop: 16 }}
            >
              <Select
                value={paymentMethod || undefined}
                style={{ width: '100%' }}
                onChange={v => {
                  setPaymentMethod(v);
                  setFieldErrors({ ...fieldErrors, paymentMethod: undefined });
                }}
                options={mediosPago.map(m => ({ value: m.id, label: m.name }))}
                placeholder="Selecciona un medio de pago"
              />
            </Form.Item>
            <Form.Item label="Observaciones" style={{ marginTop: 8 }}>
              <Input.TextArea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Escribe aquí observaciones del pago (opcional)"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}