import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Button, Typography, Space, DatePicker } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const { Text } = Typography;

export default function EditCashMovementModal({ open, onClose, record }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (open && record) {
      console.log('EditCashMovementModal record:', record);
      setEditId(record.id || null);
      
      // Limpiar el monto removiendo el símbolo $ y puntos de miles
      const cleanAmount = record.monto 
        ? parseFloat(record.monto.replace(/[$\s.]/g, '').replace(',', '.')) 
        : 0;
      
      form.setFieldsValue({
        amount: cleanAmount,
        observations: record.observations || '',
        // Convertir de UTC a local para mostrar correctamente en el DatePicker
        movement_date: record.fecha ? dayjs.utc(record.fecha).local() : null,
      });
    }
    if (!open) {
      setEditId(null);
      form.resetFields();
    }
  }, [open, record, form]);

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      
      let movementDateValue = null;
      if (!values.movement_date) {
        // Si no hay fecha, usar la actual en UTC
        const nowUtc = dayjs.utc();
        movementDateValue = nowUtc.format('YYYY-MM-DD HH:mm:ss');
      } else if (dayjs(values.movement_date).isValid()) {
        movementDateValue = dayjs(values.movement_date).utc().format('YYYY-MM-DD HH:mm:ss');
      } else {
        const nowUtc = dayjs.utc();
        movementDateValue = nowUtc.format('YYYY-MM-DD HH:mm:ss');
      }

      const payload = {
        id: editId,
        amount: values.amount,
        observations: values.observations || '',
        movement_date: movementDateValue,
        payment_id: record.payment_id,
        movement_type: record.movement_type
      };

      const response = await fetch('/admin/cash-movements/edit', {
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
        throw new Error(errorData.message || 'Error al editar el movimiento');
      }

      showSuccess('Movimiento editado correctamente');
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al editar el movimiento');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          <EditOutlined />
          <span>Editar Movimiento</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ amount: 0, observations: '', movement_date: null }}
      >
        <Form.Item
          name="amount"
          label={<span>Monto</span>}
          rules={[
            { required: true, message: 'Ingrese el monto' },
            { type: 'number', min: 0, message: 'El monto debe ser mayor o igual a 0' }
          ]}
        >
          <InputNumber 
            min={0} 
            style={{ width: '100%' }} 
            prefix="$" 
            placeholder="0.00"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="movement_date"
          label="Fecha del movimiento"
          rules={[{ required: true, message: 'Seleccione la fecha del movimiento' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            showTime 
            format="YYYY-MM-DD HH:mm:ss" 
            placeholder="Seleccione la fecha del movimiento" 
          />
        </Form.Item>

        <Form.Item
          name="observations"
          label="Observaciones"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Observaciones adicionales (opcional)" 
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleGuardar} loading={loading} block>
            Guardar
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}