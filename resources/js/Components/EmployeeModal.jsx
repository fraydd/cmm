import React, { useState } from 'react';
import { Modal, Form } from 'antd';
import EmployeeForm from './EmployeeForm';

const EmployeeModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
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

    return (
        <Modal
            title={title}
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
            />
        </Modal>
    );
};

export default EmployeeModal;
