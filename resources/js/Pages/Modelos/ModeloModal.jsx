import React, { useState, useRef } from 'react';
import { Modal, Form } from 'antd';
import ModeloForm from './ModeloForm';

const ModeloModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    modeloId = null, // Nuevo prop para modo edición
    title = "Nuevo Modelo",
    initialValues = {},
    loading = false 
}) => {
    const [form] = Form.useForm();
    const modeloFormRef = useRef(null);

    const handleCancel = () => {
        // Solo limpiar cuando el usuario cancela explícitamente
        if (modeloFormRef.current && modeloFormRef.current.clearForm) {
            modeloFormRef.current.clearForm();
        } else {
            form.resetFields();
        }
        onCancel();
    };

    const handleSubmit = async (values) => {
        try {
            await onSubmit(values);
            // Solo resetear los campos si el submit fue exitoso
            if (modeloFormRef.current && modeloFormRef.current.clearForm) {
                modeloFormRef.current.clearForm();
            } else {
                form.resetFields();
            }
        } catch (error) {
            // NO resetear los campos aquí para preservar los datos del usuario
            console.error('Error al guardar modelo:', error);
            throw error; // Importante: relanzar el error para que se muestre al usuario
        }
    };

    // Título dinámico
    const modalTitle = modeloId ? 'Editar Modelo' : title;

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
            <ModeloForm
                ref={modeloFormRef}
                form={form}
                onFinish={handleSubmit}
                loading={loading}
                initialValues={{}}
                visible={visible}
                modeloId={modeloId} // Pasar el ID del modelo al formulario
            />
        </Modal>
    );
};

export default ModeloModal; 