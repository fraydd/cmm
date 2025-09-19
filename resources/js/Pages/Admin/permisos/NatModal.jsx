import React, { useEffect } from 'react';
import { Modal, Button, Input, Select, Form, Popover } from 'antd';

export default function NatModal({ open, onCancel, onCreate, onEdit, isEdit = false, permisos = [], initialValues = null }) {
    const [form] = Form.useForm();
    // Generar opciones con Popover para mostrar descripción
    const selectOptions = Array.isArray(permisos)
        ? permisos.map(p => ({
            label: (
                <Popover content={p.description || 'Sin descripción'} title={p.name} placement="right">
                    <span>{p.name}</span>
                </Popover>
            ),
            value: p.id
        }))
        : [];

    // Cargar datos iniciales al abrir en modo edición
    useEffect(() => {
        if (open && isEdit && initialValues) {
            form.setFieldsValue({
                name: initialValues.name || '',
                permisos: Array.isArray(initialValues.permissions)
                    ? initialValues.permissions.map(p => p.id)
                    : []
            });
        } else if (open && !isEdit) {
            form.resetFields();
        }
    }, [open, isEdit, initialValues, form]);

    const handleSubmit = () => {
        form.validateFields().then(values => {
            if (isEdit) {
                onEdit && onEdit(values);
            } else {
                onCreate(values);
            }
            form.resetFields();
        });
    };

    return (
        <Modal
            title={isEdit ? "Editar rol" : "Crear nuevo rol"}
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={[
                <Button key="cancel" onClick={() => {
                    form.resetFields();
                    onCancel();
                }}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit}>
                    {isEdit ? "Editar" : "Crear"}
                </Button>
            ]}
        >
            <Form layout="vertical" form={form}>
                <Form.Item label="Nombre del rol" name="name" rules={[{ required: true, message: 'Ingrese el nombre del rol' }]}> 
                    <Input autoComplete="off" placeholder="Ingrese el nombre del rol" />
                </Form.Item>
                <Form.Item label="Seleccionar permisos" name="permisos" rules={[{ required: true, message: 'Seleccione al menos un permiso' }]}> 
                    <Select
                        mode="multiple"
                        placeholder="Seleccione uno o más permisos"
                        options={selectOptions}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
