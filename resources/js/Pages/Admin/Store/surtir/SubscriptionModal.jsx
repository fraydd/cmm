import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, Checkbox, Card, Divider } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const SubscriptionModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    mode, // 'create' o 'edit'
    subscriptionData = null,
    branches = [] // Sedes disponibles desde el backend
}) => {
    const [form] = Form.useForm();
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [sameForAllBranches, setSameForAllBranches] = useState(true);
    const [originalBranchValues, setOriginalBranchValues] = useState({}); // Para guardar valores originales

    // Log cuando cambien las sedes disponibles
    useEffect(() => {
        console.log('🏢 Sedes disponibles para suscripciones:', branches);
    }, [branches]);

    // Actualizar formulario cuando cambien los datos de la suscripción
    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && subscriptionData) {
                console.log('✏️ Modo editar - Datos de suscripción:', subscriptionData);
                
                // Usar las sedes asignadas del backend
                const assignedBranchIds = subscriptionData.assigned_branch_ids || [];
                const assignedBranches = subscriptionData.assigned_branches || [];
                
                // Mapear los datos del backend al formulario
                const formData = {
                    name: subscriptionData.name,
                    description: subscriptionData.description,
                    price: parseFloat(subscriptionData.price),
                    duration_months: subscriptionData.duration_months,
                    branches: assignedBranchIds, // Usar todas las sedes asignadas
                };
                form.setFieldsValue(formData);
                setSelectedBranches(assignedBranchIds);
                
                // Inicializar datos de todas las sedes asignadas
                const branchData = {};
                const originalValues = {}; // Guardar valores originales para restaurar
                
                assignedBranches.forEach(branchInfo => {
                    const branchId = branchInfo.branch_id;
                    const price = branchInfo.custom_price || parseFloat(subscriptionData.price);
                    
                    branchData[`branch_${branchId}_price`] = price;
                    
                    // Guardar valores originales
                    originalValues[`branch_${branchId}_price`] = price;
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
                    price: 0,
                    duration_months: 1,
                    branches: [],
                });
                setSelectedBranches([]);
                setSameForAllBranches(true);
                setOriginalBranchValues({}); // Limpiar valores originales
            }
        }
    }, [visible, mode, subscriptionData?.id]); // Dependencia más específica

    // Manejar cambio de sedes seleccionadas
    const handleBranchesChange = (branchIds) => {
        setSelectedBranches(branchIds);
        
        // Si está activado "mismo para todas", copiar valores del primer campo a los demás
        if (sameForAllBranches && branchIds.length > 0) {
            const firstBranchId = branchIds[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            
            const branchData = {};
            branchIds.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
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
            });
            setOriginalBranchValues(currentValues);
            
            // Copiar valores del primer campo a todos los demás
            const firstBranchId = selectedBranches[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            
            const branchData = {};
            selectedBranches.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
            });
            form.setFieldsValue(branchData);
            
        } else if (!checked && selectedBranches.length > 0) {
            // DESACTIVAR: Restaurar valores originales guardados
            const valuesToRestore = {};
            selectedBranches.forEach(branchId => {
                if (originalBranchValues[`branch_${branchId}_price`] !== undefined) {
                    valuesToRestore[`branch_${branchId}_price`] = originalBranchValues[`branch_${branchId}_price`];
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
            
            // Estructurar datos de la suscripción base
            const subscriptionBaseData = {
                id: mode === 'edit' ? subscriptionData?.id : null,
                name: values.name,
                description: values.description || null,
                duration_months: values.duration_months,
                is_active: true // Por defecto activo
            };

            // Para crear, agregar precio base (será el precio del primer branch o 0)
            if (mode === 'create') {
                if (selectedBranches.length > 0) {
                    const firstBranchId = selectedBranches[0];
                    subscriptionBaseData.price = values[`branch_${firstBranchId}_price`] || 0;
                } else {
                    subscriptionBaseData.price = 0; // Fallback si no hay sedes
                }
            }

            // Estructurar datos de las sedes (branch_subscription_plans)
            const branchesData = selectedBranches.map(branchId => {
                const branch = branches.find(b => b.id === branchId);
                return {
                    branch_id: branchId,
                    branch_name: branch?.name, // Para referencia (no se guarda en BD)
                    custom_price: values[`branch_${branchId}_price`] || 0,
                    is_active: true
                };
            });

            // Estructura final bien organizada
            const structuredData = {
                mode: mode, // 'create' o 'edit'
                subscription: subscriptionBaseData,
                branches: branchesData,
                metadata: {
                    total_branches: branchesData.length,
                    same_config_all_branches: sameForAllBranches,
                    timestamp: new Date().toISOString(),
                    form_data_raw: values // Para debugging si es necesario
                }
            };

            // 🔥 LOG IMPORTANTE: Mostrar objeto que se enviará al backend
            console.log('🚀 OBJETO SUSCRIPCIÓN PARA BACKEND:', JSON.stringify(structuredData, null, 2));
            console.log('📊 DETALLE DE ENVÍO:', {
                modo: mode,
                nombre: values.name,
                duracion: values.duration_months,
                precio_base: subscriptionBaseData.price,
                descripcion: values.description,
                total_sedes: branchesData.length,
                sedes_detalle: branchesData.map(b => `${b.branch_name}: $${b.custom_price}`),
                timestamp: new Date().toLocaleString()
            });
            
            onSubmit(structuredData);
        } catch (error) {
            console.error('Error al validar formulario:', error);
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

    const modalTitle = mode === 'create' ? 'Crear Plan de Suscripción' : 'Editar Plan de Suscripción';

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            width={800}
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
                    <Col span={16}>
                        <Form.Item
                            label="Nombre del Plan"
                            name="name"
                            rules={[
                                { required: true, message: 'El nombre es requerido' },
                                { max: 255, message: 'El nombre no puede exceder 255 caracteres' }
                            ]}
                        >
                            <Input placeholder="Ingrese el nombre del plan de suscripción" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Duración (meses)"
                            name="duration_months"
                            rules={[{ required: true, message: 'La duración es requerida' }]}
                        >
                            <InputNumber
                                placeholder="1"
                                min={1}
                                max={60}
                                style={{ width: '100%' }}
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
                        placeholder="Descripción del plan (opcional)"
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
                        placeholder="Seleccione las sedes donde estará disponible el plan"
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
                                Usar el mismo precio para todas las sedes
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
                                            <Col span={24}>
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

export default SubscriptionModal;
