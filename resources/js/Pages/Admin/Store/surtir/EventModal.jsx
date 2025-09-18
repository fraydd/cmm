import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Row, Col, Checkbox, Card, Divider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const EventModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    mode, // 'create' o 'edit'
    eventData = null,
    branches = [] // Sedes disponibles desde el backend
}) => {
    const [form] = Form.useForm();
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [sameForAllBranches, setSameForAllBranches] = useState(true);
    const [originalBranchValues, setOriginalBranchValues] = useState({}); // Para guardar valores originales

    // Log cuando cambien las sedes disponibles
    useEffect(() => {
        console.log('🏢 Sedes disponibles para eventos:', branches);
    }, [branches]);

    // Actualizar formulario cuando cambien los datos del evento
    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && eventData) {
                console.log('✏️ Modo editar - Datos de evento:', eventData);
                
                // Usar las sedes asignadas del backend
                const assignedBranchIds = eventData.assigned_branch_ids || [];
                const assignedBranches = eventData.assigned_branches || [];
                
                // Mapear los datos del backend al formulario
                const formData = {
                    name: eventData.name,
                    description: eventData.description,
                    event_date: eventData.event_date ? dayjs(eventData.event_date) : null,
                    registration_deadline: eventData.registration_deadline ? dayjs(eventData.registration_deadline) : null,
                    price: parseFloat(eventData.price),
                    max_participants: eventData.base_max_participants || eventData.max_participants,
                    branches: assignedBranchIds, // Usar todas las sedes asignadas
                };
                form.setFieldsValue(formData);
                setSelectedBranches(assignedBranchIds);
                
                // Inicializar datos de todas las sedes asignadas
                const branchData = {};
                const originalValues = {}; // Guardar valores originales para restaurar
                
                assignedBranches.forEach(branchInfo => {
                    const branchId = branchInfo.branch_id;
                    const price = branchInfo.custom_price || parseFloat(eventData.price);
                    const maxParticipants = branchInfo.max_participants || eventData.base_max_participants || eventData.max_participants || 0;
                    
                    branchData[`branch_${branchId}_price`] = price;
                    branchData[`branch_${branchId}_max_participants`] = maxParticipants;
                    
                    // Guardar valores originales
                    originalValues[`branch_${branchId}_price`] = price;
                    originalValues[`branch_${branchId}_max_participants`] = maxParticipants;
                });
                
                form.setFieldsValue(branchData);
                setOriginalBranchValues(originalValues); // Guardar para restaurar después

                // CORREGIDO: En modo editar, desactivar "mismo para todas" para mostrar valores personalizados
                setSameForAllBranches(false);
            } else if (mode === 'create') {
                // Valores por defecto para crear
                form.setFieldsValue({
                    name: '',
                    description: '',
                    event_date: null,
                    registration_deadline: null,
                    price: 0,
                    max_participants: 50,
                    branches: [],
                });
                setSelectedBranches([]);
                setSameForAllBranches(true);
                setOriginalBranchValues({}); // Limpiar valores originales
            }
        }
    }, [visible, mode, eventData?.id]); // Dependencia más específica

    // Manejar cambio de sedes seleccionadas
    const handleBranchesChange = (branchIds) => {
        setSelectedBranches(branchIds);
        
        // Si está activado "mismo para todas", copiar valores del primer campo a los demás
        if (sameForAllBranches && branchIds.length > 0) {
            const firstBranchId = branchIds[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            const firstMaxParticipants = form.getFieldValue(`branch_${firstBranchId}_max_participants`) || 50;
            
            const branchData = {};
            branchIds.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
                branchData[`branch_${branchId}_max_participants`] = firstMaxParticipants;
            });
            form.setFieldsValue(branchData);
        }
    };

    // Manejar cambio del checkbox "mismo para todas"
    const handleSameForAllChange = (e) => {
        const checked = e.target.checked;
        setSameForAllBranches(checked);
        
        if (checked && selectedBranches.length > 0) {
            // ACTIVAR: Guardar valores actuales antes de aplicar configuración uniforme
            const currentValues = {};
            selectedBranches.forEach(branchId => {
                currentValues[`branch_${branchId}_price`] = form.getFieldValue(`branch_${branchId}_price`) || 0;
                currentValues[`branch_${branchId}_max_participants`] = form.getFieldValue(`branch_${branchId}_max_participants`) || 50;
            });
            setOriginalBranchValues(currentValues);
            
            // Copiar valores del primer campo a todos los demás
            const firstBranchId = selectedBranches[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            const firstMaxParticipants = form.getFieldValue(`branch_${firstBranchId}_max_participants`) || 50;
            
            const branchData = {};
            selectedBranches.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
                branchData[`branch_${branchId}_max_participants`] = firstMaxParticipants;
            });
            form.setFieldsValue(branchData);
            
        } else if (!checked && selectedBranches.length > 0) {
            // DESACTIVAR: Restaurar valores originales guardados
            const valuesToRestore = {};
            selectedBranches.forEach(branchId => {
                if (originalBranchValues[`branch_${branchId}_price`] !== undefined) {
                    valuesToRestore[`branch_${branchId}_price`] = originalBranchValues[`branch_${branchId}_price`];
                }
                if (originalBranchValues[`branch_${branchId}_max_participants`] !== undefined) {
                    valuesToRestore[`branch_${branchId}_max_participants`] = originalBranchValues[`branch_${branchId}_max_participants`];
                }
            });
            
            if (Object.keys(valuesToRestore).length > 0) {
                form.setFieldsValue(valuesToRestore);
            }
        }
    };

    // Manejar cambio en el primer campo cuando "mismo para todas" está activado
    const handleMasterFieldChange = (field, value) => {
        if (sameForAllBranches && selectedBranches.length > 0) {
            const branchData = {};
            selectedBranches.forEach(branchId => {
                branchData[`branch_${branchId}_${field}`] = value;
            });
            form.setFieldsValue(branchData);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // ✅ VALIDACIÓN FINAL DE FECHAS (doble verificación)
            const eventDate = dayjs(values.event_date);
            const registrationDeadline = dayjs(values.registration_deadline);
            const today = dayjs().startOf('day');
            
            // Verificar que la fecha del evento no sea en el pasado
            if (eventDate.isBefore(today)) {
                throw new Error('La fecha del evento no puede ser en el pasado');
            }
            
            // Verificar que la fecha límite no sea en el pasado
            if (registrationDeadline.isBefore(today)) {
                throw new Error('La fecha límite de registro no puede ser en el pasado');
            }
            
            // Verificar que la fecha límite sea anterior a la fecha del evento
            if (registrationDeadline.isAfter(eventDate) || registrationDeadline.isSame(eventDate)) {
                throw new Error('La fecha límite debe ser anterior a la fecha del evento');
            }
            
            // Estructurar datos del evento base
            const eventBaseData = {
                id: mode === 'edit' ? eventData?.id : null,
                name: values.name,
                description: values.description || null,
                event_date: values.event_date ? values.event_date.format('YYYY-MM-DD') : null,
                registration_deadline: values.registration_deadline ? values.registration_deadline.format('YYYY-MM-DD') : null,
                max_participants: values.max_participants || 50,
                current_participants: mode === 'edit' ? (eventData?.base_current_participants || 0) : 0,
                is_active: true // Por defecto activo
            };

            // Para crear, agregar precio base (será el precio del primer branch o 0)
            if (mode === 'create') {
                if (selectedBranches.length > 0) {
                    const firstBranchId = selectedBranches[0];
                    eventBaseData.price = values[`branch_${firstBranchId}_price`] || 0;
                } else {
                    eventBaseData.price = 0; // Fallback si no hay sedes
                }
            }

            // Estructurar datos de las sedes (event_branch_access)
            const branchesData = selectedBranches.map(branchId => {
                const branch = branches.find(b => b.id === branchId);
                return {
                    branch_id: branchId,
                    branch_name: branch?.name, // Para referencia (no se guarda en BD)
                    custom_price: values[`branch_${branchId}_price`] || 0,
                    max_participants: values[`branch_${branchId}_max_participants`] || 50,
                    current_participants: 0, // Siempre inicia en 0
                    is_active: true
                };
            });

            // Estructura final bien organizada
            const structuredData = {
                mode: mode, // 'create' o 'edit'
                event: eventBaseData,
                branches: branchesData,
                metadata: {
                    total_branches: branchesData.length,
                    same_config_all_branches: sameForAllBranches,
                    timestamp: new Date().toISOString(),
                    form_data_raw: values // Para debugging si es necesario
                }
            };

            // 🔥 LOG IMPORTANTE: Mostrar objeto que se enviará al backend
            console.log('🚀 OBJETO EVENTO PARA BACKEND:', JSON.stringify(structuredData, null, 2));
            console.log('📊 DETALLE DE ENVÍO:', {
                modo: mode,
                nombre: values.name,
                fecha_evento: eventBaseData.event_date,
                fecha_limite: eventBaseData.registration_deadline,
                precio_base: eventBaseData.price,
                max_participantes_base: eventBaseData.max_participants,
                descripcion: values.description,
                total_sedes: branchesData.length,
                sedes_detalle: branchesData.map(b => `${b.branch_name}: $${b.custom_price} (${b.max_participants} participantes)`),
                timestamp: new Date().toLocaleString()
            });
            
            onSubmit(structuredData);
        } catch (error) {
            console.error('Error al validar formulario:', error);
            
            // Si es un error de validación de fechas, mostrar mensaje específico
            if (error.message && typeof error.message === 'string') {
                if (error.message.includes('fecha')) {
                    // Mostrar toast de error o alerta
                    Modal.error({
                        title: 'Error de Validación',
                        content: error.message,
                        centered: true,
                    });
                    return;
                }
            }
        }
    };

    const handleCancel = () => {
        // Limpiar estado al cancelar
        setSelectedBranches([]);
        setSameForAllBranches(true);
        setOriginalBranchValues({}); // Limpiar valores originales
        form.resetFields();
        onCancel();
    };

    const modalTitle = mode === 'create' ? 'Crear Evento' : 'Editar Evento';

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            width={900}
            okText={mode === 'create' ? 'Crear' : 'Actualizar'}
            cancelText="Cancelar"
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Nombre del Evento"
                            name="name"
                            rules={[
                                { required: true, message: 'El nombre es requerido' },
                                { max: 255, message: 'El nombre no puede exceder 255 caracteres' }
                            ]}
                        >
                            <Input placeholder="Ingrese el nombre del evento" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Máximo de Participantes (Base)"
                            name="max_participants"
                            rules={[{ required: true, message: 'El máximo de participantes es requerido' }]}
                        >
                            <InputNumber
                                placeholder="50"
                                min={1}
                                max={10000}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <span>
                                    Fecha del Evento{' '}
                                    <Tooltip title="La fecha del evento debe ser hoy o en el futuro">
                                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                    </Tooltip>
                                </span>
                            }
                            name="event_date"
                            rules={[
                                { required: true, message: 'La fecha del evento es requerida' },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        
                                        const today = dayjs().startOf('day');
                                        const selectedDate = dayjs(value).startOf('day');
                                        
                                        if (selectedDate.isBefore(today)) {
                                            return Promise.reject(new Error('La fecha del evento no puede ser en el pasado'));
                                        }
                                        
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <DatePicker 
                                placeholder="Seleccione la fecha del evento"
                                style={{ width: '100%' }}
                                format="YYYY-MM-DD"
                                disabledDate={(current) => {
                                    // Deshabilitar fechas pasadas
                                    return current && current < dayjs().startOf('day');
                                }}
                                onChange={(date) => {
                                    // Cuando cambia la fecha del evento, validar la fecha límite
                                    const registrationDeadline = form.getFieldValue('registration_deadline');
                                    if (registrationDeadline && date) {
                                        if (dayjs(registrationDeadline).isAfter(dayjs(date)) || dayjs(registrationDeadline).isSame(dayjs(date))) {
                                            // Limpiar fecha límite si es mayor o igual a la fecha del evento
                                            form.setFieldsValue({ registration_deadline: null });
                                        }
                                    }
                                    // Forzar validación del campo de fecha límite
                                    form.validateFields(['registration_deadline']);
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <span>
                                    Fecha Límite de Registro{' '}
                                    <Tooltip title="La fecha límite debe ser anterior a la fecha del evento y no puede ser en el pasado">
                                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                    </Tooltip>
                                </span>
                            }
                            name="registration_deadline"
                            rules={[
                                { required: true, message: 'La fecha límite de registro es requerida' },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        
                                        const eventDate = form.getFieldValue('event_date');
                                        if (!eventDate) {
                                            return Promise.reject(new Error('Primero seleccione la fecha del evento'));
                                        }
                                        
                                        const registrationDate = dayjs(value).startOf('day');
                                        const eventDateDay = dayjs(eventDate).startOf('day');
                                        const today = dayjs().startOf('day');
                                        
                                        if (registrationDate.isBefore(today)) {
                                            return Promise.reject(new Error('La fecha límite no puede ser en el pasado'));
                                        }
                                        
                                        if (registrationDate.isAfter(eventDateDay) || registrationDate.isSame(eventDateDay)) {
                                            return Promise.reject(new Error('La fecha límite debe ser anterior a la fecha del evento'));
                                        }
                                        
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <DatePicker 
                                placeholder="Seleccione la fecha límite"
                                style={{ width: '100%' }}
                                format="YYYY-MM-DD"
                                disabledDate={(current) => {
                                    const eventDate = form.getFieldValue('event_date');
                                    const today = dayjs().startOf('day');
                                    
                                    // Deshabilitar fechas pasadas
                                    if (current && current < today) return true;
                                    
                                    // Si hay fecha del evento, deshabilitar fechas mayor o igual a esa fecha
                                    if (eventDate && current) {
                                        return current >= dayjs(eventDate).startOf('day');
                                    }
                                    
                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Descripción"
                    name="description"
                >
                    <TextArea 
                        rows={2} 
                        placeholder="Descripción del evento (opcional)"
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label="Sedes"
                    name="branches"
                    rules={[{ required: true, message: 'Debe seleccionar al menos una sede' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Seleccione las sedes donde se realizará el evento"
                        onChange={handleBranchesChange}
                        optionFilterProp="children"
                    >
                        {branches.map(branch => (
                            <Option key={branch.id} value={branch.id}>
                                {branch.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedBranches.length > 0 && (
                    <>
                        <Divider orientation="left">Configuración por Sede</Divider>
                        
                        {selectedBranches.length > 1 && (
                            <Checkbox
                                checked={sameForAllBranches}
                                onChange={handleSameForAllChange}
                                style={{ marginBottom: 16 }}
                            >
                                Usar el mismo precio y máximo de participantes para todas las sedes
                            </Checkbox>
                        )}

                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: '8px',
                            marginRight: '-8px'
                        }}>
                            {selectedBranches.map((branchId, index) => {
                                const branch = branches.find(b => b.id === branchId);
                                const isFirst = index === 0;
                                const isDisabled = sameForAllBranches && !isFirst && selectedBranches.length > 1;
                                
                                return (
                                    <Card 
                                        key={branchId}
                                        size="small"
                                        title={branch?.name}
                                        style={{ marginBottom: 16 }}
                                        type={isFirst && sameForAllBranches && selectedBranches.length > 1 ? "inner" : "default"}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Precio"
                                                    name={`branch_${branchId}_price`}
                                                    rules={[
                                                        { required: true, message: 'El precio es requerido' },
                                                        { type: 'number', min: 0, message: 'El precio debe ser mayor o igual a 0' }
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        placeholder="0.00"
                                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                                        precision={2}
                                                        min={0}
                                                        disabled={isDisabled}
                                                        onChange={(value) => isFirst && handleMasterFieldChange('price', value)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Máximo Participantes"
                                                    name={`branch_${branchId}_max_participants`}
                                                    rules={[
                                                        { required: true, message: 'El máximo de participantes es requerido' },
                                                        { type: 'number', min: 1, message: 'Debe ser mayor a 0' }
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        placeholder="50"
                                                        min={1}
                                                        max={10000}
                                                        precision={0}
                                                        disabled={isDisabled}
                                                        onChange={(value) => isFirst && handleMasterFieldChange('max_participants', value)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default EventModal;
