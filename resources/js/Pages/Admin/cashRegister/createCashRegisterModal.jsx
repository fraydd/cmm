import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Button, message, Typography, Space } from 'antd';
import { DollarOutlined, HomeOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';


const { Text } = Typography;

export default function createCashRegisterModal({ open, onClose, record, branchOptions }) {
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
        initial_amount: values.initial_amount,
        observations: values.observations || ''
      };
      const response = await fetch('/admin/cash-register/open', {
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
        throw new Error(errorData.message || 'Error al abrir la caja');
      }
      showSuccess('Caja abierta correctamente');
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al abrir la caja');
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
          <DollarOutlined />
          <span>Apertura de Caja</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ branch_id: undefined, initial_amount: 0, observations: '' }}
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
          name="initial_amount"
          label={<span><DollarOutlined /> Monto inicial</span>}
          rules={[{ required: true, message: 'Ingrese el monto inicial' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} prefix="$" placeholder="0.00" />
        </Form.Item>
        <Form.Item
          name="observations"
          label="Observaciones"
        >
          <Input.TextArea rows={3} placeholder="Observaciones (opcional)" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleGuardar} loading={loading} block>
            Abrir Caja
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}