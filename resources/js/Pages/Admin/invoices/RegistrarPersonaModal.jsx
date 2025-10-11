import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';

const { Text } = Typography;

export default function RegistrarPersonaModal({ open, onClose, onPersonCreated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Limpiar formulario al abrir el modal
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch('/admin/invoices/createPerson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          // Errores de validación
          const errors = data.errors || {};
          Object.keys(errors).forEach(field => {
            form.setFields([{
              name: field,
              errors: errors[field]
            }]);
          });
          throw new Error(data.message || 'Error de validación');
        } else {
          throw new Error(data.message || 'Error al registrar la persona');
        }
      }

      showSuccess('Persona registrada correctamente');
      setLoading(false);
      
      // Notificar al componente padre que se creó una persona
      if (onPersonCreated) {
        onPersonCreated();
      }
      
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al registrar la persona');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          <TeamOutlined />
          <span>Agregar Nueva Persona</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="first_name"
          label={<span><UserOutlined /> Nombre</span>}
          rules={[
            { required: true, message: 'Ingrese el nombre' },
            { max: 255, message: 'Máximo 255 caracteres' }
          ]}
        >
          <Input
            placeholder="Nombre de la persona"
            maxLength={255}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="last_name"
          label={<span><UserOutlined /> Apellido</span>}
          rules={[
            { max: 255, message: 'Máximo 255 caracteres' }
          ]}
        >
          <Input
            placeholder="Apellido de la persona (opcional)"
            maxLength={255}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="identification_number"
          label={<span><IdcardOutlined /> Identificación</span>}
          rules={[
            { required: true, message: 'Ingrese el número de identificación' },
            { max: 50, message: 'Máximo 50 caracteres' }
          ]}
        >
          <Input
            placeholder="Cédula, pasaporte o documento de identidad"
            maxLength={50}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<span><PhoneOutlined /> Teléfono</span>}
          rules={[
            { max: 20, message: 'Máximo 20 caracteres' }
          ]}
        >
          <Input
            placeholder="Número de teléfono (opcional)"
            maxLength={20}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span><MailOutlined /> Correo Electrónico</span>}
          rules={[
            { type: 'email', message: 'Ingrese un correo válido' },
            { max: 255, message: 'Máximo 255 caracteres' }
          ]}
        >
          <Input
            placeholder="correo@ejemplo.com (opcional)"
            maxLength={255}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            block
          >
            Registrar Persona
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
