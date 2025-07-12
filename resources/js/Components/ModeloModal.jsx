import React, { useState } from 'react';
import { Modal, Form } from 'antd';
import ModeloForm from './ModeloForm';

const ModeloModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    title = "Nuevo Modelo",
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
            console.error('Error al guardar modelo:', error);
        }
    };

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={900}
            style={{ top: 20 }}
            styles={{ body: { height: 650, padding: '24px' } }}
        >
            <ModeloForm
                form={form}
                onFinish={handleSubmit}
                loading={loading}
                initialValues={initialValues}
            />
        </Modal>
    );
};

export default ModeloModal; 