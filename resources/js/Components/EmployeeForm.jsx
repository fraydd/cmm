import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Select, Button, Space, Steps, DatePicker, InputNumber, Radio, Row, Col, Typography, Tooltip, message, theme, Checkbox, Divider } from 'antd';
import { 
    PlusOutlined, 
    UserOutlined, 
    TeamOutlined, 
    ContactsOutlined,
    IdcardOutlined,
    HeartOutlined,
    BankOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { useBranch } from '../hooks/useBranch';
import styles from './EmployeeForm.module.scss';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Step } = Steps;

const EmployeeForm = ({ 
    form, 
    onFinish, 
    loading = false, 
    initialValues = {},
    visible,
    employeeId // Nuevo prop opcional para modo edición
}) => {
    const { token } = theme.useToken();
    const { selectedBranch } = useBranch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialValues);
    const [hasEmergencyContact, setHasEmergencyContact] = useState(true);
    const [catalogs, setCatalogs] = useState({
        identification_types: [],
        genders: [],
        relationships: [],
        positions: [], // Cargos de empleados
        branches: [] // Sedes disponibles
    });
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [isEditMode, setIsEditMode] = useState(!!employeeId);
    const [loadingEmployee, setLoadingEmployee] = useState(false);


    // Resetear el paso cuando el modal se abre
    useEffect(() => {
        if (visible) setCurrentStep(0);
    }, [visible]);

    // Consultar datos del empleado cuando se abra en modo edición
    useEffect(() => {
        if (visible && employeeId) {
            setLoadingEmployee(true);
            fetch(`/admin/empleados/${employeeId}/edit`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.empleado) {
                        const empleado = { ...data.empleado };
                        if (empleado.birth_date) empleado.birth_date = dayjs(empleado.birth_date);
                        if (empleado.hire_date) empleado.hire_date = dayjs(empleado.hire_date);
                        if (empleado.end_date) empleado.end_date = dayjs(empleado.end_date);
                        form.setFieldsValue(empleado);
                        setFormData(empleado);
                        setHasEmergencyContact(!!empleado.has_emergency_contact);
                    }
                })
                .catch(() => {
                    message.error('No se pudo cargar la información del empleado');
                })
                .finally(() => setLoadingEmployee(false));
        } else if (visible && !employeeId) {
            // Si es modo crear, limpiar el formulario
            form.resetFields();
            setFormData(initialValues || {});
            setHasEmergencyContact(true);
        }
    }, [visible, employeeId, form, initialValues]);

    useEffect(() => {
        if (!selectedBranch) return;
        setLoadingCatalogs(true);
        fetch(`/admin/empleados/catalogs?branch_id=${selectedBranch.id}`)
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
            // No resetear los campos aquí, se hace en el otro useEffect
        }
    }, [visible]);

    const steps = [
        {
            title: 'Datos Personales',
            subtitle: 'Información básica',
            icon: <IdcardOutlined />,
        },
        {
            title: 'Datos Laborales',
            subtitle: 'Cargo, sede y accesos',
            icon: <TeamOutlined />,
        },
        {
            title: 'Contacto Emergencia',
            subtitle: 'Persona de contacto',
            icon: <ContactsOutlined />,
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
            console.log('Valores actuales del formulario:', allCurrentValues);
            
            // Luego validar solo los campos del paso actual
            let fieldsToValidate;
            switch (currentStep) {
                case 0: // Datos Personales
                    fieldsToValidate = [
                        'first_name', 'last_name', 'identification_type_id', 
                        'identification_number', 'gender_id', 'birth_date', 
                        'phone', 'email', 'address'
                    ];
                    break;
                case 1: // Datos Laborales
                    fieldsToValidate = [
                        'role', 'hire_date', 'salary', 'branch_access'
                    ];
                    break;
                case 2: // Contacto de Emergencia
                    if (hasEmergencyContact) {
                        fieldsToValidate = [
                            'emergency_contact_name', 'emergency_contact_last_name',
                            'emergency_contact_identification_type_id', 'emergency_contact_identification',
                            'emergency_contact_relationship_id', 'emergency_contact_phone'
                        ];
                    } else {
                        fieldsToValidate = [];
                    }
                    break;
                default:
                    fieldsToValidate = [];
            }
            
            // Validar solo los campos necesarios
            if (fieldsToValidate.length > 0) {
                await form.validateFields(fieldsToValidate);
            }
            
            // Actualizar formData con los valores actuales y avanzar
            setFormData({ ...formData, ...allCurrentValues });
            setCurrentStep(currentStep + 1);
        } catch (errorInfo) {
            console.log('Error de validación:', errorInfo);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    // Validador personalizado para evitar identificaciones duplicadas (contacto de emergencia)
    const validateEmergencyContactIdentification = (_, value) => {
        if (!hasEmergencyContact || !value) {
            return Promise.resolve();
        }
        
        const employeeIdentification = form.getFieldValue('identification_number');
        if (value === employeeIdentification) {
            return Promise.reject(new Error('El contacto de emergencia no puede tener la misma identificación que el empleado'));
        }
        
        return Promise.resolve();
    };

    // Validador personalizado para evitar identificaciones duplicadas (empleado)
    const validateEmployeeIdentification = (_, value) => {
        if (!value) {
            return Promise.resolve();
        }
        
        const emergencyContactIdentification = form.getFieldValue('emergency_contact_identification');
        if (hasEmergencyContact && value === emergencyContactIdentification) {
            // Re-validar el campo del contacto de emergencia para mostrar/ocultar su error
            setTimeout(() => {
                form.validateFields(['emergency_contact_identification']).catch(() => {});
            }, 100);
            return Promise.reject(new Error('El empleado no puede tener la misma identificación que el contacto de emergencia'));
        }
        
        // Re-validar el campo del contacto de emergencia para limpiar errores si ya no aplican
        if (emergencyContactIdentification) {
            setTimeout(() => {
                form.validateFields(['emergency_contact_identification']).catch(() => {});
            }, 100);
        }
        
        return Promise.resolve();
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFinish = async (values) => {
        // Prevenir double submit
        if (isSubmitting || loading) {
            console.log('Formulario ya se está procesando, ignorando segundo envío');
            return;
        }

        // Validación adicional antes del envío para identificaciones duplicadas
        if (hasEmergencyContact && 
            values.identification_number && 
            values.emergency_contact_identification && 
            values.identification_number === values.emergency_contact_identification) {
            
            message.error('El empleado y el contacto de emergencia no pueden tener el mismo número de identificación');
            // Ir al paso del contacto de emergencia
            setCurrentStep(2);
            // Marcar el campo del contacto de emergencia con error
            form.setFields([
                {
                    name: 'emergency_contact_identification',
                    errors: ['El contacto de emergencia no puede tener la misma identificación que el empleado']
                }
            ]);
            return;
        }

        try {
            setIsSubmitting(true);
            // Combinar todos los datos acumulados con los valores finales
            const allFormData = { ...formData, ...values };
            // Adjuntar el employeeId si está en modo edición
            if (employeeId) {
                allFormData.employeeId = employeeId;
            }
            console.log('Datos completos del formulario:', allFormData);
            // Llamar la función onFinish del padre con todos los datos y el id si aplica
            await onFinish(allFormData);
        } catch (error) {
            console.error('Error al enviar formulario:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderPersonalDataStep();
            case 1:
                return renderWorkDataStep();
            case 2:
                return renderEmergencyContactStep();
            default:
                return null;
        }
    };

    const renderPersonalDataStep = () => (
        <Row gutter={[16, 16]}>
            <Col span={12}>
                <Form.Item
                    name="first_name"
                    label="Nombres"
                    rules={[{ required: true, message: 'Por favor ingresa los nombres' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Nombres del empleado" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="last_name"
                    label="Apellidos"
                    rules={[{ required: true, message: 'Por favor ingresa los apellidos' }]}
                >
                    <Input placeholder="Apellidos del empleado" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="identification_type_id"
                    label="Tipo de Identificación"
                    rules={[{ required: true, message: 'Selecciona el tipo de identificación' }]}
                >
                    <Select placeholder="Selecciona tipo">
                        {catalogs.identification_types && catalogs.identification_types.map(type => (
                            <Option key={type.id} value={type.id}>{type.nombre}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="identification_number"
                    label="Número de Identificación"
                    rules={[
                        { required: true, message: 'Ingresa el número de identificación' },
                        { validator: validateEmployeeIdentification }
                    ]}
                >
                    <Input placeholder="123456789" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="gender_id"
                    label="Género"
                    rules={[{ required: true, message: 'Selecciona el género' }]}
                >
                    <Select placeholder="Selecciona género">
                        {catalogs.genders && catalogs.genders.map(gender => (
                            <Option key={gender.id} value={gender.id}>{gender.nombre}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="birth_date"
                    label="Fecha de Nacimiento"
                    rules={[{ required: true, message: 'Selecciona la fecha de nacimiento' }]}
                >
                    <DatePicker 
                        style={{ width: '100%' }} 
                        placeholder="Selecciona fecha"
                        format="DD/MM/YYYY"
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="phone"
                    label="Teléfono"
                    rules={[{ required: true, message: 'Ingresa el teléfono' }]}
                >
                    <Input placeholder="300 123 4567" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { type: 'email', message: 'Ingresa un email válido' },
                        { required: true, message: 'Ingresa el email' }
                    ]}
                >
                    <Input placeholder="empleado@empresa.com" />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    name="address"
                    label="Dirección"
                    rules={[{ required: true, message: 'Ingresa la dirección' }]}
                >
                    <TextArea rows={2} placeholder="Dirección completa de residencia" />
                </Form.Item>
            </Col>
        </Row>
    );

    const renderWorkDataStep = () => (
        <Row gutter={[16, 16]}>
            <Col span={12}>
                <Form.Item
                    name="role"
                    label="Cargo"
                    rules={[{ required: true, message: 'Selecciona el cargo' }]}
                >
                    <Select placeholder="Selecciona cargo">
                        <Option value="recepcionista">Recepcionista</Option>
                        <Option value="fotografo">Fotógrafo</Option>
                        <Option value="editor">Editor</Option>
                        <Option value="administrador">Administrador</Option>
                        <Option value="gerente">Gerente</Option>
                    </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="hire_date"
                    label="Fecha de Contratación"
                    rules={[{ required: true, message: 'Selecciona la fecha de contratación' }]}
                >
                    <DatePicker 
                        style={{ width: '100%' }} 
                        placeholder="Selecciona fecha"
                        format="DD/MM/YYYY"
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="salary"
                    label="Salario"
                    rules={[{ required: true, message: 'Ingresa el salario' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        placeholder="1000000"
                    />
                </Form.Item>
            </Col>

            <Col span={24}>
                <Form.Item
                    name="job_description"
                    label="Descripción del Cargo"
                >
                    <TextArea rows={3} placeholder="Describe las responsabilidades del cargo..." />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Divider orientation="left">Sedes de Acceso</Divider>
                <Form.Item
                    name="branch_access"
                    label="Sedes con Acceso"
                    rules={[{ required: true, message: 'Selecciona al menos una sede' }]}
                >
                    <Select 
                        mode="multiple" 
                        placeholder="Selecciona las sedes a las que tendrá acceso"
                        allowClear
                    >
                        {catalogs.branches && catalogs.branches.map(branch => (
                            <Option key={branch.id} value={branch.id}>{branch.nombre}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
        </Row>
    );

    const renderEmergencyContactStep = () => (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Form.Item
                    name="has_emergency_contact"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Checkbox 
                        onChange={(e) => {
                            setHasEmergencyContact(e.target.checked);
                            // Si se desactiva, limpiar los campos del contacto de emergencia
                            if (!e.target.checked) {
                                form.setFieldsValue({
                                    emergency_contact_name: undefined,
                                    emergency_contact_last_name: undefined,
                                    emergency_contact_identification_type_id: undefined,
                                    emergency_contact_identification: undefined,
                                    emergency_contact_relationship_id: undefined,
                                    emergency_contact_phone: undefined,
                                    emergency_contact_email: undefined,
                                });
                                // Re-validar el campo de identificación del empleado para limpiar errores
                                setTimeout(() => {
                                    form.validateFields(['identification_number']).catch(() => {});
                                }, 100);
                            } else {
                                // Si se activa, re-validar los campos para mostrar errores si aplican
                                setTimeout(() => {
                                    const employeeId = form.getFieldValue('identification_number');
                                    const emergencyId = form.getFieldValue('emergency_contact_identification');
                                    if (employeeId && emergencyId) {
                                        form.validateFields(['identification_number', 'emergency_contact_identification']).catch(() => {});
                                    }
                                }, 100);
                            }
                        }}
                    >
                        <strong>Registrar contacto de emergencia</strong>
                    </Checkbox>
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_name"
                    label="Nombres del Contacto"
                    rules={hasEmergencyContact ? [{ required: true, message: 'Ingresa los nombres del contacto' }] : []}
                >
                    <Input 
                        prefix={<ContactsOutlined />} 
                        placeholder="Nombres completos"
                        disabled={!hasEmergencyContact}
                    />
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_last_name"
                    label="Apellidos del Contacto"
                    rules={hasEmergencyContact ? [{ required: true, message: 'Ingresa los apellidos del contacto' }] : []}
                >
                    <Input 
                        placeholder="Apellidos completos"
                        disabled={!hasEmergencyContact}
                    />
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_identification_type_id"
                    label="Tipo de Identificación"
                    rules={hasEmergencyContact ? [{ required: true, message: 'Selecciona el tipo de identificación' }] : []}
                >
                    <Select 
                        placeholder="Selecciona tipo"
                        disabled={!hasEmergencyContact}
                    >
                        {catalogs.identification_types && catalogs.identification_types.map(type => (
                            <Option key={type.id} value={type.id}>{type.nombre}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_identification"
                    label="Número de Identificación"
                    rules={hasEmergencyContact ? [
                        { required: true, message: 'Ingresa el número de identificación' },
                        { validator: validateEmergencyContactIdentification }
                    ] : []}
                >
                    <Input 
                        placeholder="123456789"
                        disabled={!hasEmergencyContact}
                    />
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_relationship_id"
                    label="Relación"
                    rules={hasEmergencyContact ? [{ required: true, message: 'Selecciona la relación' }] : []}
                >
                    <Select 
                        placeholder="Selecciona relación"
                        disabled={!hasEmergencyContact}
                    >
                        {catalogs.relationships && catalogs.relationships.map(rel => (
                            <Option key={rel.id} value={rel.id}>{rel.nombre}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_phone"
                    label="Teléfono de Emergencia"
                    rules={hasEmergencyContact ? [{ required: true, message: 'Ingresa el teléfono' }] : []}
                >
                    <Input 
                        placeholder="300 123 4567"
                        disabled={!hasEmergencyContact}
                    />
                </Form.Item>
            </Col>
            
            <Col span={12}>
                <Form.Item
                    name="emergency_contact_email"
                    label="Email de Emergencia"
                    rules={hasEmergencyContact ? [{ type: 'email', message: 'Ingresa un email válido' }] : []}
                >
                    <Input 
                        placeholder="contacto@email.com"
                        disabled={!hasEmergencyContact}
                    />
                </Form.Item>
            </Col>
        </Row>
    );

    return (
        <Form
            form={form}
            name="employee_form"
            layout="vertical"
            onFinish={handleFinish}
            initialValues={initialValues}
            autoComplete="off"
        >
            <Steps current={currentStep} items={items} />
            <div className={styles.employeeFormContent}>
                {loadingEmployee ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>Cargando datos del empleado...</div>
                ) : (
                    renderStepContent()
                )}
            </div>
            <div className={styles.employeeFormButtons}>
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={next} className={styles.employeeFormButton}>
                        Siguiente
                    </Button>
                )}
                {currentStep === steps.length - 1 && (
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading || isSubmitting || loadingEmployee}
                        disabled={loading || isSubmitting || loadingEmployee}
                        className={styles.employeeFormButton}
                    >
                        {employeeId ? 'Actualizar' : 'Crear'}
                    </Button>
                )}
                {currentStep > 0 && (
                    <Button className={styles.employeeFormButton} style={{ margin: '0 8px' }} onClick={prev}>
                        Anterior
                    </Button>
                )}
            </div>
        </Form>
    );
};

export default EmployeeForm;
