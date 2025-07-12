import React, { useState } from 'react';
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

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Step } = Steps;

const ModeloForm = ({ 
    form, 
    onFinish, 
    loading = false, 
    initialValues = {} 
}) => {
    const { token } = theme.useToken();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialValues);

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
            setFormData({ ...formData, ...values });
            
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Último paso, mostrar mensaje de completado
                const finalData = { ...formData, ...values };
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
                            <Col span={12}>
                                <Form.Item
                                    label="Nombre completo"
                                    name="nombre_completo"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Nombre completo" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
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
                                    name="tipo_documento"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="cc">Cédula de Ciudadanía</Option>
                                        <Option value="ce">Cédula de Extranjería</Option>
                                        <Option value="ti">Tarjeta de Identidad</Option>
                                        <Option value="pp">Pasaporte</Option>
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
                                    name="sexo"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="femenino">Femenino</Option>
                                        <Option value="masculino">Masculino</Option>
                                        <Option value="otro">Otro</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="G.S. RH"
                                    name="grupo_sanguineo"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="a+">A+</Option>
                                        <Option value="a-">A-</Option>
                                        <Option value="b+">B+</Option>
                                        <Option value="b-">B-</Option>
                                        <Option value="ab+">AB+</Option>
                                        <Option value="ab-">AB-</Option>
                                        <Option value="o+">O+</Option>
                                        <Option value="o-">O-</Option>
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
                            label="Fotografía"
                            name="fotografia"
                            rules={[{ required: true, message: 'Campo obligatorio' }]}
                        >
                            <Upload
                                listType="picture-card"
                                maxCount={1}
                                beforeUpload={() => false}
                                fileList={form.getFieldValue('fotografia') || []}
                                onChange={(info) => {
                                    form.setFieldsValue({ fotografia: info.fileList });
                                }}
                            >
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Subir foto</div>
                                </div>
                            </Upload>
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
                                    <Select placeholder="Seleccione">
                                        <Option value="negro">Negro</Option>
                                        <Option value="castaño">Castaño</Option>
                                        <Option value="rubio">Rubio</Option>
                                        <Option value="pelirrojo">Pelirrojo</Option>
                                        <Option value="gris">Gris</Option>
                                        <Option value="blanco">Blanco</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Ojos"
                                    name="ojos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="cafes">Cafés</Option>
                                        <Option value="azules">Azules</Option>
                                        <Option value="verdes">Verdes</Option>
                                        <Option value="grises">Grises</Option>
                                        <Option value="negros">Negros</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Piel"
                                    name="piel"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="blanca">Blanca</Option>
                                        <Option value="morena">Morena</Option>
                                        <Option value="negra">Negra</Option>
                                        <Option value="mestiza">Mestiza</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Calzado"
                                    name="calzado"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="38" 
                                        min={30} 
                                        max={50}
                                        style={{ width: '100%' }}
                                    />
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
                                    <InputNumber 
                                        placeholder="28" 
                                        min={20} 
                                        max={50}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Camisa"
                                    name="camisa"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <InputNumber 
                                        placeholder="M" 
                                        min={1} 
                                        max={20}
                                        style={{ width: '100%' }}
                                    />
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
                            <Col span={12}>
                                <Form.Item
                                    label="Nombre completo"
                                    name="acudiente_nombre"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Nombre completo del acudiente" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
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
                                    <Select placeholder="Seleccione">
                                        <Option value="padre">Padre</Option>
                                        <Option value="madre">Madre</Option>
                                        <Option value="hermano">Hermano/a</Option>
                                        <Option value="tio">Tío/a</Option>
                                        <Option value="abuelo">Abuelo/a</Option>
                                        <Option value="tutor">Tutor legal</Option>
                                        <Option value="otro">Otro</Option>
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
                                    label="Número de meses"
                                    name="meses_suscripcion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value={1}>1 mes</Option>
                                        <Option value={3}>3 meses</Option>
                                        <Option value={6}>6 meses</Option>
                                        <Option value={12}>12 meses</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Medio de pago"
                                    name="medio_pago"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione">
                                        <Option value="efectivo">Efectivo</Option>
                                        <Option value="tarjeta">Tarjeta de crédito/débito</Option>
                                        <Option value="transferencia">Transferencia bancaria</Option>
                                        <Option value="pse">PSE</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

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

    const contentStyle = {
        height: 500,
        overflowY: 'auto',
        paddingRight: 8,
        lineHeight: 'normal',
        textAlign: 'left',
        color: token.colorTextTertiary,
        backgroundColor: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorder}`,
        marginTop: 16,
        padding: 16,
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            autoComplete="off"
        >
            <Steps current={currentStep} items={items} onChange={handleStepClick} />
            
            <div style={contentStyle}>
                {renderStepContent()}
            </div>
            
            <div style={{ marginTop: 24 }}>
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={() => next()}>
                        Siguiente
                    </Button>
                )}
                {currentStep === steps.length - 1 && (
                    <Button type="primary" onClick={() => next()}>
                        Finalizar Registro
                    </Button>
                )}
                {currentStep > 0 && (
                    <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                        Anterior
                    </Button>
                )}
            </div>
        </Form>
    );
};

export default ModeloForm; 