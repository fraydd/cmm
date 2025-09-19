import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Button, Typography, Space, DatePicker, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const { Text } = Typography;


export default function EditCashRegisterModal({ open, onClose, record }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [editId, setEditId] = useState(null);
  const [closeCash, setCloseCash] = useState(false);

  useEffect(() => {
    if (open && record) {
      console.log('EditCashRegisterModal record:', record);
      setEditId(record.id || null);
      setCloseCash(record.status === 'closed');
      form.setFieldsValue({
        final_amount: record.final_amount || 0,
        observations: record.observations || '',
        // Convertir de UTC a local para mostrar correctamente en el DatePicker
        closing_date: record.closing_date ? dayjs.utc(record.closing_date).local() : null,
      });
    }
    if (!open) {
      setEditId(null);
      setCloseCash(false);
      form.resetFields();
    }
  }, [open, record, form]);

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      let closingDateValue = null;
      if (!values.closing_date) {
        // Si no hay fecha, usar la actual en UTC
        const nowUtc = dayjs.utc();
        closingDateValue = nowUtc.format('YYYY-MM-DD HH:mm:ss');
      } else if (dayjs(values.closing_date).isValid()) {
        closingDateValue = dayjs(values.closing_date).utc().format('YYYY-MM-DD HH:mm:ss');
      } else {
        const nowUtc = dayjs.utc();
        closingDateValue = nowUtc.format('YYYY-MM-DD HH:mm:ss');
      }
      const payload = {
        id: editId,
        final_amount: values.final_amount,
        status: closeCash ? 'closed' : record.status,
        observations: values.observations || '',
        closing_date: closingDateValue,
      };


      const response = await fetch('/admin/cash-register/edit', {
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
        throw new Error(errorData.message || 'Error al editar la caja');
      }
      showSuccess('Caja editada correctamente');
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al editar la caja');
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
          <span>Editar Caja</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ final_amount: 0, observations: '', closing_date: null }}
      >
        <Form.Item label="¿Desea cerrar la caja?">
          <Switch checked={closeCash} onChange={setCloseCash} checkedChildren="Sí" unCheckedChildren="No" />
        </Form.Item>
        <Form.Item
          name="final_amount"
          label={<span>Monto final</span>}
          rules={[{ required: true, message: 'Ingrese el monto final' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} prefix="$" placeholder="0.00" />
        </Form.Item>
        <Form.Item
          name="closing_date"
          label="Fecha de cierre"
        >
          <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm:ss" placeholder="Seleccione la fecha de cierre" />
        </Form.Item>
        <Form.Item
          name="observations"
          label="Observaciones"
        >
          <Input.TextArea rows={3} placeholder="Observaciones (opcional)" />
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
