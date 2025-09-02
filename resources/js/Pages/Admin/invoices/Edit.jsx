import React, { useEffect, useState } from 'react';
import AgregarPagoModal from './AgregarPagoModal.jsx';

import { Button, Space, Typography, Table, Tag, Empty, Input, Select, Tooltip, Popconfirm, message, Pagination, DatePicker, Popover,Card,Row,Col,Form,InputNumber,Divider} from 'antd';
import {DollarOutlined,SearchOutlined,EditOutlined,EyeOutlined,DeleteOutlined,PlusOutlined,SaveOutlined,UserOutlined,CalendarOutlined,BankOutlined,FileTextOutlined,ShoppingOutlined,GiftOutlined,AppstoreOutlined} from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx';
import AdminLayout from '../../../Layouts/AdminLayout.jsx';
import styles from './Edit.module.scss';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { set } from 'lodash';

const { Title, Text } = Typography;
const { TextArea } = Input;
dayjs.extend(utc);
export default function Index({ invoice: initialInvoice, idFactura }) {
    const [baseData, setBaseData] = useState(initialInvoice || []);
    const [isLoading, setIsLoading] = useState(true);
    const [editingInvoice, setEditingInvoice] = useState(false);
    const [form] = Form.useForm();
    const { showError, showSuccess } = useNotifications();
    const [agregarModalOpen, setAgregarModalOpen] = useState(false);
    const [editRecordModalOpen, seteditRecordModalOpen] = useState(null);
    const [addRecord, setaddRecord] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);


    useEffect(() => {
        if (idFactura) {
            refreshData();
        }
    }, [idFactura]);

    useEffect(() => {
        if (baseData?.invoice) {
            form.setFieldsValue({
                total_amount: baseData.invoice.total_amount,
                observations: baseData.invoice.observations,
                invoice_date: baseData.invoice.invoice_date ? dayjs.utc(baseData.invoice.invoice_date).local() : null
            });
            setIsLoading(false);
        }
    }, [baseData, form]);

    const refreshData = async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const url = `/admin/invoices/edit/${idFactura}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }

            const data = await response.json();
            setBaseData(data);
        } catch (error) {
            console.error('Error al recargar datos:', error);
            showError('Error al recargar los datos. Inténtalo de nuevo.');
        }
    };

    const handleSaveInvoice = async (values) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const endpoint = `/admin/invoices/updateInvoice/${idFactura}`;
            const method = 'PUT';
            // se obtine la zona horraia local y se pasa a utc
            const dateUtc = values.invoice_date ? values.invoice_date.utc().format('YYYY-MM-DD HH:mm:ss') : null;
            const payload = {
                observations: values.observations,
                invoice_date: dateUtc
            };
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al editar la factura`);
            }
            showSuccess(`Factura editada correctamente`);
            refreshData();
            setEditingInvoice(false);

        } catch (error) {
            showError(error.message || `Error al editar la factura`);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const endpoint = `/admin/invoices/deletePayment/${paymentId || initialData?.id}`;
            const method = 'DELETE';
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al eliminar el pago`);
            }
            showSuccess(`Pago eliminado correctamente`);
            refreshData();

        } catch (error) {
            showError(error.message || `Error al eliminar el pago`);
        }
    };

    const handleEditPayment = (payment) => {
        setEditingPayment({
            id: payment.id,
            amount: payment.amount,
            payment_method_id: payment.payment_method_id,
            observations: payment.observations,
            payment_date: payment.payment_date
        });
        seteditRecordModalOpen(true);
    };

    

    const handleAddPayment = () => {
        setAgregarModalOpen(true);
        
    };

    const handleCloseAgregarModal = (shouldRefresh = false) => {
        setAgregarModalOpen(false);
        refreshData();
    };

    const handleCloseEditRecordModal = (shouldRefresh = false) => {
        try {
            seteditRecordModalOpen(false);
            setEditingPayment(null); // Limpiar los datos del pago en edición
            if (shouldRefresh) {
                refreshData();
            }
            
        } catch (error) {
            console.error('Error al cerrar el modal de edición:', error);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'Pagada': 'success',
            'Pendiente': 'warning',
            'Vencida': 'error',
            'Parcial': 'processing'
        };
        return statusColors[status] || 'default';
    };

    const getItemTypeColor = (itemType) => {
        const colors = {
            'Producto': 'blue',
            'Evento': 'green',
            'Suscripción': 'purple',
            'Servicio': 'orange'
        };
        return colors[itemType] || 'default';
    };

    const getItemTypeIcon = (itemType) => {
        const icons = {
            'Producto': <ShoppingOutlined />,
            'Evento': <GiftOutlined />,
            'Suscripción': <AppstoreOutlined />,
            'Servicio': <FileTextOutlined />
        };
        return icons[itemType] || <AppstoreOutlined />;
    };

    if (isLoading) {
        return <AdminLayout title="Editar Factura">Cargando...</AdminLayout>;
    }

    const { invoice } = baseData;

    return (
        <AdminLayout title="Editar Factura">
            <div className={styles.verFacturaPage}>
                {/* Header de la página */}
                <div className={styles.headerSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <Text type="secondary">
                                Editar factura con id <strong>{idFactura}</strong>
                                <span> • {Array.isArray(baseData.payments) ? baseData.payments.length : 0} Pago(s)</span>
                                <span> • {Array.isArray(baseData.items) ? baseData.items.length : 0} Item(s)</span>
                            </Text>
                        </div>
                        <div>
                            <Tag color={getStatusColor(invoice?.status)} icon={<DollarOutlined />}>
                                {invoice?.status}
                            </Tag>
                        </div>
                    </div>
                </div>

                <div className={styles.contentSection}>
                    <div className={styles.facturaSection}>
                        <Card 
                            title={
                                <div className={styles.cardTitle}>
                                    <FileTextOutlined />
                                    <span>Información de la Factura</span>
                                    <Button 
                                        type="link" 
                                        icon={editingInvoice ? <SaveOutlined /> : <EditOutlined />}
                                        onClick={() => editingInvoice ? form.submit() : setEditingInvoice(true)}
                                    >
                                        {editingInvoice ? 'Guardar' : 'Editar'}
                                    </Button>
                                </div>
                            }
                            className={styles.invoiceCard}
                        >
                            <Form
                                form={form}
                                onFinish={handleSaveInvoice}
                                layout="vertical"
                            >
                                <Row gutter={[16, 12]}>
                                    {/* Información del Cliente */}
                                    <Col xs={24} lg={12}>
                                        <div className={styles.infoSection}>
                                            <Title level={5} className={styles.sectionTitle}>
                                                <UserOutlined /> Cliente
                                            </Title>
                                            <div className={styles.infoItem}>
                                                <Text strong>Nombre:</Text>
                                                <Text>{invoice?.person_name}</Text>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <Text strong>Email:</Text>
                                                <Text>{invoice?.person_email}</Text>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <Text strong>Teléfono:</Text>
                                                <Text>{invoice?.person_phone}</Text>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Información de la Factura */}
                                    <Col xs={24} lg={12}>
                                        <div className={styles.infoSection}>
                                            <Title level={5} className={styles.sectionTitle}>
                                                <CalendarOutlined /> Detalles
                                            </Title>
                                            <div className={styles.infoItem}>
                                                <Text strong>Fecha:</Text>
                                                {editingInvoice ? (
                                                    <Form.Item name="invoice_date" style={{ margin: 0 }}>
                                                        <DatePicker
                                                        showTime={{
                                                            format: 'HH:mm'
                                                        }}
                                                        format="DD/MM/YYYY HH:mm"
                                                        placeholder="Seleccione fecha y hora"
                                                        style={{ width: '100%' }} />
                                                    </Form.Item>
                                                ) : (
                                                    <Text>{dayjs.utc(invoice?.invoice_date).local().format('DD/MM/YYYY HH:mm:ss')}</Text>
                                                )}
                                            </div>
                                            <div className={styles.infoItem}>
                                                <Text strong>Tipo:</Text>
                                                <Text>{invoice?.invoice_type}</Text>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <Text strong>Creado por:</Text>
                                                <Text>{invoice?.created_by_name}</Text>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Items de la Factura */}
                                    <Col xs={24}>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <div className={styles.itemsSection}>
                                            <Title level={5} className={styles.sectionTitle}>
                                                <ShoppingOutlined /> Items de la Factura
                                            </Title>
                                            <div className={styles.itemsContainer}>
                                                {baseData.items && baseData.items.length > 0 ? (
                                                    baseData.items.map((item, index) => (
                                                        <div key={item.id || index} className={styles.itemCard}>
                                                            <div className={styles.itemContent}>
                                                                <div className={styles.itemIcon}>
                                                                    {getItemTypeIcon(item.item_type)}
                                                                </div>
                                                                <div className={styles.itemInfo}>
                                                                    <div className={styles.itemMain}>
                                                                        <Text strong className={styles.itemName}>
                                                                            {item.product_name || item.event_name || item.subscription_name || 'Item sin nombre'}
                                                                        </Text>
                                                                        <Tag color={getItemTypeColor(item.item_type)} className={styles.itemType}>
                                                                            {item.item_type}
                                                                        </Tag>
                                                                    </div>
                                                                    <div className={styles.itemDetails}>
                                                                        <Text type="secondary">
                                                                            Cantidad: {item.quantity} × ${parseFloat(item.unit_price || 0).toLocaleString()}
                                                                        </Text>
                                                                        <Text strong className={styles.itemTotal}>
                                                                            = ${parseFloat(item.total_price || 0).toLocaleString()}
                                                                        </Text>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <Empty description="No hay items en esta factura" size="small" />
                                                )}
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Montos */}
                                    <Col xs={24}>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <div className={styles.amountsSection}>
                                            <Row gutter={[12, 12]}>
                                                <Col xs={24} sm={8}>
                                                    <div className={styles.amountItem}>
                                                        <Text strong>Total:</Text>
                                                        <Text className={styles.amount}>
                                                            ${parseFloat(invoice?.total_amount || 0).toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <div className={styles.amountItem}>
                                                        <Text strong>Pagado:</Text>
                                                        <Text className={styles.amountPaid}>
                                                            ${parseFloat(invoice?.paid_amount || 0).toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <div className={styles.amountItem}>
                                                        <Text strong>Restante:</Text>
                                                        <Text className={styles.amountRemaining}>
                                                            ${parseFloat(invoice?.remaining_amount || 0).toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>

                                    {/* Observaciones */}
                                    <Col xs={24}>
                                        <div className={styles.observationsSection}>
                                            <Text strong>Observaciones:</Text>
                                            {editingInvoice ? (
                                                <Form.Item name="observations" className={styles.observationsInput}>
                                                    <TextArea rows={2} placeholder="Observaciones de la factura..." />
                                                </Form.Item>
                                            ) : (
                                                <div className={styles.observationsText}>
                                                    <Text>{invoice?.observations || 'Sin observaciones'}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </div>

                    <div className={styles.pagosSection}>
                        <div className={styles.pagosHeader}>
                            <Title level={4}>
                                <BankOutlined style={{ marginRight: '8px' }} />
                                Pagos Realizados
                            </Title>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                onClick={handleAddPayment}
                                size="small"
                            >
                                Agregar Pago
                            </Button>
                        </div>
                        
                        <div className={styles.pagosContainer}>
                            {baseData.payments && baseData.payments.length > 0 ? (
                                baseData.payments.map((payment, index) => (
                                    <Card 
                                        key={payment.id || index}
                                        className={styles.paymentCard}
                                        size="small"
                                    >
                                        <div className={styles.paymentContent}>
                                            <div className={styles.paymentInfo}>
                                                <div className={styles.paymentMain}>
                                                    <Text strong className={styles.paymentAmount}>
                                                        ${parseFloat(payment.amount || 0).toLocaleString()}
                                                    </Text>
                                                    <Tag className={styles.paymentMethod} color="blue">{payment.payment_method || 'Efectivo'}</Tag>
                                                </div>
                                                <div className={styles.paymentDetails}>
                                                    <Text type="secondary">
                                                        Fecha: {dayjs.utc(payment.payment_date).local().format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                    {payment.reference && (
                                                        <Text type="secondary"> • Ref: {payment.reference}</Text>
                                                    )}
                                                </div>
                                                {payment.observations && (
                                                    <div className={styles.paymentNotes}>
                                                        <Text italic>{payment.observations}</Text>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.paymentActions}>
                                                <Space>
                                                    <Tooltip title="Editar pago">
                                                        <Button 
                                                            type="text" 
                                                            icon={<EditOutlined />}
                                                            size="small"
                                                            onClick={() => handleEditPayment(payment)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar pago">
                                                        <Popconfirm
                                                            title="¿Estás seguro de eliminar este pago?"
                                                            onConfirm={() => handleDeletePayment(payment.id)}
                                                            okText="Sí"
                                                            cancelText="No"
                                                        >
                                                            <Button 
                                                                type="text" 
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                            />
                                                        </Popconfirm>
                                                    </Tooltip>
                                                </Space>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <Empty description="No hay pagos registrados" />
                            )}
                        </div>
                    </div>
                </div>
                {/* Modal para agregar pago */}
                <AgregarPagoModal
                    open={agregarModalOpen}
                    onClose={handleCloseAgregarModal}
                    record={{ invoiceId: invoice?.id }}
                    mode="create"
                />
                
                {/* Modal para editar pago */}
                <AgregarPagoModal
                    open={editRecordModalOpen}
                    onClose={handleCloseEditRecordModal}
                    record={{ invoiceId: invoice?.id }}
                    mode="edit"
                    initialData={editingPayment}
                    editingPaymentId={editingPayment?.id}
                />
            </div>
        </AdminLayout>
    );
}