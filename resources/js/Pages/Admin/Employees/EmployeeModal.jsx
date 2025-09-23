import React, { useState } from 'react';
import { Modal, Form } from 'antd';
import EmployeeForm from './EmployeeForm';

const EmployeeModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    employeeId = null, // Nuevo prop para modo edición
    title = "Nuevo Empleado",
    initialValues = {},
    loading = false 
}) => {
    const [form] = Form.useForm();

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    const handleSubmit = async (values) => {
        try {
            await onSubmit(values);
            form.resetFields();
        } catch (error) {
            console.error('Error al guardar empleado:', error);
        }
    };

    // Título dinámico
    const modalTitle = employeeId ? 'Editar Empleado' : title;

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={'90vw'}
            style={{ maxWidth: '80vw', minWidth: 320 }}
            centered={true}
            styles={{ body: { minHeight: '60vh', maxHeight: '90vh', padding: '2vw' } }}
            destroyOnHidden={true}
        >
            <EmployeeForm
                form={form}
                onFinish={handleSubmit}
                loading={loading}
                initialValues={{}}
                visible={visible}
                employeeId={employeeId}
            />
        </Modal>
    );
};

export default EmployeeModal;
