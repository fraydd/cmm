import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Checkbox, Button, Space, Typography, Divider } from 'antd';
import { useNotifications } from '../hooks/useNotifications.jsx';

const { Option } = Select;
const { Title, Text } = Typography;

const RoleModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    roleId = null,
    title = "Nuevo Rol",
    loading = false 
}) => {
    const [form] = Form.useForm();
    const { showError } = useNotifications();
    const [submitting, setSubmitting] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    // Cargar permisos disponibles cuando se abre el modal
    useEffect(() => {
        if (visible) {
            loadPermissions();
        }
    }, [visible]);

    const loadPermissions = async () => {
        setLoadingPermissions(true);
        try {
            const response = await fetch('/admin/permisos/get-permissions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text);
                throw new Error('La respuesta del servidor no es JSON válido');
            }

            const data = await response.json();
            console.log('Permisos cargados:', data);
            setAvailablePermissions(data.permisos || []);
        } catch (error) {
            console.error('Error al cargar permisos:', error);
            showError('Error al cargar los permisos disponibles: ' + error.message);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const values = await form.validateFields();
            
            // Formatear los datos para envío
            const formData = {
                name: values.name.trim(),
                guard_name: values.guard_name || 'web',
                permissions: values.permissions || []
            };

            console.log('Enviando datos del rol:', formData);
            await onSubmit(formData);
            form.resetFields();
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            if (error.errorFields) {
                // Error de validación de Ant Design
                return;
            }
            
            // Si hay un error específico de validación del servidor
            if (error.message && error.message.includes('already been taken')) {
                form.setFields([
                    {
                        name: 'name',
                        errors: ['Este nombre de rol ya existe. Por favor, elige otro nombre.']
                    }
                ]);
                return;
            }
            
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    // Título dinámico
    const modalTitle = roleId ? 'Editar Rol' : title;

    // Agrupar permisos por categoría para mejor visualización
    const groupedPermissions = availablePermissions.reduce((groups, permission) => {
        const category = permission.name.split('_')[1] || 'otros';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(permission);
        return groups;
    }, {});

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={handleCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancelar
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    loading={submitting || loading}
                    onClick={handleSubmit}
                >
                    {roleId ? 'Actualizar' : 'Crear'} Rol
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    guard_name: 'web'
                }}
            >
                <Form.Item
                    label="Nombre del Rol"
                    name="name"
                    rules={[
                        { required: true, message: 'El nombre del rol es obligatorio' },
                        { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                        { max: 255, message: 'El nombre no puede exceder 255 caracteres' }
                    ]}
                >
                    <Input 
                        placeholder="Ej: editor, moderador, supervisor..."
                        autoComplete="off"
                    />
                </Form.Item>

                <Form.Item
                    label="Guard"
                    name="guard_name"
                    rules={[
                        { required: true, message: 'El guard es obligatorio' }
                    ]}
                >
                    <Select placeholder="Seleccionar guard">
                        <Option value="web">Web</Option>
                        <Option value="api">API</Option>
                    </Select>
                </Form.Item>

                <Divider>Permisos</Divider>

                <Form.Item
                    label="Seleccionar Permisos"
                    name="permissions"
                    extra="Selecciona los permisos que tendrá este rol"
                >
                    {loadingPermissions ? (
                        <Text type="secondary">Cargando permisos...</Text>
                    ) : (
                        <Checkbox.Group style={{ width: '100%' }}>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                    <div key={category} style={{ marginBottom: '16px' }}>
                                        <Title level={5} style={{ 
                                            margin: '8px 0', 
                                            textTransform: 'capitalize',
                                            color: '#1890ff'
                                        }}>
                                            {category.replace('_', ' ')}
                                        </Title>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                            gap: '8px',
                                            marginLeft: '16px'
                                        }}>
                                            {permissions.map(permission => (
                                                <Checkbox 
                                                    key={permission.id} 
                                                    value={permission.id}
                                                    style={{ marginBottom: '4px' }}
                                                >
                                                    <Text style={{ fontSize: '13px' }}>
                                                        {permission.name.replace(/_/g, ' ')}
                                                    </Text>
                                                </Checkbox>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Checkbox.Group>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RoleModal;
