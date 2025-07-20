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
            width={'90vw'}
            style={{ maxWidth: '80vw', minWidth: 320 }}
            centered={true}
            styles={{ body: { minHeight: '60vh', maxHeight: '90vh', padding: '2vw' } }}
            destroyOnClose={true}
        >
            <ModeloForm
                form={form}
                onFinish={handleSubmit}
                loading={loading}
                initialValues={{}}
                visible={visible}
            />
        </Modal>
    );
};

export default ModeloModal; 