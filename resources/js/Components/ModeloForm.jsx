import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Steps, DatePicker, Upload, InputNumber, Radio, Checkbox, Divider, Row, Col, Typography, Tooltip, message, theme } from 'antd';
import { 
    PlusOutlined, 
    UploadOutlined, 
    UserOutlined, 
    ShoppingOutlined, 
    TeamOutlined, 
    CreditCardOutlined, 
    InfoCircleOutlined,
    IdcardOutlined,
    HeartOutlined,
    ContactsOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useBranch } from '../hooks/useBranch';
import ModelImageUploader from './ModelImageUploader.jsx';
import styles from './ModeloForm.module.scss';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Step } = Steps;

const ModeloForm = ({ 
    form, 
    onFinish, 
    loading = false, 
    initialValues = {},
    visible // <-- Asegúrate de pasar esta prop desde el modal
}) => {
    const { token } = theme.useToken();
    const { selectedBranch } = useBranch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialValues);
    const [catalogs, setCatalogs] = useState({
        identification_types: [],
        genders: [],
        blood_types: [],
        hair_colors: [],
        eye_colors: [],
        skin_colors: [],
        relationships: [],
        payment_methods: [],
        subscription_plans: [],
    });
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);

    // Resetear el paso cuando el modal se abre
    useEffect(() => {
        if (visible) setCurrentStep(0);
    }, [visible]);

    useEffect(() => {
        if (!selectedBranch) return;
        setLoadingCatalogs(true);
        fetch(`/admin/modelos/catalogs?branch_id=${selectedBranch.id}`)
            .then(res => res.json())
            .then(data => {
                setCatalogs(data);
                setLoadingCatalogs(false);
            })
            .catch(() => setLoadingCatalogs(false));
    }, [selectedBranch]);

    useEffect(() => {
        if (!visible) {
            setCurrentStep(0);
            form.resetFields(); // Limpia el formulario al cerrar
        }
    }, [visible, form]);

    const steps = [
        {
            title: 'Datos Personales',
            subtitle: 'Información básica',
            icon: <IdcardOutlined />,
        },
        {
            title: 'Datos Comerciales',
            subtitle: 'Medidas y características',
            icon: <HeartOutlined />,
        },
        {
            title: 'Datos de Acudiente',
            subtitle: 'Contacto de emergencia',
            icon: <ContactsOutlined />,
        },
        {
            title: 'Suscripción',
            subtitle: 'Plan y pago',
            icon: <DollarOutlined />,
        }
    ];

    const items = steps.map((step, index) => ({
        key: step.title,
        title: step.title,
        subtitle: step.subtitle,
        icon: step.icon
    }));

    const next = async () => {
        try {
            const values = await form.validateFields();
            
            // Limpiar datos de imágenes antes de enviar
            if (values.model_images && Array.isArray(values.model_images)) {
                values.model_images = values.model_images
                    .filter(img => img.status === 'done' && img.temp_id) // Solo imágenes subidas exitosamente
                    .map(img => ({
                        temp_id: img.temp_id,
                        url: img.url,
                        name: img.name,
                        size: img.size,
                        original_name: img.name
                    }));
                
            }
            
            setFormData({ ...formData, ...values });
            
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Último paso, mostrar mensaje de completado
                // const finalData = { ...formData, ...values };
                const finalData = { ...formData, ...values, branch_id: selectedBranch?.id };

                message.success('¡Registro completado exitosamente!');
                onFinish(finalData);
            }
        } catch (error) {
            console.error('Error de validación:', error);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleStepClick = (step) => {
        setCurrentStep(step);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div key="step-0">
                        <Title level={4}>Datos Personales</Title>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Nombres"
                                    name="nombres"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Nombres" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Apellidos"
                                    name="apellidos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Apellidos" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Número de identificación"
                                    name="numero_identificacion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Número de identificación" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Tipo de documento"
                                    name="identification_type_id"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.identification_types.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Lugar de expedición"
                                    name="lugar_expedicion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ciudad" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Fecha de nacimiento"
                                    name="fecha_nacimiento"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <DatePicker 
                                        placeholder="dd/mm/aaaa" 
                                        format="DD/MM/YYYY"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Sexo"
                                    name="gender_id"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.genders.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="G.S. RH"
                                    name="blood_type_id"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.blood_types.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Teléfono"
                                    name="telefono"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Teléfono" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Dirección"
                                    name="direccion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Dirección completa" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="E-Mail"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Campo obligatorio' },
                                        { type: 'email', message: 'Email inválido' }
                                    ]}
                                >
                                    <Input placeholder="correo@ejemplo.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Imágenes del Modelo"
                            name="model_images"
                            rules={[]}
                            valuePropName="value"
                        >
                            <ModelImageUploader
                                value={form.getFieldValue('model_images') || []}
                                onChange={imgs => form.setFieldsValue({ model_images: imgs })}
                            />
                        </Form.Item>
                    </div>
                );

            case 1:
                return (
                    <div key="step-1">
                        <Title level={4}>Datos Comerciales</Title>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    label="Estatura (m)"
                                    name="estatura"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="1.70" 
                                        min={1.0} 
                                        max={2.5} 
                                        step={0.01}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Busto (cm)"
                                    name="busto"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="90" 
                                        min={60} 
                                        max={150}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Cintura (cm)"
                                    name="cintura"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="70" 
                                        min={50} 
                                        max={150}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Cadera (cm)"
                                    name="cadera"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="95" 
                                        min={60} 
                                        max={150}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    label="Cabello"
                                    name="cabello"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.hair_colors.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Ojos"
                                    name="ojos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.eye_colors.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Piel"
                                    name="piel"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.skin_colors.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Calzado"
                                    name="calzado"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: 38, 8US, 25MX, etc." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Pantalón"
                                    name="pantalon"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: 28, S, 40, etc." />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Camisa"
                                    name="camisa"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: M, L, 38, etc." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider>Redes Sociales</Divider>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Facebook"
                                    name="facebook"
                                >
                                    <Input placeholder="ejemplo.123" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Instagram"
                                    name="instagram"
                                >
                                    <Input placeholder="ejemplo.123" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Twitter"
                                    name="twitter"
                                >
                                    <Input placeholder="@ejemplo12" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="TikTok"
                                    name="tiktok"
                                >
                                    <Input placeholder="@ejemplo12" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Otra red social"
                            name="otra_red_social"
                        >
                            <Input placeholder="Red social, cuenta" />
                        </Form.Item>
                    </div>
                );

            case 2:
                return (
                    <div key="step-2">
                        <Title level={4}>Datos de Acudiente</Title>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Nombres"
                                    name="acudiente_nombres"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Nombres del acudiente" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Apellidos"
                                    name="acudiente_apellidos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Apellidos del acudiente" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Número de identificación"
                                    name="acudiente_identificacion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Número de identificación" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Lugar de expedición"
                                    name="acudiente_lugar_expedicion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ciudad" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Parentesco"
                                    name="acudiente_parentesco"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.relationships.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Teléfono"
                                    name="acudiente_telefono"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Teléfono" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Dirección"
                            name="acudiente_direccion"
                            rules={[{ required: true, message: 'Campo obligatorio' }]}
                        >
                            <Input placeholder="Dirección completa" />
                        </Form.Item>
                    </div>
                );

            case 3:
                return (
                    <div key="step-3">
                        <Title level={4}>Suscripción Inicial</Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Plan de suscripción"
                                    name="subscription_plan_id"
                                    rules={[{ required: true, message: 'Seleccione un plan' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.subscription_plans.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Medio de pago"
                                    name="medio_pago"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.payment_methods.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Campo de cantidad, solo si hay plan seleccionado */}
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => prev.subscription_plan_id !== curr.subscription_plan_id}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('subscription_plan_id') ? (
                                    <Form.Item
                                        label="Cantidad"
                                        name="subscription_quantity"
                                        rules={[{ required: true, message: 'Ingrese la cantidad' }]}
                                    >
                                        <InputNumber min={1} placeholder="Cantidad" style={{ width: '100%' }} />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Fecha de entrada en vigencia"
                                    name="fecha_vigencia"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <DatePicker 
                                        placeholder="dd/mm/aaaa" 
                                        format="DD/MM/YYYY"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="¿Abonar una parte?"
                                    name="abonar_parte"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Abonar una parte del valor total</Checkbox>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => 
                                prevValues.abonar_parte !== currentValues.abonar_parte
                            }
                        >
                            {({ getFieldValue }) => 
                                getFieldValue('abonar_parte') ? (
                                    <Form.Item
                                        label="Valor a abonar"
                                        name="valor_abonar"
                                        rules={[{ required: true, message: 'Campo obligatorio' }]}
                                    >
                                        <InputNumber 
                                            placeholder="Valor en pesos" 
                                            min={0}
                                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>

                        <Form.Item
                            label="Observaciones"
                            name="observaciones"
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="Observaciones adicionales..."
                            />
                        </Form.Item>
                    </div>
                );

            default:
                return null;
        }
    };

    const contentStyle = undefined; // Eliminamos el objeto de estilos en línea

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            autoComplete="off"
        >
            <Steps current={currentStep} items={items} />
            
            <div className={styles.modeloFormContent}>
                {renderStepContent()}
            </div>
            
            <div className={styles.modeloFormButtons}>
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={() => next()} className={styles.modeloFormButton}>
                        Siguiente
                    </Button>
                )}
                {currentStep === steps.length - 1 && (
                    <Button type="primary" onClick={() => next()} loading={loading} disabled={loading} className={styles.modeloFormButton}>
                        Finalizar Registro
                    </Button>
                )}
                {currentStep > 0 && (
                    <Button className={styles.modeloFormButton} style={{ margin: '0 8px' }} onClick={() => prev()}>
                        Anterior
                    </Button>
                )}
            </div>
        </Form>
    );
};

export default ModeloForm; 