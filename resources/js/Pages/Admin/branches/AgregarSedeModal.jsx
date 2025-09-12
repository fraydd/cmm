import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Switch, Select } from 'antd';
import { UserOutlined, MailOutlined, HomeOutlined, PhoneOutlined } from '@ant-design/icons';

import { useNotifications } from '../../../hooks/useNotifications.jsx';

export default function AgregarSedeModal({ open, onClose, onSuccess, mode = 'create', branch = null }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [managerOptions, setManagerOptions] = useState([]);
    const [fetchingManagers, setFetchingManagers] = useState(false);
    const { showSuccess, showError } = useNotifications();

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && branch) {
                form.setFieldsValue({
                    name: branch.name || '',
                    address: branch.address || '',
                    phone: branch.phone || '',
                    email: branch.email || '',
                    manager_id: branch.manager_id || undefined,
                    is_active: branch.is_active ?? true,
                });
                // Si hay manager actual y no está en managerOptions, lo agregamos
                if (branch.manager_id && branch.manager_name && branch.manager_email) {
                    setManagerOptions(options => {
                        const exists = options.some(opt => opt.value === branch.manager_id);
                        if (!exists) {
                            return [
                                { value: branch.manager_id, label: `${branch.manager_name} (${branch.manager_email})` },
                                ...options
                            ];
                        }
                        return options;
                    });
                }
            } else {
                form.resetFields();
                form.setFieldsValue({ is_active: true });
                setManagerOptions([]);
            }
        }
    }, [open, mode, branch, form]);

    const handleSearchManager = async (value) => {
        if (!value || value.length < 3) {
            setManagerOptions([]);
            return;
        }
        setFetchingManagers(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const response = await fetch(`/admin/sedes/search-managers?query=${encodeURIComponent(value)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                }
            });
            if (!response.ok) throw new Error('Error al buscar managers');
            const data = await response.json();
            setManagerOptions((data.users || []).map(user => ({
                label: `${user.name} (${user.email})`,
                value: user.id
            })));
        } catch (e) {
            setManagerOptions([]);
        } finally {
            setFetchingManagers(false);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            let url = '/admin/sedes';
            let method = 'POST';
            let successMsg = 'Sede registrada correctamente';
            if (mode === 'edit' && branch) {
                url = `/admin/sedes/${branch.id}`;
                method = 'PUT';
                successMsg = 'Sede actualizada correctamente';
            }
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify(values)
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || (mode === 'edit' ? 'Error al actualizar la sede' : 'Error al registrar la sede'));
            }
            showSuccess(successMsg);
            form.resetFields();
            setLoading(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            setLoading(false);
            if (error.errorFields) return; // validación de campos
            showError(error.message || (mode === 'edit' ? 'Error al actualizar la sede' : 'Error al registrar la sede'));
        }
    };

    return (
        <Modal
            title={mode === 'edit' ? 'Editar sede' : 'Registrar nueva sede'}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={loading}
            okText={mode === 'edit' ? 'Guardar cambios' : 'Registrar'}
            cancelText="Cancelar"
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                name="agregar_sede_form"
                initialValues={{ is_active: true }}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label="Nombre de la sede"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input prefix={<HomeOutlined />} placeholder="Ej: Sede Principal" maxLength={255} autoFocus autoComplete="off" />
                </Form.Item>
                <Form.Item
                    name="address"
                    label="Dirección"
                    rules={[{ required: true, message: 'La dirección es obligatoria' }]}
                >
                    <Input prefix={<HomeOutlined />} placeholder="Dirección completa" maxLength={255} autoComplete="off" />
                </Form.Item>
                <Form.Item
                    name="phone"
                    label="Teléfono"
                    rules={[
                        { required: true, message: 'El teléfono es obligatorio' },
                        { pattern: /^\+?\d{7,20}$/, message: 'Teléfono inválido' }
                    ]}
                >
                    <Input prefix={<PhoneOutlined />} placeholder="Ej: +573001234567" maxLength={20} autoComplete="off" />
                </Form.Item>
                <Form.Item
                    name="email"
                    label="Correo electrónico"
                    rules={[
                        { required: true, message: 'El correo es obligatorio' },
                        { type: 'email', message: 'Correo inválido' }
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="correo@ejemplo.com" maxLength={255} autoComplete="off" />
                </Form.Item>
                <Form.Item
                    name="manager_id"
                    label="Manager de la sede"
                    rules={[{ required: true, message: 'El manager es obligatorio' }]}
                >
                    <Select
                        showSearch
                        placeholder="Buscar manager por nombre o correo"
                        filterOption={false}
                        onSearch={handleSearchManager}
                        notFoundContent={fetchingManagers ? 'Buscando...' : 'No encontrado'}
                        options={managerOptions}
                        autoClearSearchValue
                    />
                </Form.Item>
                <Form.Item
                    name="is_active"
                    label="¿Sede activa?"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Sí" unCheckedChildren="No" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
