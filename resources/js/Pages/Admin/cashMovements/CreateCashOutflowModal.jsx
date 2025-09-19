import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Button, Typography, Space } from 'antd';
import { MinusCircleOutlined, HomeOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';

const { Text } = Typography;

export default function CreateCashOutflowModal({ open, onClose, branchOptions }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      
      const payload = {
        branch_id: values.branch_id,
        amount: values.amount,
        beneficiary_identification: values.beneficiary_identification,
        observations: values.observations || ''
      };

      const response = await fetch('/admin/cash-movements/createEgreso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el egreso');
      }

      showSuccess('Egreso registrado correctamente');
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al registrar el egreso');
    }
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          <MinusCircleOutlined />
          <span>Registrar Egreso</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ 
          branch_id: undefined, 
          amount: 0, 
          beneficiary_identification: '', 
          observations: '' 
        }}
      >
        <Form.Item
          name="branch_id"
          label={<span><HomeOutlined /> Sede</span>}
          rules={[{ required: true, message: 'Seleccione la sede' }]}
        >
          <Select placeholder="Seleccione la sede">
            {Array.isArray(branchOptions) && branchOptions.map(branch => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label={<span><DollarOutlined /> Monto del egreso</span>}
          rules={[
            { required: true, message: 'Ingrese el monto del egreso' },
            { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' }
          ]}
        >
          <InputNumber 
            min={0.01} 
            style={{ width: '100%' }} 
            prefix="$" 
            placeholder="0.00"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="beneficiary_identification"
          label={<span><UserOutlined /> Identificación del beneficiario</span>}
          rules={[
            { required: true, message: 'Ingrese la identificación del beneficiario' },
            { 
              pattern: /^[0-9]+$/, 
              message: 'La identificación debe contener solo números' 
            },
            { 
              min: 6, 
              message: 'La identificación debe tener al menos 6 caracteres' 
            }
          ]}
        >
          <Input 
            placeholder="Número de identificación (CC, NIT, etc.)"
            maxLength={15}
          />
        </Form.Item>

        <Form.Item
          name="observations"
          label="Observaciones"
          rules={[
            { required: true, message: 'Las observaciones son requeridas para egresos' }
          ]}
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Describa el motivo del egreso..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            onClick={handleGuardar} 
            loading={loading} 
            block
            danger
          >
            Registrar Egreso
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}