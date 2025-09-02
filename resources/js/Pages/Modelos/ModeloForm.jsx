import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Select, Button, Space, Steps, DatePicker, Upload, InputNumber, Radio, Checkbox, Divider, Row, Col, Typography, Tooltip, message, theme } from 'antd';
import {  IdcardOutlined, HeartOutlined, ContactsOutlined, DollarOutlined} from '@ant-design/icons';
import { useBranch } from '../../hooks/useBranch.jsx';
import FileUploader from './FileUploader.jsx';
import styles from './ModeloForm.module.scss';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Step } = Steps;

const ModeloForm = forwardRef(({ 
    form, 
    onFinish, 
    loading = false, 
    initialValues = {},
    visible,
    modeloId
}, ref) => {
    const { token } = theme.useToken();
    const { selectedBranch } = useBranch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialValues);
    const [modelImages, setModelImages] = useState([]);
    const [pdfDocument, setPdfDocument] = useState([]);
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
    const [isEditMode, setIsEditMode] = useState(!!modeloId);
    const [loadingModelo, setLoadingModelo] = useState(false);

    // Función para limpiar el formulario (solo llamar tras éxito)
    const clearForm = () => {
        form.resetFields();
        setFormData({});
        setModelImages([]);
        setPdfDocument([]);
        setCurrentStep(0);
    };

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
        clearForm
    }));

    // Actualizar isEditMode cuando cambie modeloId
    useEffect(() => {
        setIsEditMode(!!modeloId);
    }, [modeloId]);

    // Resetear el paso cuando el modal se abre
    useEffect(() => {
        if (visible) setCurrentStep(0);
    }, [visible]);

    // Consultar datos del modelo cuando se abra en modo edición
    useEffect(() => {
        if (visible && modeloId) {
            setLoadingModelo(true);
            fetch(`/admin/modelos/${modeloId}/edit`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.modelo) {
                        const modelo = { ...data.modelo };
                        // Convertir fechas a objetos dayjs si existen
                        if (modelo.fecha_nacimiento) modelo.fecha_nacimiento = dayjs(modelo.fecha_nacimiento);
                        if (modelo.fecha_vigencia) modelo.fecha_vigencia = dayjs(modelo.fecha_vigencia);
                        
                        // Cargar imágenes existentes si las hay
                        if (data.imagenes && data.imagenes.length > 0) {
                            
                            const imagenesExistentes = data.imagenes.map(img => ({
                                uid: img.id,
                                name: img.name,
                                status: 'done',
                                url: img.url,
                                isExisting: true,
                                existingId: img.id,
                                id: img.id
                            }));
                            
                            setModelImages(imagenesExistentes);
                            modelo.model_images = imagenesExistentes;
                        } else {
                            setModelImages([]);
                        }
                         // Cargar PDF existente (catálogo) si lo hay - CORRECCIÓN AQUÍ
                        if (data.catalogos && data.catalogos.length > 0) {
                            const catalogosExistentes = data.catalogos.map(catalogo => ({
                                uid: catalogo.id,
                                name: catalogo.name,
                                status: 'done',
                                url: catalogo.url,
                                isExisting: true,
                                existingId: catalogo.id,
                                id: catalogo.id
                            }));
                            
                            setPdfDocument(catalogosExistentes);
                            modelo.pdf_document = catalogosExistentes;
                        } else {
                            setPdfDocument([]);
                        }


                        form.setFieldsValue(modelo);
                        setFormData(modelo);
                    }
                })
                .catch((error) => {
                    console.error('=== ERROR CARGANDO MODELO ===', error);
                    message.error('No se pudo cargar la información del modelo');
                })
                .finally(() => setLoadingModelo(false));
        } else if (visible && !modeloId) {
            // Si es modo crear, solo limpiar si es la primera vez que se abre
            // No limpiar si el modal se abre tras un error
            const hasFormData = Object.keys(formData).length > 0;
            if (!hasFormData) {
                form.resetFields();
                setFormData(initialValues || {});
                setModelImages([]);
                setPdfDocument([]);
            }
        }
    }, [visible, modeloId, form, initialValues]);

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
            // NO limpiar datos del formulario ni imágenes aquí para evitar pérdida de datos
            // Solo resetear cuando se complete exitosamente el registro (manejado desde el modal)
        }
    }, [visible]);

    // Configurar steps dinámicamente según el modo
    const baseSteps = [
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
        }
    ];

    // Solo agregar el paso de suscripción si NO está en modo edición
    const steps = isEditMode ? baseSteps : [
        ...baseSteps,
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
            // Primero obtener todos los valores actuales del formulario
            const allCurrentValues = form.getFieldsValue();
            
            // Luego validar solo los campos del paso actual
            let fieldsToValidate;
            switch (currentStep) {
                case 0: // Datos Personales
                    fieldsToValidate = [
                        'nombres', 'apellidos', 'numero_identificacion', 
                        'identification_type_id', 'lugar_expedicion', 'fecha_nacimiento',
                        'gender_id', 'blood_type_id', 'telefono', 'direccion', 'email'
                        // Nota: 'model_images' no se incluye en validación ya que no es obligatorio
                    ];
                    break;
                case 1: // Datos Comerciales
                    fieldsToValidate = [
                        'estatura', 'busto', 'cintura', 'cadera', 
                        'cabello', 'ojos', 'piel', 'calzado', 'pantalon', 'camisa'
                    ];
                    break;
                case 2: // Datos de Acudiente
                    fieldsToValidate = [
                        'acudiente_nombres', 'acudiente_apellidos', 'acudiente_identificacion',
                        'acudiente_tipo_identificacion', 'acudiente_lugar_expedicion', 
                        'acudiente_parentesco', 'acudiente_telefono', 'acudiente_direccion'
                    ];
                    break;
                case 3: // Suscripción (solo en modo creación)
                    if (!isEditMode) {
                        fieldsToValidate = [
                            'subscription_plan_id', 'medio_pago', 'subscription_quantity', 'fecha_vigencia'
                        ];
                        // Agregar valor_abonar si está marcado el checkbox
                        if (allCurrentValues.abonar_parte) {
                            fieldsToValidate.push('valor_abonar');
                        }
                    } else {
                        fieldsToValidate = [];
                    }
                    break;
                default:
                    fieldsToValidate = [];
            }
            
            // Validar solo los campos necesarios del paso actual
            if (fieldsToValidate.length > 0) {
                await form.validateFields(fieldsToValidate);
            }
            
            // Usar el estado de imágenes en lugar del valor del formulario
            // Asegurarse de que model_images siempre sea un array
            allCurrentValues.model_images = Array.isArray(modelImages) ? modelImages : [];
            
            // Procesar imágenes para modo edición vs creación
            if (allCurrentValues.model_images && Array.isArray(allCurrentValues.model_images)) {
                if (isEditMode) {
                    // En modo edición, separar imágenes nuevas y existentes
                    const newImages = allCurrentValues.model_images
                        .filter(img => {
                            const cumple = img.isNew && img.temp_id && img.status === 'done';
                            return cumple;
                        })
                        .map(img => ({
                            temp_id: img.temp_id,
                            url: img.url,
                            name: img.name,
                            size: img.size,
                            original_name: img.name,
                            isNew: true
                        }));
                    
                    const existingImages = allCurrentValues.model_images
                        .filter(img => {
                            const cumple = img.isExisting && img.existingId;
                            return cumple;
                        })
                        .map(img => ({
                            id: img.existingId,
                            name: img.name,
                            url: img.url,
                            isExisting: true
                        }));
                    
                    
                    allCurrentValues.model_images = [...newImages, ...existingImages];
                } else {
                    // En modo creación, solo imágenes nuevas
                    allCurrentValues.model_images = allCurrentValues.model_images
                        .filter(img => img.status === 'done' && img.temp_id)
                        .map(img => ({
                            temp_id: img.temp_id,
                            url: img.url,
                            name: img.name,
                            size: img.size,
                            original_name: img.name
                        }));
                }
            }

            allCurrentValues.pdf_document = Array.isArray(pdfDocument) ? pdfDocument : [];

            // Procesar PDF para modo edición vs creación
            if (allCurrentValues.pdf_document && Array.isArray(allCurrentValues.pdf_document)) {
                if (isEditMode) {
                    // En modo edición, separar PDF nuevo y existente
                    const newPdf = allCurrentValues.pdf_document
                        .filter(pdf => pdf.isNew && pdf.temp_id && pdf.status === 'done')
                        .map(pdf => ({
                            temp_id: pdf.temp_id,
                            url: pdf.url,
                            name: pdf.name,
                            size: pdf.size,
                            original_name: pdf.name,
                            isNew: true
                        }));
                    
                    const existingPdf = allCurrentValues.pdf_document
                        .filter(pdf => pdf.isExisting && pdf.existingId)
                        .map(pdf => ({
                            id: pdf.existingId,
                            name: pdf.name,
                            url: pdf.url,
                            isExisting: true
                        }));
                    
                    allCurrentValues.pdf_document = [...newPdf, ...existingPdf];
                } else {
                    // En modo creación, solo PDF nuevo
                    allCurrentValues.pdf_document = allCurrentValues.pdf_document
                        .filter(pdf => pdf.status === 'done' && pdf.temp_id)
                        .map(pdf => ({
                            temp_id: pdf.temp_id,
                            url: pdf.url,
                            name: pdf.name,
                            size: pdf.size,
                            original_name: pdf.name
                        }));
                }
            }
            
            // Actualizar formData con los valores actuales y avanzar
            setFormData({ ...formData, ...allCurrentValues });
            
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Último paso, enviar datos
                const finalData = { ...formData, ...allCurrentValues, branch_id: selectedBranch?.id };


                // Llamar onFinish que manejará el éxito/error desde el modal
                await onFinish(finalData);
            }
        } catch (error) {
            console.error('Error de validación en paso', currentStep, ':', error);
            // No limpiar datos aquí, mantener todo para que el usuario pueda corregir
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
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Nombres"
                                    name="nombres"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Nombres" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Apellidos"
                                    name="apellidos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Apellidos" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                                <Form.Item
                                    label="Número de identificación"
                                    name="numero_identificacion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Número de identificación" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
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
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Lugar de expedición"
                                    name="lugar_expedicion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Ciudad" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={24} lg={8} xl={8}>
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

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
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
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
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
                            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                                <Form.Item
                                    label="Teléfono"
                                    name="telefono"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Teléfono" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="Dirección"
                                    name="direccion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Dirección completa" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="E-Mail"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Campo obligatorio' },
                                        { type: 'email', message: 'Email inválido' }
                                    ]}
                                >
                                    <Input 
                                        placeholder="correo@ejemplo.com" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                <Form.Item
                                    label="Imágenes del Modelo (Opcional)"
                                    name="model_images"
                                    rules={[]}
                                    valuePropName="value"
                                >
                                    <FileUploader
                                        value={modelImages}
                                        onChange={(imgs) => {
                                            setModelImages(imgs || []);
                                            form.setFieldsValue({ model_images: imgs || [] });
                                        }}
                                        maxFiles={10}
                                        accept="image/*"
                                        fileType="image"
                                        listType="picture-card"
                                        uploadEndpoint="/admin/modelos/upload-image"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                <Form.Item
                                    label="Documento PDF (Opcional)"
                                    name="pdf_document"
                                    valuePropName="value"
                                >
                                    <FileUploader
                                        value={pdfDocument}
                                        onChange={(pdfs) => {
                                            setPdfDocument(pdfs || []);
                                            form.setFieldsValue({ pdf_document: pdfs || [] });
                                        }}
                                        maxFiles={1}
                                        accept=".pdf"
                                        fileType="pdf"
                                        listType="text"
                                        uploadEndpoint="/admin/modelos/upload-pdf"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                );

            case 1:
                return (
                    <div key="step-1">
                        <Title level={4}>Datos Comerciales</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
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

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
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
                            <Col xs={24} sm={12} md={24} lg={6} xl={6}>
                                <Form.Item
                                    label="Calzado"
                                    name="calzado"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: 38, 8US, 25MX, etc." autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                <Form.Item
                                    label="Pantalón"
                                    name="pantalon"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: 28, S, 40, etc." autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                <Form.Item
                                    label="Camisa"
                                    name="camisa"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input placeholder="Ej: M, L, 38, etc." autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider>Redes Sociales</Divider>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="Facebook"
                                    name="facebook"
                                >
                                    <Input placeholder="ejemplo.123" autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="Instagram"
                                    name="instagram"
                                >
                                    <Input placeholder="ejemplo.123" autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="Twitter"
                                    name="twitter"
                                >
                                    <Input placeholder="@ejemplo12" autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="TikTok"
                                    name="tiktok"
                                >
                                    <Input placeholder="@ejemplo12" autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                <Form.Item
                                    label="Otra red social"
                                    name="otra_red_social"
                                >
                                    <Input placeholder="Red social, cuenta" autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                );

            case 2:
                return (
                    <div key="step-2">
                        <Title level={4}>Datos de Acudiente</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Nombres"
                                    name="acudiente_nombres"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Nombres del acudiente" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Apellidos"
                                    name="acudiente_apellidos"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Apellidos del acudiente" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                                <Form.Item
                                    label="Número de identificación"
                                    name="acudiente_identificacion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Número de identificación" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Tipo de documento"
                                    name="acudiente_tipo_identificacion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Select placeholder="Seleccione" loading={loadingCatalogs} allowClear>
                                        {catalogs.identification_types.map(opt => (
                                            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                                <Form.Item
                                    label="Lugar de expedición"
                                    name="acudiente_lugar_expedicion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Ciudad" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={24} lg={8} xl={8}>
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
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                <Form.Item
                                    label="Teléfono"
                                    name="acudiente_telefono"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Teléfono" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                <Form.Item
                                    label="Correo Electrónico"
                                    name="acudiente_email"
                                    rules={[
                                        { type: 'email', message: 'Formato de email inválido' }
                                    ]}
                                >
                                    <Input 
                                        placeholder="correo@ejemplo.com" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                <Form.Item
                                    label="Dirección"
                                    name="acudiente_direccion"
                                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                                >
                                    <Input 
                                        placeholder="Dirección completa" 
                                        autoComplete="new-password"
                                        role="presentation"
                                        data-lpignore="true"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                );

            case 3:
                // En modo edición, no mostrar el paso de suscripción
                if (isEditMode) {
                    return null;
                }
                return (
                    <div key="step-3">
                        <Title level={4}>Suscripción Inicial</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
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
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Form.Item
                                    label="¿Abonar una parte?"
                                    name="abonar_parte"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Abonar una parte del valor total</Checkbox>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
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
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                <Form.Item
                                    label="Observaciones"
                                    name="observaciones"
                                >
                                    <TextArea 
                                        rows={4} 
                                        placeholder="Observaciones adicionales..."
                                        autoComplete="off"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
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
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
        >
            {/* Campos ocultos para confundir el autocompletado de Chrome */}
            <input 
                type="text" 
                name="username" 
                autoComplete="username" 
                style={{ display: 'none' }}
                tabIndex="-1"
            />
            <input 
                type="password" 
                name="password" 
                autoComplete="new-password" 
                style={{ display: 'none' }}
                tabIndex="-1"
            />
            
            <Steps current={currentStep} items={items} />
            
            <div className={styles.modeloFormContent}>
                {renderStepContent()}
            </div>
            
            <div className={styles.modeloFormButtons}>
                {currentStep > 0 && (
                    <Button onClick={() => prev()} className={styles.modeloFormButtonSecondary}>
                        Anterior
                    </Button>
                )}
                {currentStep < steps.length - 1 && (
                    <Button onClick={() => next()} className={styles.modeloFormButtonPrimary}>
                        Siguiente
                    </Button>
                )}
                {currentStep === steps.length - 1 && (
                    <Button onClick={() => next()} loading={loading} disabled={loading} className={styles.modeloFormButtonPrimary}>
                        {modeloId ? 'Actualizar Modelo' : 'Finalizar Registro'}
                    </Button>
                )}
            </div>
        </Form>
    );
});

export default ModeloForm; 